'use server'

import { extractUploadedDocumentText } from '@/lib/files/extract-uploaded-document-text'
import { highlightLinesFromMultiline } from '@/lib/profile/highlight-lines'
import { normalizeSalaryFloorCurrency } from '@/lib/profile/salary-currency'
import { refresh, revalidatePath } from 'next/cache'

import { generateProfileWorkspace } from '@/lib/ai/tasks/generate-profile-workspace'
import { getActiveOperatorContext } from '@/lib/data/operators'
import type {
  OperatorPortfolioItemRecord,
  ResumeAchievementRecord,
  ResumeEducationRecord,
  ResumeExperienceRecord,
} from '@/lib/domain/types'
import { hasOpenAIEnv, hasSupabaseServerEnv } from '@/lib/env'
import { ensurePrimaryImportedJobs } from '@/lib/jobs/real-feed'
import { createClient } from '@/lib/supabase/server'

export interface ProfileActionState {
  message: string
  status: 'error' | 'idle' | 'success'
}

interface ParseResult<T> {
  error?: string
  items: T[]
}

interface UploadedSourceDocument {
  fileName: string | null
  parsedText: string | null
}

function isMarkdownSourceFileName(value: string) {
  return /\.(md|markdown)$/i.test(value.trim())
}

function asTextValue(value: FormDataEntryValue | null) {
  return String(value ?? '').trim()
}

function asOptionalText(value: FormDataEntryValue | null) {
  const text = asTextValue(value)
  return text.length > 0 ? text : null
}

function asOptionalUnknownText(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function asList(value: FormDataEntryValue | null) {
  return String(value ?? '')
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function asOptionalInteger(value: FormDataEntryValue | null) {
  const raw = asTextValue(value)

  if (!raw) {
    return null
  }

  const parsed = Number.parseInt(raw, 10)

  return Number.isFinite(parsed) ? parsed : null
}

function asUploadedFile(value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size <= 0 || !value.name) {
    return null
  }

  return value
}

function asRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

async function resolveUploadedSourceDocument(options: {
  acceptedKinds?: 'markdown-only' | 'any-supported'
  existingParsedText: string | null
  file: File | null
  fileName: string | null
  label: string
}): Promise<UploadedSourceDocument> {
  const { acceptedKinds = 'any-supported', existingParsedText, file, fileName, label } = options

  if (file) {
    if (acceptedKinds === 'markdown-only' && !isMarkdownSourceFileName(file.name)) {
      throw new Error(`${label} must be uploaded as a .md file.`)
    }

    const parsedText = await extractUploadedDocumentText(file)

    if (!parsedText) {
      throw new Error(
        acceptedKinds === 'markdown-only'
          ? `${label} could not be read. Upload a valid .md file.`
          : `${label} could not be parsed into readable text. Try another PDF, DOC, or DOCX file.`,
      )
    }

    return {
      fileName: file.name,
      parsedText,
    }
  }

  if (!fileName) {
    return {
      fileName: null,
      parsedText: null,
    }
  }

  if (acceptedKinds === 'markdown-only' && !isMarkdownSourceFileName(fileName)) {
    return {
      fileName: null,
      parsedText: null,
    }
  }

  return {
    fileName,
    parsedText: existingParsedText,
  }
}

function asFieldArray(formData: FormData, name: string) {
  return formData.getAll(name).map((value) => String(value ?? '').trim())
}

function hasMeaningfulRow(values: Array<string | string[]>) {
  return values.some((value) =>
    Array.isArray(value) ? value.some((item) => item.length > 0) : value.length > 0,
  )
}

function asBooleanChoice(value: string, fallback = false) {
  if (value === 'true') {
    return true
  }

  if (value === 'false') {
    return false
  }

  return fallback
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function asRating(value: string) {
  if (!value) {
    return null
  }

  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed)) {
    return null
  }

  return Math.min(5, Math.max(1, parsed))
}

function fillBlankText(currentValue: string | null, fallbackValue: string) {
  const current = currentValue?.trim() ?? ''
  return current || fallbackValue.trim()
}

function fillBlankList(currentValues: string[], fallbackValues: string[]) {
  return currentValues.length > 0 ? currentValues : fallbackValues
}

function toPostgresInList(values: string[]) {
  return `(${values.map((value) => `"${value}"`).join(',')})`
}

