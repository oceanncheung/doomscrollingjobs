'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { activeOperatorCookieName } from '@/lib/data/operators'
import { hasSupabaseServerEnv } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'

export interface OperatorSetupActionState {
  message: string
  status: 'error' | 'idle' | 'success'
}

function asTextValue(value: FormDataEntryValue | null) {
  return String(value ?? '').trim()
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function buildUniqueSlug(displayName: string, email: string) {
  const supabase = createClient()
  const baseSlug = normalizeSlug(displayName) || normalizeSlug(email.split('@')[0] ?? '') || 'operator'
  const { data } = await supabase.from('operators').select('slug')
  const existingSlugs = new Set(
    (data ?? [])
      .map((row) => (row && typeof row === 'object' ? String((row as { slug?: unknown }).slug ?? '') : ''))
      .filter(Boolean),
  )

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug
  }

  let suffix = 2

  while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1
  }

  return `${baseSlug}-${suffix}`
}

function defaultSearchBrief(displayName: string) {
  return `Find remote design roles that suit ${displayName}, prioritizing strong visual craft, thoughtful teams, and clear application value. Designers first, adjacent creative roles only when the fit is genuinely strong.`
}

export async function selectOperator(formData: FormData) {
  const operatorId = asTextValue(formData.get('operatorId'))

  if (!hasSupabaseServerEnv()) {
    redirect('/dashboard')
  }

  if (!operatorId) {
    redirect('/operators')
  }

  const supabase = createClient()
  const { data: operator } = await supabase
    .from('operators')
    .select('id')
    .eq('id', operatorId)
    .maybeSingle()

  if (!operator?.id) {
    redirect('/operators')
  }

  const cookieStore = await cookies()
  cookieStore.set(activeOperatorCookieName, operatorId, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  })

  revalidatePath('/')
  redirect('/dashboard')
}

export async function clearActiveOperatorSelection() {
  const cookieStore = await cookies()

  cookieStore.set(activeOperatorCookieName, '', {
    expires: new Date(0),
    httpOnly: false,
    path: '/',
    sameSite: 'lax',
  })

  revalidatePath('/')
  revalidatePath('/operators')
  redirect('/operators')
}

export async function createOperator(
  _previousState: OperatorSetupActionState,
  formData: FormData,
): Promise<OperatorSetupActionState> {
  if (!hasSupabaseServerEnv()) {
    return {
      message: 'Add the Supabase environment before creating operators.',
      status: 'error',
    }
  }

  const displayName = asTextValue(formData.get('displayName'))
  const email = asTextValue(formData.get('email')).toLowerCase()

  if (!displayName) {
    return {
      message: 'Display name is required.',
      status: 'error',
    }
  }

  if (!email || !isValidEmail(email)) {
    return {
      message: 'Enter a valid email address.',
      status: 'error',
    }
  }

  const supabase = createClient()
  const { data: existingOperator } = await supabase
    .from('operators')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingOperator?.id) {
    return {
      message: 'An operator with this email already exists.',
      status: 'error',
    }
  }

  const { data: existingUser, error: existingUserError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingUserError) {
    return {
      message: existingUserError.message,
      status: 'error',
    }
  }

  const operatorId = existingUser?.id ?? crypto.randomUUID()
  const profileId = crypto.randomUUID()
  const resumeMasterId = crypto.randomUUID()
  const slug = await buildUniqueSlug(displayName, email)

  const userPayload = {
    account_status: 'active',
    auth_provider: 'internal',
    display_name: displayName,
    email,
    id: operatorId,
    is_internal: true,
  }

  const operatorPayload = {
    display_name: displayName,
    email,
    id: operatorId,
    slug,
  }

  const profilePayload = {
    allowed_adjacent_roles: ['marketing designer', 'web designer', 'production designer', 'presentation designer'],
    allowed_remote_regions: ['Canada', 'United States', 'North America'],
    bio_summary: '',
    education_summary: [],
    experience_summary: [],
    headline: 'Graphic Designer',
    id: profileId,
    industries_avoid: [],
    industries_preferred: [],
    location_label: 'Toronto, Canada',
    operator_id: operatorId,
    portfolio_primary_url: '',
    preferences_notes: '',
    primary_market: 'Canada',
    relocation_open: false,
    remote_required: true,
    salary_floor_currency: 'USD',
    search_brief: defaultSearchBrief(displayName),
    secondary_markets: ['United States'],
    seniority_level: 'senior',
    skills: ['branding', 'visual systems', 'presentation design'],
    target_roles: ['graphic designer', 'brand designer', 'visual designer'],
    timezone: 'America/Toronto',
    timezone_tolerance_hours: 3,
    tools: ['Figma', 'Adobe Creative Suite'],
    user_id: operatorId,
    work_authorization_notes: '',
  }

  const resumePayload = {
    achievement_bank: [],
    base_title: 'Graphic Designer',
    certifications: [],
    education_entries: [],
    experience_entries: [],
    id: resumeMasterId,
    links: {},
    operator_id: operatorId,
    skills_section: ['branding', 'visual systems', 'presentation design'],
    source_content: {
      createdFrom: 'operator-setup',
    },
    source_format: 'structured_json',
    summary_text: '',
    user_id: operatorId,
  }

  const userResult = await supabase.from('users').upsert(userPayload, { onConflict: 'id' })

  if (userResult.error) {
    return {
      message: userResult.error.message,
      status: 'error',
    }
  }

  const operatorResult = await supabase.from('operators').upsert(operatorPayload, { onConflict: 'id' })

  if (operatorResult.error) {
    return {
      message: operatorResult.error.message,
      status: 'error',
    }
  }

  const [profileResult, resumeResult] = await Promise.all([
    supabase.from('user_profiles').insert(profilePayload),
    supabase.from('resume_master').insert(resumePayload),
  ])

  const failure = profileResult.error ?? resumeResult.error

  if (failure) {
    return {
      message: failure.message,
      status: 'error',
    }
  }

  const cookieStore = await cookies()
  cookieStore.set(activeOperatorCookieName, operatorId, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    sameSite: 'lax',
  })

  revalidatePath('/')
  revalidatePath('/operators')
  redirect('/profile')
}
