export const modelRouting = [
  {
    task: 'job_summary',
    label: 'Job summary',
    provider: 'OpenAI',
    reason: 'Used for concise, factual role summaries on the detail and prep surfaces.',
  },
  {
    task: 'resume_tailor',
    label: 'Resume tailor',
    provider: 'OpenAI',
    reason: 'Used for ATS-safe structured resume variants derived from the master resume.',
  },
  {
    task: 'cover_letter',
    label: 'Cover letter',
    provider: 'OpenAI',
    reason: 'Used for concise, editable cover letter drafts with a consistent tone.',
  },
  {
    task: 'field_response_generator',
    label: 'Field response generator',
    provider: 'OpenAI',
    reason: 'Used for compact, editable paste-ready application answers.',
  },
] as const