function parseExperienceEntries(formData: FormData): ParseResult<ResumeExperienceRecord> {
  const roleTitles = asFieldArray(formData, 'experienceRoleTitle')
  const companyNames = asFieldArray(formData, 'experienceCompanyName')
  const locationLabels = asFieldArray(formData, 'experienceLocationLabel')
  const startDates = asFieldArray(formData, 'experienceStartDate')
  const endDates = asFieldArray(formData, 'experienceEndDate')
  const summaries = asFieldArray(formData, 'experienceSummary')
  const highlights = asFieldArray(formData, 'experienceHighlights').map((value) =>
    highlightLinesFromMultiline(value),
  )

  const count = Math.max(
    roleTitles.length,
    companyNames.length,
    locationLabels.length,
    startDates.length,
    endDates.length,
    summaries.length,
    highlights.length,
  )

  const items: ResumeExperienceRecord[] = []

  for (let index = 0; index < count; index += 1) {
    const item: ResumeExperienceRecord = {
      companyName: companyNames[index] ?? '',
      roleTitle: roleTitles[index] ?? '',
      locationLabel: locationLabels[index] ?? '',
      startDate: startDates[index] ?? '',
      endDate: endDates[index] ?? '',
      summary: summaries[index] ?? '',
      highlights: highlights[index] ?? [],
    }

    if (!hasMeaningfulRow([item.companyName, item.roleTitle, item.summary, item.highlights])) {
      continue
    }

    if (!item.companyName || !item.roleTitle) {
      return {
        error: `Experience entry ${index + 1} needs both a company name and a role title.`,
        items: [],
      }
    }

    items.push(item)
  }

  return { items }
}

function parseAchievementBank(formData: FormData): ParseResult<ResumeAchievementRecord> {
  const categories = asFieldArray(formData, 'achievementCategory')
  const titles = asFieldArray(formData, 'achievementTitle')
  const details = asFieldArray(formData, 'achievementDetail')
  const count = Math.max(categories.length, titles.length, details.length)
  const items: ResumeAchievementRecord[] = []

  for (let index = 0; index < count; index += 1) {
    const item: ResumeAchievementRecord = {
      category: categories[index] ?? '',
      title: titles[index] ?? '',
      detail: details[index] ?? '',
    }

    if (!hasMeaningfulRow([item.category, item.title, item.detail])) {
      continue
    }

    if (!item.title || !item.detail) {
      return {
        error: `Achievement entry ${index + 1} needs both a title and a detail.`,
        items: [],
      }
    }

    items.push(item)
  }

  return { items }
}

function parseEducationEntries(formData: FormData): ParseResult<ResumeEducationRecord> {
  const schoolNames = asFieldArray(formData, 'educationSchoolName')
  const credentials = asFieldArray(formData, 'educationCredential')
  const fieldsOfStudy = asFieldArray(formData, 'educationFieldOfStudy')
  const startDates = asFieldArray(formData, 'educationStartDate')
  const endDates = asFieldArray(formData, 'educationEndDate')
  const notes = asFieldArray(formData, 'educationNotes')
  const count = Math.max(
    schoolNames.length,
    credentials.length,
    fieldsOfStudy.length,
    startDates.length,
    endDates.length,
    notes.length,
  )

  const items: ResumeEducationRecord[] = []

  for (let index = 0; index < count; index += 1) {
    const item: ResumeEducationRecord = {
      schoolName: schoolNames[index] ?? '',
      credential: credentials[index] ?? '',
      fieldOfStudy: fieldsOfStudy[index] ?? '',
      startDate: startDates[index] ?? '',
      endDate: endDates[index] ?? '',
      notes: notes[index] ?? '',
    }

    if (!hasMeaningfulRow([item.schoolName, item.credential, item.fieldOfStudy, item.notes])) {
      continue
    }

    if (!item.schoolName || !item.credential) {
      return {
        error: `Education entry ${index + 1} needs both a school name and a credential.`,
        items: [],
      }
    }

    items.push(item)
  }

  return { items }
}

