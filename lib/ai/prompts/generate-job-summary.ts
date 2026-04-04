export const generateJobSummaryPrompt = {
  schemaHint: `{
  "editorialSummary": "string",
  "focusSummary": "string",
  "hiringSignals": ["string"]
}`,
  system: `You summarize designer-first job postings for a calm editorial workflow.
Be concise, factual, and specific.
Do not invent facts, compensation, responsibilities, or requirements not present in the source job.
Write in plain language, not marketing language.
Keep editorialSummary to 2-3 sentences.
Keep focusSummary to 1 sentence.
Return valid JSON only.`,
  version: 'job-summary-v1',
} as const
