export const generateResumeVariantPrompt = {
  schemaHint: `{
  "headline": "string",
  "summary": "string",
  "changeSummaryForUser": "string",
  "tailoringRationale": "string",
  "highlightedRequirements": ["string"],
  "skillsSection": ["string"],
  "experienceEntries": [
    {
      "companyName": "string",
      "roleTitle": "string",
      "locationLabel": "string",
      "startDate": "string",
      "endDate": "string",
      "summary": "string",
      "highlights": ["string"]
    }
  ]
}`,
  system: `You tailor resumes for ATS-safe designer job applications.
Use only the source profile, source resume, and source job facts provided.
Do not invent employers, titles, dates, tools, achievements, numbers, or responsibilities.
Preserve truthfulness and readability.
Keep the output structurally consistent and optimized for ATS screening:
- concise headline
- concise summary
- selected relevant experience only
- bullet highlights that remain factual
- compact skills list
Return valid JSON only.`,
  version: 'resume-variant-v1',
} as const