function parsePortfolioItems(formData: FormData): ParseResult<OperatorPortfolioItemRecord> {
  const ids = asFieldArray(formData, 'portfolioItemId')
  const titles = asFieldArray(formData, 'portfolioTitle')
  const urls = asFieldArray(formData, 'portfolioUrl')
  const projectTypes = asFieldArray(formData, 'portfolioProjectType')
  const roleLabels = asFieldArray(formData, 'portfolioRoleLabel')
  const summaries = asFieldArray(formData, 'portfolioSummary')
  const skillsTags = asFieldArray(formData, 'portfolioSkillsTags').map((value) => asList(value))
  const industryTags = asFieldArray(formData, 'portfolioIndustryTags').map((value) => asList(value))
  const outcomeMetrics = asFieldArray(formData, 'portfolioOutcomeMetrics').map((value) =>
    asList(value),
  )
  const visualStrengthRatings = asFieldArray(formData, 'portfolioVisualStrengthRating')
  const primaryChoices = asFieldArray(formData, 'portfolioIsPrimary')
  const activeChoices = asFieldArray(formData, 'portfolioIsActive')

  const count = Math.max(
    ids.length,
    titles.length,
    urls.length,
    projectTypes.length,
    roleLabels.length,
    summaries.length,
    skillsTags.length,
    industryTags.length,
    outcomeMetrics.length,
    visualStrengthRatings.length,
    primaryChoices.length,
    activeChoices.length,
  )

  const items: OperatorPortfolioItemRecord[] = []

  for (let index = 0; index < count; index += 1) {
    const item: OperatorPortfolioItemRecord = {
      id: ids[index] ?? '',
      title: titles[index] ?? '',
      url: urls[index] ?? '',
      projectType: projectTypes[index] ?? '',
      roleLabel: roleLabels[index] ?? '',
      summary: summaries[index] ?? '',
      skillsTags: skillsTags[index] ?? [],
      industryTags: industryTags[index] ?? [],
      outcomeMetrics: outcomeMetrics[index] ?? [],
      visualStrengthRating: visualStrengthRatings[index] ?? '',
      isPrimary: asBooleanChoice(primaryChoices[index] ?? 'false'),
      isActive: asBooleanChoice(activeChoices[index] ?? 'true', true),
    }

    if (
      !hasMeaningfulRow([
        item.title,
        item.url,
        item.projectType,
        item.roleLabel,
        item.summary,
        item.skillsTags,
        item.industryTags,
        item.outcomeMetrics,
      ])
    ) {
      continue
    }

    if (!item.id) {
      return {
        error: `Portfolio item ${index + 1} is missing its internal ID. Refresh the page and try again.`,
        items: [],
      }
    }

    if (!item.title || !item.url) {
      return {
        error: `Portfolio item ${index + 1} needs both a title and a URL.`,
        items: [],
      }
    }

    items.push(item)
  }

  return { items }
}

