'use client'

import type { Dispatch, SetStateAction } from 'react'

import { TagToggleGroup } from '@/components/ui/tag-toggle-group'
import { TagInput } from '@/components/ui/tag-input'
import { REGION_SUGGESTIONS } from '@/lib/profile/autocomplete-options'
import { SALARY_CURRENCY_OPTIONS } from '@/lib/profile/salary-currency'
import { SENIORITY_LEVEL_OPTIONS } from '@/lib/profile/seniority-level'

interface JobTargetsSectionProps {
  searchBrief: string
  hiringMarketTags: string[]
  salaryFloorCurrency: string
  salaryTargetMin: string
  salaryTargetMax: string
  remoteRequired: boolean
  relocationOpen: boolean
  targetSeniorityLevels: string[]
  setHiringMarketTags: Dispatch<SetStateAction<string[]>>
  setTargetSeniorityLevels: Dispatch<SetStateAction<string[]>>
  targetRoleTags: string[]
  setTargetRoleTags: Dispatch<SetStateAction<string[]>>
  adjacentRoleTags: string[]
  setAdjacentRoleTags: Dispatch<SetStateAction<string[]>>
}

export function JobTargetsSection({
  searchBrief,
  hiringMarketTags,
  salaryFloorCurrency,
  salaryTargetMin,
  salaryTargetMax,
  remoteRequired,
  relocationOpen,
  targetSeniorityLevels,
  setHiringMarketTags,
  setTargetSeniorityLevels,
  targetRoleTags,
  setTargetRoleTags,
  adjacentRoleTags,
  setAdjacentRoleTags,
}: JobTargetsSectionProps) {
  return (
    <section className="panel settings-section">
      <div className="settings-section-header">
        <div className="settings-section-title-stack">
          <p className="panel-label">Job targets</p>
          <h2>Tell us what a good role looks like.</h2>
        </div>
      </div>

      <div className="settings-core-grid">
        <label className="field settings-field-wide settings-search-brief">
          <span>Ideal roles</span>
          <textarea
            defaultValue={searchBrief}
            name="searchBrief"
            placeholder="Generated from your resume. Edit to refine."
            rows={8}
          />
          <small>Roles matching this get prioritized.</small>
        </label>
      </div>

      <details className="settings-action-disclosure">
        <summary className="settings-action-summary">
          <span className="settings-action-toggle">
            Additional filters
            <span aria-hidden="true" className="settings-action-toggle-icon">
              <svg fill="none" height="12" viewBox="0 0 12 12" width="12">
                <path
                  d="M3.25 4.5 6 7.25 8.75 4.5"
                  stroke="currentColor"
                  strokeLinecap="square"
                  strokeWidth="1.2"
                />
              </svg>
            </span>
          </span>
        </summary>
        <div className="settings-action-body">
          <div className="settings-core-grid">
            <div className="settings-job-targets-row">
              <div className="settings-job-targets-col-salary">
                <TagInput
                  helper="Start typing for suggestions, or press Enter to keep a custom market."
                  label="Main hiring market"
                  onChange={setHiringMarketTags}
                  placeholder="e.g. Canada"
                  preserveCase
                  suggestions={REGION_SUGGESTIONS}
                  tags={hiringMarketTags}
                />
                <label className="field settings-salary-currency-field">
                  <span>Salary currency</span>
                  <select defaultValue={salaryFloorCurrency} name="salaryFloorCurrency">
                    {SALARY_CURRENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="settings-job-targets-salary-range">
                  <label className="field">
                    <span>Ideal salary from</span>
                    <input
                      defaultValue={salaryTargetMin}
                      name="salaryTargetMin"
                      placeholder="90000"
                      type="number"
                    />
                  </label>
                  <label className="field">
                    <span>Ideal salary to</span>
                    <input
                      defaultValue={salaryTargetMax}
                      name="salaryTargetMax"
                      placeholder="140000"
                      type="number"
                    />
                  </label>
                </div>
              </div>
              <div className="settings-job-targets-col-priorities">
                <TagToggleGroup
                  helper="Select every level that still feels like a fit."
                  label="Target seniority"
                  onChange={setTargetSeniorityLevels}
                  options={SENIORITY_LEVEL_OPTIONS.filter((option) => option.value.length > 0)}
                  values={targetSeniorityLevels}
                />
                <TagInput
                  helper="Press Enter after each role."
                  label="Prioritize these roles"
                  onChange={setTargetRoleTags}
                  placeholder="e.g. Brand designer"
                  tags={targetRoleTags}
                />
                <TagInput
                  helper="Roles that are still worth seeing when the fit is strong."
                  label="Also consider"
                  onChange={setAdjacentRoleTags}
                  placeholder="e.g. Art director"
                  tags={adjacentRoleTags}
                />
              </div>
            </div>
          </div>

          <div className="settings-toggle-row checkbox-row">
            <label className="checkbox-field">
              <input defaultChecked={remoteRequired} name="remoteRequired" type="checkbox" />
              <span>Only show remote roles</span>
            </label>
            <label className="checkbox-field">
              <input defaultChecked={relocationOpen} name="relocationOpen" type="checkbox" />
              <span>Open to relocation if fit is strong</span>
            </label>
          </div>
        </div>
      </details>
    </section>
  )
}
