export const SENIORITY_LEVEL_OPTIONS: ReadonlyArray<{ label: string; value: string }> = [
  { value: '', label: 'No preference' },
  { value: 'junior', label: 'Junior / entry' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'staff', label: 'Staff / principal IC' },
]

const ALLOWED = new Set(SENIORITY_LEVEL_OPTIONS.map((o) => o.value).filter(Boolean))

export function normalizeSeniorityLevel(stored: string | undefined | null): string {
  const raw = (stored ?? '').trim().toLowerCase()
  if (!raw) {
    return ''
  }
  if (ALLOWED.has(raw)) {
    return raw
  }
  if (raw.includes('staff') || raw.includes('principal')) {
    return 'staff'
  }
  if (raw.includes('lead') || raw.includes('director') || raw.includes('head of')) {
    return 'lead'
  }
  if (raw.includes('junior') || raw.includes('entry') || raw.includes('intern')) {
    return 'junior'
  }
  if (raw.includes('mid')) {
    return 'mid'
  }
  if (raw.includes('senior') || raw === 'sr') {
    return 'senior'
  }
  return ''
}

export function seniorityLevelToSelectValue(stored: string | undefined | null): string {
  return normalizeSeniorityLevel(stored)
}

export function getTargetSeniorityLevels(
  storedLevels: string[] | undefined | null,
  legacyLevel: string | undefined | null,
) {
  const normalizedLevels = (storedLevels ?? [])
    .map((value) => normalizeSeniorityLevel(value))
    .filter(Boolean)

  if (normalizedLevels.length > 0) {
    return Array.from(new Set(normalizedLevels))
  }

  const legacy = normalizeSeniorityLevel(legacyLevel)

  return legacy ? [legacy] : []
}

export function getSeniorityLabel(value: string) {
  return SENIORITY_LEVEL_OPTIONS.find((option) => option.value === value)?.label ?? value
}