export async function saveOperatorProfile(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  if (!hasSupabaseServerEnv()) {
    return {
      message: 'Add the Supabase URL, publishable key, and service role key before trying to save profile changes.',
      status: 'error',
    }
  }

  const intent = asTextValue(formData.get('intent')) || 'save'
  const isGenerateProfileIntent = intent === 'generate-profile'

  const experienceResult = parseExperienceEntries(formData)
  const achievementResult = parseAchievementBank(formData)
  const educationResult = parseEducationEntries(formData)
  const portfolioResult = parsePortfolioItems(formData)

  const parseError =
    experienceResult.error ??
    achievementResult.error ??
    educationResult.error ??
    portfolioResult.error

  if (parseError) {
    return {
      message: parseError,
      status: 'error',
    }
  }

  const experienceEntries = experienceResult.items
  const achievementBank = achievementResult.items
  const educationEntries = educationResult.items
  const portfolioItems = portfolioResult.items
  let bioSummary = asOptionalText(formData.get('bioSummary')) ?? ''
  const coverLetterPdfFileName = asOptionalText(formData.get('coverLetterPdfFileName'))
  let headline = asTextValue(formData.get('headline'))
  let searchBrief = asOptionalText(formData.get('searchBrief')) ?? ''
  let targetRoles = asList(formData.get('targetRoles'))
  let allowedAdjacentRoles = asList(formData.get('allowedAdjacentRoles'))
  let targetSeniorityLevels = asList(formData.get('targetSeniorityLevels'))
  let skills = asList(formData.get('skills'))
  let tools = asList(formData.get('tools'))
  let resumeSkillsSection = asList(formData.get('resumeSkillsSection'))
  const certifications = asList(formData.get('certifications'))
  const derivedPortfolioPrimaryUrl =
    asOptionalText(formData.get('portfolioPrimaryUrl')) ??
    portfolioItems.find((item) => item.isPrimary && item.isActive)?.url ??
    portfolioItems.find((item) => item.isActive)?.url ??
    null
  const portfolioPdfFileName = asOptionalText(formData.get('portfolioPdfFileName'))
  const resumePdfFileName = asOptionalText(formData.get('resumePdfFileName'))
  const hiringMarkets = asList(formData.get('hiringMarkets'))
  const primaryMarket = hiringMarkets[0] ?? asOptionalText(formData.get('primaryMarket')) ?? ''
  const secondaryMarkets = hiringMarkets.slice(1)

  const supabase = createClient()
  const displayName = asOptionalText(formData.get('displayName'))
  const operatorContext = await getActiveOperatorContext()

  if (!operatorContext || !operatorContext.profileId || !operatorContext.resumeMasterId) {
    return {
      message: 'Choose an operator before saving profile changes.',
      status: 'error',
    }
  }

  const { data: existingResumeMasterRow, error: existingResumeMasterError } = await supabase
    .from('resume_master')
    .select('source_content')
    .eq('id', operatorContext.resumeMasterId)
    .maybeSingle()

  if (existingResumeMasterError) {
    return {
      message: existingResumeMasterError.message,
      status: 'error',
    }
  }

  const existingSourceContent = asRecord(existingResumeMasterRow?.source_content)

  let parsedResumeDocument: UploadedSourceDocument
  let parsedCoverLetterDocument: UploadedSourceDocument
  let parsedPortfolioDocument: UploadedSourceDocument

  try {
    ;[parsedResumeDocument, parsedCoverLetterDocument, parsedPortfolioDocument] = await Promise.all([
      resolveUploadedSourceDocument({
        existingParsedText: asOptionalUnknownText(existingSourceContent?.resumeDocumentText),
        file: asUploadedFile(formData.get('resumePdfUpload')),
        fileName: resumePdfFileName,
        label: 'Source resume',
        acceptedKinds: 'markdown-only',
      }),
      resolveUploadedSourceDocument({
        existingParsedText: asOptionalUnknownText(existingSourceContent?.coverLetterDocumentText),
        file: asUploadedFile(formData.get('coverLetterPdfUpload')),
        fileName: coverLetterPdfFileName,
        label: 'Source cover letter',
        acceptedKinds: 'markdown-only',
      }),
      resolveUploadedSourceDocument({
        existingParsedText: asOptionalUnknownText(existingSourceContent?.portfolioDocumentText),
        file: asUploadedFile(formData.get('portfolioPdfUpload')),
        fileName: portfolioPdfFileName,
        label: 'Portfolio file',
      }),
    ])
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : 'One of the uploaded documents could not be parsed.',
      status: 'error',
    }
  }

  if (isGenerateProfileIntent) {
    if (!hasOpenAIEnv()) {
      return {
        message: 'Add the OpenAI server environment before generating a profile draft.',
        status: 'error',
      }
    }

    try {
      if (!parsedResumeDocument.parsedText?.trim() || !parsedCoverLetterDocument.parsedText?.trim()) {
        return {
          message: 'Upload both source markdown files before generating a profile.',
          status: 'error',
        }
      }

      const generated = await generateProfileWorkspace({
        sourceCoverLetterMarkdown: parsedCoverLetterDocument.parsedText,
        sourceResumeMarkdown: parsedResumeDocument.parsedText,
      })

      headline = fillBlankText(headline, generated.headline)
      bioSummary = fillBlankText(bioSummary, generated.bioSummary)
      searchBrief = fillBlankText(searchBrief, generated.searchBrief)
      targetRoles = fillBlankList(targetRoles, generated.targetRoles)
      allowedAdjacentRoles = fillBlankList(allowedAdjacentRoles, generated.allowedAdjacentRoles)
      targetSeniorityLevels = fillBlankList(targetSeniorityLevels, generated.targetSeniorityLevels)
      skills = fillBlankList(skills, generated.skills)
      tools = fillBlankList(tools, generated.tools)
      resumeSkillsSection = fillBlankList(resumeSkillsSection, generated.skills)
    } catch (error) {
      return {
        message:
          error instanceof Error
            ? error.message
            : 'Profile generation could not finish from the current source text.',
        status: 'error',
      }
    }
  }

  if (!headline) {
    return {
      message: 'Headline is required so scoring and packet generation have a stable role anchor.',
      status: 'error',
    }
  }

  const primarySeniorityLevel =
    targetSeniorityLevels[0] ?? asOptionalText(formData.get('seniorityLevel')) ?? ''

  const userPayload = {
    account_status: 'active',
    auth_provider: 'internal',
    display_name: displayName,
    email: operatorContext.operator.email,
    id: operatorContext.userId,
    is_internal: true,
  }

  const operatorPayload = {
    display_name: displayName ?? operatorContext.operator.displayName,
    email: operatorContext.operator.email,
    id: operatorContext.operator.id,
    slug: operatorContext.operator.slug,
  }

  const profilePayload = {
    id: operatorContext.profileId,
    operator_id: operatorContext.operator.id,
    user_id: operatorContext.userId,
    search_brief: searchBrief,
    headline,
    location_label: asOptionalText(formData.get('locationLabel')) ?? '',
    timezone: asOptionalText(formData.get('timezone')) ?? 'America/Toronto',
    remote_required: formData.get('remoteRequired') === 'on',
    primary_market: primaryMarket,
    secondary_markets: secondaryMarkets,
    allowed_remote_regions: asList(formData.get('allowedRemoteRegions')),
    timezone_tolerance_hours: null,
    relocation_open: formData.get('relocationOpen') === 'on',
    salary_floor_currency: normalizeSalaryFloorCurrency(asTextValue(formData.get('salaryFloorCurrency'))),
    salary_floor_amount: null,
    salary_target_min: asOptionalInteger(formData.get('salaryTargetMin')),
    salary_target_max: asOptionalInteger(formData.get('salaryTargetMax')),
    seniority_level: primarySeniorityLevel,
    target_seniority_levels: targetSeniorityLevels,
    target_roles: targetRoles,
    allowed_adjacent_roles: allowedAdjacentRoles,
    industries_preferred: asList(formData.get('industriesPreferred')),
    industries_avoid: [],
    skills,
    tools,
    work_authorization_notes: '',
    portfolio_primary_url: derivedPortfolioPrimaryUrl,
    linkedin_url: asOptionalText(formData.get('linkedinUrl')),
    personal_site_url: asOptionalText(formData.get('personalSiteUrl')),
    bio_summary: bioSummary || null,
    experience_summary: experienceEntries,
    education_summary: educationEntries,
    preferences_notes: '',
  }

  const resumePayload = {
    id: operatorContext.resumeMasterId,
    operator_id: operatorContext.operator.id,
    user_id: operatorContext.userId,
    base_title: headline,
    base_cover_letter_text: parsedCoverLetterDocument.parsedText || null,
    summary_text: parsedResumeDocument.parsedText || null,
    experience_entries: experienceEntries,
    achievement_bank: achievementBank,
    skills_section: resumeSkillsSection,
    education_entries: educationEntries,
    certifications,
    links: {
      linkedin: asOptionalText(formData.get('linkedinUrl')),
      portfolio: derivedPortfolioPrimaryUrl,
      website: asOptionalText(formData.get('personalSiteUrl')),
    },
    source_format: 'structured_json',
    source_content: {
      achievementCount: achievementBank.length,
      coverLetterDocumentText: parsedCoverLetterDocument.parsedText,
      coverLetterPdfFileName: parsedCoverLetterDocument.fileName,
      educationCount: educationEntries.length,
      experienceCount: experienceEntries.length,
      portfolioItemCount: portfolioItems.length,
      portfolioDocumentText:
        parsedPortfolioDocument.parsedText ??
        asOptionalUnknownText(existingSourceContent?.portfolioDocumentText) ??
        null,
      portfolioPdfFileName:
        parsedPortfolioDocument.fileName ??
        asOptionalUnknownText(existingSourceContent?.portfolioPdfFileName) ??
        null,
      resumeDocumentText: parsedResumeDocument.parsedText,
      resumePdfFileName: parsedResumeDocument.fileName,
      searchBrief,
      updatedFrom: 'profile-workspace',
    },
  }

  const [userResult, operatorResult, profileResult, resumeResult] = await Promise.all([
    supabase.from('users').upsert(userPayload, { onConflict: 'id' }),
    supabase.from('operators').upsert(operatorPayload, { onConflict: 'id' }),
    supabase.from('user_profiles').upsert(profilePayload, { onConflict: 'id' }),
    supabase.from('resume_master').upsert(resumePayload, { onConflict: 'id' }),
  ])

  if (userResult.error || operatorResult.error || profileResult.error || resumeResult.error) {
    return {
      message:
        userResult.error?.message ??
        operatorResult.error?.message ??
        profileResult.error?.message ??
        resumeResult.error?.message ??
        'Supabase rejected the profile update.',
      status: 'error',
    }
  }

  const portfolioPayload = portfolioItems.map((item) => ({
    id: item.id,
    operator_id: operatorContext.operator.id,
    user_id: operatorContext.userId,
    title: item.title,
    slug: toSlug(item.title),
    url: item.url,
    project_type: item.projectType || 'general design',
    role_label: item.roleLabel || 'designer',
    summary: item.summary || null,
    skills_tags: item.skillsTags,
    industry_tags: item.industryTags,
    outcome_metrics: item.outcomeMetrics,
    visual_strength_rating: asRating(item.visualStrengthRating),
    is_primary: item.isPrimary,
    is_active: item.isActive,
  }))

  if (portfolioPayload.length > 0) {
    const upsertResult = await supabase.from('portfolio_items').upsert(portfolioPayload, {
      onConflict: 'id',
    })

    if (upsertResult.error) {
      return {
        message: upsertResult.error.message,
        status: 'error',
      }
    }

    const deleteResult = await supabase
      .from('portfolio_items')
      .delete()
      .eq('operator_id', operatorContext.operator.id)
      .not('id', 'in', toPostgresInList(portfolioPayload.map((item) => item.id)))

    if (deleteResult.error) {
      return {
        message: deleteResult.error.message,
        status: 'error',
      }
    }
  } else {
    const deleteResult = await supabase
      .from('portfolio_items')
      .delete()
      .eq('operator_id', operatorContext.operator.id)

    if (deleteResult.error) {
      return {
        message: deleteResult.error.message,
        status: 'error',
      }
    }
  }

  let rankingRefreshNote = ''

  try {
    const rankingRefresh = await ensurePrimaryImportedJobs({ force: true })

    if (rankingRefresh.issue) {
      rankingRefreshNote = ` Queue refresh note: ${rankingRefresh.issue}`
    }
  } catch (error) {
    rankingRefreshNote = ` Queue refresh note: ${
      error instanceof Error ? error.message : 'ranking refresh could not complete'
    }`
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/profile')

  if (isGenerateProfileIntent) {
    refresh()
  }

  return {
    message: isGenerateProfileIntent
      ? `${operatorPayload.display_name} workspace draft filled from the current source markdown files. Review the generated blanks and save again if you want to adjust anything.${rankingRefreshNote}`
      : `${operatorPayload.display_name} workspace saved with ${experienceEntries.length} experience entries and ${portfolioItems.length} portfolio items.${rankingRefreshNote}`,
    status: 'success',
  }
}

