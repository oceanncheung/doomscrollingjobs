'use client'

import type { ReactNode } from 'react'
import { useActionState, useState } from 'react'

import type {
  OperatorPortfolioItemRecord,
  OperatorWorkspaceRecord,
  ResumeAchievementRecord,
  ResumeEducationRecord,
  ResumeExperienceRecord,
} from '@/lib/domain/types'

import { saveOperatorProfile, type ProfileActionState } from '@/app/profile/actions'

const initialState: ProfileActionState = {
  message: '',
  status: 'idle',
}

interface ProfileFormProps {
  workspace: OperatorWorkspaceRecord
}

function toTextAreaValue(values: string[]) {
  return values.join('\n')
}

function createUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replaceAll(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16)
    const value = character === 'x' ? random : (random & 0x3) | 0x8

    return value.toString(16)
  })
}

function createExperienceEntry(): ResumeExperienceRecord {
  return {
    companyName: '',
    roleTitle: '',
    locationLabel: '',
    startDate: '',
    endDate: '',
    summary: '',
    highlights: [],
  }
}

function createAchievementEntry(): ResumeAchievementRecord {
  return {
    category: '',
    title: '',
    detail: '',
  }
}

function createEducationEntry(): ResumeEducationRecord {
  return {
    schoolName: '',
    credential: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    notes: '',
  }
}

function createPortfolioItem(): OperatorPortfolioItemRecord {
  return {
    id: createUuid(),
    title: '',
    url: '',
    projectType: '',
    roleLabel: '',
    summary: '',
    skillsTags: [],
    industryTags: [],
    outcomeMetrics: [],
    visualStrengthRating: '',
    isPrimary: false,
    isActive: true,
  }
}

function AddRowButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button className="button button-secondary button-small" onClick={onClick} type="button">
      {label}
    </button>
  )
}

function DisclosureSection({
  children,
  defaultOpen = false,
  label,
  meta,
  title,
}: {
  children: ReactNode
  defaultOpen?: boolean
  label: string
  meta?: string
  title: string
}) {
  return (
    <details className="panel disclosure" open={defaultOpen}>
      <summary className="disclosure-summary">
        <div>
          <p className="panel-label">{label}</p>
          <h2>{title}</h2>
        </div>
        {meta ? <span className="disclosure-meta">{meta}</span> : null}
      </summary>
      <div className="disclosure-body">{children}</div>
    </details>
  )
}