export async function resetProfileWorkspaceForTesting(
  _previousState: ProfileActionState,
  _formData: FormData,
): Promise<ProfileActionState> {
  void _previousState
  void _formData

  if (!hasSupabaseServerEnv()) {
    return {
      message: 'Add the Supabase server environment before resetting the testing workspace.',
      status: 'error',
    }
  }

  const operatorContext = await getActiveOperatorContext()

  if (!operatorContext || !operatorContext.profileId || !operatorContext.resumeMasterId) {
    return {
      message: 'Choose an operator before resetting the testing workspace.',
      status: 'error',
    }
  }

  const supabase = createClient()
  const now = new Date().toISOString()

  const { data: packetRows, error: packetLookupError } = await supabase
    .from('application_packets')
    .select('id, resume_version_id')
    .eq('operator_id', operatorContext.operator.id)

  if (packetLookupError) {
    return {
      message: packetLookupError.message,
      status: 'error',
    }
  }

  const packetIds = (packetRows ?? []).map((row) => asTextValue(row.id)).filter(Boolean)
  const resumeVersionIds = (packetRows ?? [])
    .map((row) => asTextValue(row.resume_version_id))
    .filter(Boolean)

  if (packetIds.length > 0) {
    const deleteAnswersResult = await supabase
      .from('application_answers')
      .delete()
      .eq('operator_id', operatorContext.operator.id)
      .in('application_packet_id', packetIds)

    if (deleteAnswersResult.error) {
      return {
        message: deleteAnswersResult.error.message,
        status: 'error',
      }
    }

    const resetPacketsResult = await supabase
      .from('application_packets')
      .update({
        cover_letter_draft: null,
        cover_letter_summary: null,
        generated_at: null,
        generation_error: null,
        generation_model: null,
        generation_prompt_version: null,
        generation_provider: null,
        generation_status: 'not_started',
        last_reviewed_at: null,
        manual_notes: null,
        packet_status: 'draft',
        professional_summary: null,
        question_snapshot_error: null,
        question_snapshot_refreshed_at: null,
        question_snapshot_status: 'not_started',
      })
      .eq('operator_id', operatorContext.operator.id)
      .in('id', packetIds)

    if (resetPacketsResult.error) {
      return {
        message: resetPacketsResult.error.message,
        status: 'error',
      }
    }
  }

  if (resumeVersionIds.length > 0) {
    const resetResumeVersionsResult = await supabase
      .from('resume_versions')
      .update({
        change_summary_text: null,
        experience_entries: [],
        export_status: 'draft',
        headline_text: null,
        highlighted_requirements: [],
        skills_section: [],
        summary_text: null,
        tailoring_notes: null,
      })
      .eq('operator_id', operatorContext.operator.id)
      .in('id', resumeVersionIds)

    if (resetResumeVersionsResult.error) {
      return {
        message: resetResumeVersionsResult.error.message,
        status: 'error',
      }
    }
  }

  const [resetWorkflowResult, resetProfileResult, resetResumeMasterResult, deletePortfolioResult] =
    await Promise.all([
      supabase
        .from('job_scores')
        .update({
          last_status_changed_at: now,
          workflow_status: 'ranked',
        })
        .eq('operator_id', operatorContext.operator.id),
      supabase.from('user_profiles').update({
        allowed_adjacent_roles: [],
        allowed_remote_regions: [],
        bio_summary: null,
        education_summary: [],
        experience_summary: [],
        headline: '',
        industries_avoid: [],
        industries_preferred: [],
        linkedin_url: null,
        location_label: '',
        personal_site_url: null,
        portfolio_primary_url: null,
        preferences_notes: null,
        primary_market: '',
        relocation_open: false,
        remote_required: true,
        salary_floor_amount: null,
        salary_floor_currency: 'USD',
        salary_target_max: null,
        salary_target_min: null,
        search_brief: '',
        secondary_markets: [],
        seniority_level: '',
        skills: [],
        target_roles: [],
        target_seniority_levels: [],
        timezone: 'America/Toronto',
        timezone_tolerance_hours: null,
        tools: [],
        work_authorization_notes: '',
      }).eq('id', operatorContext.profileId),
      supabase.from('resume_master').update({
        achievement_bank: [],
        base_cover_letter_text: null,
        base_title: '',
        certifications: [],
        education_entries: [],
        experience_entries: [],
        links: {},
        skills_section: [],
        source_content: {
          updatedFrom: 'profile-testing-reset',
        },
        summary_text: null,
      }).eq('id', operatorContext.resumeMasterId),
      supabase.from('portfolio_items').delete().eq('operator_id', operatorContext.operator.id),
    ])

  const failure =
    resetWorkflowResult.error ??
    resetProfileResult.error ??
    resetResumeMasterResult.error ??
    deletePortfolioResult.error

  if (failure) {
    return {
      message: failure.message,
      status: 'error',
    }
  }

  revalidatePath('/')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard?view=saved')
  revalidatePath('/dashboard?view=prepared')
  revalidatePath('/dashboard?view=applied')
  revalidatePath('/dashboard?view=archive')
  revalidatePath('/jobs')
  revalidatePath('/profile')
  refresh()

  return {
    message:
      'Testing state reset. All jobs are back in Potential, and the profile workspace is nearly blank again.',
    status: 'success',
  }
}