export function ProfileForm({ workspace }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(saveOperatorProfile, initialState)
  const [experienceEntries, setExperienceEntries] = useState(
    workspace.resumeMaster.experienceEntries.length > 0
      ? workspace.resumeMaster.experienceEntries
      : [createExperienceEntry()],
  )
  const [achievementBank, setAchievementBank] = useState(
    workspace.resumeMaster.achievementBank.length > 0
      ? workspace.resumeMaster.achievementBank
      : [createAchievementEntry()],
  )
  const [educationEntries, setEducationEntries] = useState(
    workspace.resumeMaster.educationEntries.length > 0
      ? workspace.resumeMaster.educationEntries
      : [createEducationEntry()],
  )
  const [portfolioItems, setPortfolioItems] = useState(workspace.portfolioItems)

  return (
    <form action={formAction} className="profile-form">
      <section className="panel settings-section" id="source-files">
        <div className="settings-section-header">
          <div>
            <p className="panel-label">Source files</p>
            <h2>Keep the core source material current.</h2>
          </div>
          <p className="settings-section-note">
            Resume source and portfolio links stay visible here so the queue and prep workspace can
            update without digging through the full form.
          </p>
        </div>

        <div className="settings-source-grid">
          <div className="settings-source-primary">
            <label className="field">
              <span>Resume source</span>
              <textarea
                defaultValue={workspace.resumeMaster.summaryText}
                name="resumeSummaryText"
                rows={8}
              />
              <small>Use this as the base summary the packet workspace tailors per role.</small>
            </label>
          </div>

          <div className="settings-source-secondary">
            <label className="field">
              <span>Portfolio primary URL</span>
              <input
                defaultValue={workspace.profile.portfolioPrimaryUrl}
                name="portfolioPrimaryUrl"
                type="url"
              />
            </label>
            <label className="field">
              <span>LinkedIn URL</span>
              <input defaultValue={workspace.profile.linkedinUrl} name="linkedinUrl" type="url" />
            </label>
            <label className="field">
              <span>Personal site URL</span>
              <input
                defaultValue={workspace.profile.personalSiteUrl}
                name="personalSiteUrl"
                type="url"
              />
            </label>
          </div>

          <div className="settings-source-note">
            <p className="panel-label">Cover letter</p>
            <h3>Prepared per job</h3>
            <p>
              Cover letters stay inside packet prep, so the settings page only needs the core
              resume and portfolio source.
            </p>
            <a className="button button-secondary button-small" href="/dashboard?view=prepared">
              Open prepared queue
            </a>
          </div>
        </div>
      </section>

      <section className="panel settings-section">
        <div className="settings-section-header">
          <div>
            <p className="panel-label">What I&apos;m looking for</p>
            <h2>Shape the queue around the work you actually want.</h2>
          </div>
        </div>

        <div className="settings-core-grid">
          <label className="field settings-field-wide">
            <span>Queue brief</span>
            <textarea
              defaultValue={workspace.profile.searchBrief}
              name="searchBrief"
              rows={7}
            />
            <small>
              Write this like a direct note: target roles, salary, remote rules, industries, and
              hard no&apos;s.
            </small>
          </label>

          <label className="field">
            <span>Headline</span>
            <input defaultValue={workspace.profile.headline} name="headline" required type="text" />
          </label>
          <label className="field">
            <span>Location label</span>
            <input
              defaultValue={workspace.profile.locationLabel}
              name="locationLabel"
              type="text"
            />
          </label>
          <label className="field">
            <span>Primary market</span>
            <input
              defaultValue={workspace.profile.primaryMarket}
              name="primaryMarket"
              type="text"
            />
          </label>
          <label className="field">
            <span>Seniority level</span>
            <input
              defaultValue={workspace.profile.seniorityLevel}
              name="seniorityLevel"
              type="text"
            />
          </label>
          <label className="field">
            <span>Salary target min</span>
            <input
              defaultValue={workspace.profile.salaryTargetMin}
              name="salaryTargetMin"
              type="number"
            />
          </label>
          <label className="field">
            <span>Salary target max</span>
            <input
              defaultValue={workspace.profile.salaryTargetMax}
              name="salaryTargetMax"
              type="number"
            />
          </label>

          <label className="field settings-field-wide">
            <span>Target roles</span>
            <textarea
              defaultValue={toTextAreaValue(workspace.profile.targetRoles)}
              name="targetRoles"
              rows={5}
            />
          </label>
          <label className="field settings-field-wide">
            <span>Allowed adjacent roles</span>
            <textarea
              defaultValue={toTextAreaValue(workspace.profile.allowedAdjacentRoles)}
              name="allowedAdjacentRoles"
              rows={5}
            />
          </label>
        </div>

        <div className="settings-toggle-row">
          <label className="field checkbox-field">
            <span>Remote required</span>
            <input
              defaultChecked={workspace.profile.remoteRequired}
              name="remoteRequired"
              type="checkbox"
            />
          </label>
          <label className="field checkbox-field">
            <span>Open to relocation</span>
            <input
              defaultChecked={workspace.profile.relocationOpen}
              name="relocationOpen"
              type="checkbox"
            />
          </label>
        </div>
      </section>

      <DisclosureSection
        defaultOpen={false}
        label="Auto-derived signals"
        meta="collapsed"
        title="Review the source libraries when you need to."
      >
        <div className="field-grid field-grid-2">
          <label className="field">
            <span>Profile skills</span>
            <textarea
              defaultValue={toTextAreaValue(workspace.profile.skills)}
              name="skills"
              rows={6}
            />
          </label>
          <label className="field">
            <span>Tools</span>
            <textarea
              defaultValue={toTextAreaValue(workspace.profile.tools)}
              name="tools"
              rows={6}
            />
          </label>
          <label className="field">
            <span>Resume skills section</span>
            <textarea
              defaultValue={toTextAreaValue(workspace.resumeMaster.skillsSection)}
              name="resumeSkillsSection"
              rows={6}
            />
          </label>
          <label className="field">
            <span>Certifications</span>
            <textarea
              defaultValue={toTextAreaValue(workspace.resumeMaster.certifications)}
              name="certifications"
              rows={6}
            />
          </label>
        </div>

        <label className="field">
          <span>Professional summary</span>
          <textarea defaultValue={workspace.profile.bioSummary} name="bioSummary" rows={6} />
        </label>

        <DisclosureSection
          label="Experience history"
          meta={`${experienceEntries.length} entries`}
          title="Experience"
        >
          <div className="section-header">
            <AddRowButton
              label="Add experience"
              onClick={() => {
                setExperienceEntries((current) => [...current, createExperienceEntry()])
              }}
            />
          </div>
          <div className="repeat-list">
            {experienceEntries.map((entry, index) => (
              <article
                className="repeat-card"
                key={`${entry.companyName}-${entry.roleTitle}-${index}`}
              >
                <div className="repeat-card-header">
                  <strong>Experience {index + 1}</strong>
                  {experienceEntries.length > 1 ? (
                    <button
                      className="button button-ghost button-small"
                      onClick={() => {
                        setExperienceEntries((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }}
                      type="button"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="field-grid field-grid-2">
                  <label className="field">
                    <span>Role title</span>
                    <input
                    name="experienceRoleTitle"
                    onChange={(event) => {
                      setExperienceEntries((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, roleTitle: event.target.value } : item,
                        ),
                      )
                    }}
                    type="text"
                    value={entry.roleTitle}
                  />
                </label>
                <label className="field">
                  <span>Company name</span>
                  <input
                    name="experienceCompanyName"
                    onChange={(event) => {
                      setExperienceEntries((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, companyName: event.target.value }
                            : item,
                        ),
                      )
                    }}
                    type="text"
                    value={entry.companyName}
                  />
                </label>
                <label className="field">
                  <span>Location label</span>
                  <input
                    name="experienceLocationLabel"
                    onChange={(event) => {
                      setExperienceEntries((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, locationLabel: event.target.value }
                            : item,
                        ),
                      )
                    }}
                    type="text"
                    value={entry.locationLabel}
                  />
                </label>
                <label className="field">
                  <span>Start date</span>
                  <input
                    name="experienceStartDate"
                    onChange={(event) => {
                      setExperienceEntries((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, startDate: event.target.value }
                            : item,
                        ),
                      )
                    }}
                    placeholder="2024-01"
                    type="text"
                    value={entry.startDate}
                  />
                </label>
                <label className="field">
                  <span>End date</span>
                  <input
                    name="experienceEndDate"
                    onChange={(event) => {
                      setExperienceEntries((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, endDate: event.target.value } : item,
                        ),
                      )
                    }}
                    placeholder="Leave blank if current"
                    type="text"
                    value={entry.endDate}
                  />
                </label>
              </div>
              <label className="field">
                <span>Role summary</span>
                <textarea
                  name="experienceSummary"
                  onChange={(event) => {
                    setExperienceEntries((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, summary: event.target.value } : item,
                      ),
                    )
                  }}
                  rows={5}
                    value={entry.summary}
                  />
                </label>
                <label className="field">
                  <span>Highlights</span>
                  <textarea
                    name="experienceHighlights"
                    onChange={(event) => {
                      setExperienceEntries((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                highlights: event.target.value
                                  .split('\n')
                                  .map((line) => line.trim())
                                  .filter(Boolean),
                              }
                            : item,
                        ),
                      )
                    }}
                    rows={5}
                    value={toTextAreaValue(entry.highlights)}
                  />
                  <small>One bullet per line.</small>
                </label>
              </article>
            ))}
          </div>
        </DisclosureSection>

        <DisclosureSection
          label="Achievement bank"
          meta={`${achievementBank.length} entries`}
          title="Achievements"
        >
          <div className="section-header">
            <AddRowButton
              label="Add achievement"
              onClick={() => {
                setAchievementBank((current) => [...current, createAchievementEntry()])
              }}
            />
          </div>
          <div className="repeat-list">
            {achievementBank.map((achievement, index) => (
              <article className="repeat-card" key={`${achievement.title}-${index}`}>
                <div className="repeat-card-header">
                  <strong>Achievement {index + 1}</strong>
                  {achievementBank.length > 1 ? (
                    <button
                      className="button button-ghost button-small"
                      onClick={() => {
                        setAchievementBank((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }}
                      type="button"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="field-grid field-grid-2">
                  <label className="field">
                    <span>Category</span>
                    <input
                      name="achievementCategory"
                      onChange={(event) => {
                        setAchievementBank((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, category: event.target.value } : item,
                          ),
                        )
                      }}
                      type="text"
                      value={achievement.category}
                    />
                  </label>
                  <label className="field">
                    <span>Title</span>
                    <input
                      name="achievementTitle"
                      onChange={(event) => {
                        setAchievementBank((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, title: event.target.value } : item,
                          ),
                        )
                      }}
                      type="text"
                      value={achievement.title}
                    />
                  </label>
                </div>
                <label className="field">
                  <span>Detail</span>
                  <textarea
                    name="achievementDetail"
                    onChange={(event) => {
                      setAchievementBank((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, detail: event.target.value } : item,
                        ),
                      )
                    }}
                    rows={4}
                    value={achievement.detail}
                  />
                </label>
              </article>
            ))}
          </div>
        </DisclosureSection>

        <DisclosureSection
          label="Education"
          meta={`${educationEntries.length} entries`}
          title="Education"
        >
          <div className="section-header">
            <AddRowButton
              label="Add education"
              onClick={() => {
                setEducationEntries((current) => [...current, createEducationEntry()])
              }}
            />
          </div>
          <div className="repeat-list">
            {educationEntries.map((entry, index) => (
              <article
                className="repeat-card"
                key={`${entry.schoolName}-${entry.credential}-${index}`}
              >
                <div className="repeat-card-header">
                  <strong>Education {index + 1}</strong>
                  {educationEntries.length > 1 ? (
                    <button
                      className="button button-ghost button-small"
                      onClick={() => {
                        setEducationEntries((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }}
                      type="button"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="field-grid field-grid-2">
                  <label className="field">
                    <span>School name</span>
                    <input
                    name="educationSchoolName"
                    onChange={(event) => {
                      setEducationEntries((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, schoolName: event.target.value } : item,
                        ),
                      )
                    }}
                    type="text"
                    value={entry.schoolName}
                  />
                </label>
                <label className="field">
                  <span>Credential</span>
                  <input
                    name="educationCredential"
                    onChange={(event) => {
                      setEducationEntries((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, credential: event.target.value } : item,
                        ),
                      )
                    }}
                    type="text"
                    value={entry.credential}
                  />
                </label>
                <label className="field">
                  <span>Field of study</span>
                  <input
                    name="educationFieldOfStudy"
                    onChange={(event) => {
                      setEducationEntries((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, fieldOfStudy: event.target.value }
                            : item,
                        ),
                      )
                    }}
                    type="text"
                    value={entry.fieldOfStudy}
                  />
                </label>
                <label className="field">
                  <span>Start date</span>
                  <input
                    name="educationStartDate"
                    onChange={(event) => {
                      setEducationEntries((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, startDate: event.target.value } : item,
                        ),
                      )
                    }}
                    type="text"
                    value={entry.startDate}
                  />
                </label>
                <label className="field">
                  <span>End date</span>
                  <input
                    name="educationEndDate"
                    onChange={(event) => {
                      setEducationEntries((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, endDate: event.target.value } : item,
                        ),
                      )
                    }}
                    type="text"
                    value={entry.endDate}
                  />
                </label>
              </div>
              <label className="field">
                <span>Notes</span>
                <textarea
                  name="educationNotes"
                  onChange={(event) => {
                    setEducationEntries((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, notes: event.target.value } : item,
                      ),
                    )
                  }}
                  rows={4}
                    value={entry.notes}
                  />
                </label>
              </article>
            ))}
          </div>
        </DisclosureSection>

        <DisclosureSection
          label="Portfolio library"
          meta={`${portfolioItems.length} items`}
          title="Portfolio"
        >
          <div className="section-header">
            <AddRowButton
              label="Add portfolio item"
              onClick={() => {
                setPortfolioItems((current) => [...current, createPortfolioItem()])
              }}
            />
          </div>
          <div className="repeat-list">
            {portfolioItems.map((item, index) => (
              <article className="repeat-card" key={item.id}>
                <input name="portfolioItemId" type="hidden" value={item.id} />
                <div className="repeat-card-header">
                  <strong>Portfolio item {index + 1}</strong>
                  {portfolioItems.length > 1 ? (
                    <button
                      className="button button-ghost button-small"
                      onClick={() => {
                        setPortfolioItems((current) =>
                          current.filter((portfolioItem) => portfolioItem.id !== item.id),
                        )
                      }}
                      type="button"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="field-grid field-grid-2">
                  <label className="field">
                    <span>Title</span>
                    <input
                    name="portfolioTitle"
                    onChange={(event) => {
                      setPortfolioItems((current) =>
                        current.map((portfolioItem) =>
                          portfolioItem.id === item.id
                            ? { ...portfolioItem, title: event.target.value }
                            : portfolioItem,
                        ),
                      )
                    }}
                    type="text"
                    value={item.title}
                  />
                </label>
                <label className="field">
                  <span>URL</span>
                  <input
                    name="portfolioUrl"
                    onChange={(event) => {
                      setPortfolioItems((current) =>
                        current.map((portfolioItem) =>
                          portfolioItem.id === item.id
                            ? { ...portfolioItem, url: event.target.value }
                            : portfolioItem,
                        ),
                      )
                    }}
                    type="url"
                    value={item.url}
                  />
                </label>
                <label className="field">
                  <span>Project type</span>
                  <input
                    name="portfolioProjectType"
                    onChange={(event) => {
                      setPortfolioItems((current) =>
                        current.map((portfolioItem) =>
                          portfolioItem.id === item.id
                            ? { ...portfolioItem, projectType: event.target.value }
                            : portfolioItem,
                        ),
                      )
                    }}
                    type="text"
                    value={item.projectType}
                  />
                </label>
                <label className="field">
                  <span>Role label</span>
                  <input
                    name="portfolioRoleLabel"
                    onChange={(event) => {
                      setPortfolioItems((current) =>
                        current.map((portfolioItem) =>
                          portfolioItem.id === item.id
                            ? { ...portfolioItem, roleLabel: event.target.value }
                            : portfolioItem,
                        ),
                      )
                    }}
                    type="text"
                    value={item.roleLabel}
                  />
                </label>
                <label className="field">
                  <span>Visual strength (1-5)</span>
                  <input
                    max={5}
                    min={1}
                    name="portfolioVisualStrengthRating"
                    onChange={(event) => {
                      setPortfolioItems((current) =>
                        current.map((portfolioItem) =>
                          portfolioItem.id === item.id
                            ? { ...portfolioItem, visualStrengthRating: event.target.value }
                            : portfolioItem,
                        ),
                      )
                    }}
                    type="number"
                    value={item.visualStrengthRating}
                  />
                </label>
                <label className="field">
                  <span>Default showcase item</span>
                  <select
                    name="portfolioIsPrimary"
                    onChange={(event) => {
                      setPortfolioItems((current) =>
                        current.map((portfolioItem) =>
                          portfolioItem.id === item.id
                            ? {
                                ...portfolioItem,
                                isPrimary: event.target.value === 'true',
                              }
                            : portfolioItem,
                        ),
                      )
                    }}
                    value={item.isPrimary ? 'true' : 'false'}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </label>
                <label className="field">
                  <span>Status</span>
                  <select
                    name="portfolioIsActive"
                    onChange={(event) => {
                      setPortfolioItems((current) =>
                        current.map((portfolioItem) =>
                          portfolioItem.id === item.id
                            ? {
                                ...portfolioItem,
                                isActive: event.target.value === 'true',
                              }
                            : portfolioItem,
                        ),
                      )
                    }}
                    value={item.isActive ? 'true' : 'false'}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </label>
              </div>
              <label className="field">
                <span>Summary</span>
                <textarea
                  name="portfolioSummary"
                  onChange={(event) => {
                    setPortfolioItems((current) =>
                      current.map((portfolioItem) =>
                        portfolioItem.id === item.id
                          ? { ...portfolioItem, summary: event.target.value }
                          : portfolioItem,
                      ),
                    )
                  }}
                  rows={4}
                  value={item.summary}
                />
              </label>
              <div className="field-grid field-grid-2">
                <label className="field">
                  <span>Skills tags</span>
                  <textarea
                    name="portfolioSkillsTags"
                    onChange={(event) => {
                      setPortfolioItems((current) =>
                        current.map((portfolioItem) =>
                          portfolioItem.id === item.id
                            ? {
                                ...portfolioItem,
                                skillsTags: event.target.value
                                  .split('\n')
                                  .map((line) => line.trim())
                                  .filter(Boolean),
                              }
                            : portfolioItem,
                        ),
                      )
                    }}
                    rows={4}
                    value={toTextAreaValue(item.skillsTags)}
                  />
                </label>
                <label className="field">
                  <span>Industry tags</span>
                  <textarea
                    name="portfolioIndustryTags"
                    onChange={(event) => {
                      setPortfolioItems((current) =>
                        current.map((portfolioItem) =>
                          portfolioItem.id === item.id
                            ? {
                                ...portfolioItem,
                                industryTags: event.target.value
                                  .split('\n')
                                  .map((line) => line.trim())
                                  .filter(Boolean),
                              }
                            : portfolioItem,
                        ),
                      )
                    }}
                    rows={4}
                    value={toTextAreaValue(item.industryTags)}
                  />
                </label>
              </div>
              <label className="field">
                <span>Outcome metrics</span>
                <textarea
                  name="portfolioOutcomeMetrics"
                  onChange={(event) => {
                    setPortfolioItems((current) =>
                      current.map((portfolioItem) =>
                        portfolioItem.id === item.id
                          ? {
                              ...portfolioItem,
                              outcomeMetrics: event.target.value
                                .split('\n')
                                .map((line) => line.trim())
                                .filter(Boolean),
                            }
                          : portfolioItem,
                      ),
                    )
                  }}
                  rows={4}
                    value={toTextAreaValue(item.outcomeMetrics)}
                  />
                </label>
              </article>
            ))}
          </div>
          {portfolioItems.length === 0 ? (
            <div className="form-message">
              No portfolio items yet. Add at least a few strong case studies here before we move
              into job-specific recommendations.
            </div>
          ) : null}
        </DisclosureSection>
      </DisclosureSection>

      <DisclosureSection
        defaultOpen={false}
        label="Fine tuning"
        meta="collapsed"
        title="Advanced controls and operator details."
      >
        <div className="field-grid field-grid-2">
          <label className="field">
            <span>Display name</span>
            <input defaultValue={workspace.profile.displayName} name="displayName" type="text" />
          </label>
          <label className="field">
            <span>Internal account</span>
            <input defaultValue={workspace.profile.email} disabled readOnly type="email" />
          </label>
          <label className="field">
            <span>Timezone</span>
            <input defaultValue={workspace.profile.timezone} name="timezone" type="text" />
          </label>
          <label className="field">
            <span>Timezone tolerance (hours)</span>
            <input
              defaultValue={workspace.profile.timezoneToleranceHours}
              name="timezoneToleranceHours"
              type="number"
            />
          </label>
          <label className="field">
            <span>Secondary markets</span>
            <textarea
              defaultValue={toTextAreaValue(workspace.profile.secondaryMarkets)}
              name="secondaryMarkets"
              rows={4}
            />
          </label>
          <label className="field">
            <span>Allowed remote regions</span>
            <textarea
              defaultValue={toTextAreaValue(workspace.profile.allowedRemoteRegions)}
              name="allowedRemoteRegions"
              rows={4}
            />
          </label>
          <label className="field">
            <span>Salary currency</span>
            <input
              defaultValue={workspace.profile.salaryFloorCurrency}
              name="salaryFloorCurrency"
              type="text"
            />
          </label>
          <label className="field">
            <span>Salary floor</span>
            <input
              defaultValue={workspace.profile.salaryFloorAmount}
              name="salaryFloorAmount"
              type="number"
            />
          </label>
          <label className="field">
            <span>Preferred industries</span>
            <textarea
              defaultValue={toTextAreaValue(workspace.profile.industriesPreferred)}
              name="industriesPreferred"
              rows={5}
            />
          </label>
          <label className="field">
            <span>Industries to avoid</span>
            <textarea
              defaultValue={toTextAreaValue(workspace.profile.industriesAvoid)}
              name="industriesAvoid"
              rows={5}
            />
          </label>
        </div>

        <label className="field">
          <span>Work authorization notes</span>
          <textarea
            defaultValue={workspace.profile.workAuthorizationNotes}
            name="workAuthorizationNotes"
            rows={4}
          />
        </label>
        <label className="field">
          <span>Preferences notes</span>
          <textarea
            defaultValue={workspace.profile.preferencesNotes}
            name="preferencesNotes"
            rows={5}
          />
        </label>
      </DisclosureSection>

      <div className="profile-form-footer">
        <div
          className={`form-message ${
            state.status === 'success'
              ? 'form-message-success'
              : state.status === 'error'
                ? 'form-message-error'
                : ''
          }`}
        >
          {state.message ||
            'Saved settings update the queue, packet drafts, and portfolio picks.'}
        </div>
        <button className="button button-primary" disabled={isPending} type="submit">
          {isPending ? 'Saving workspace...' : 'Save workspace'}
        </button>
      </div>
    </form>
  )
}
