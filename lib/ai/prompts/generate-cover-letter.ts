export const generateCoverLetterPrompt = {
  schemaHint: `{
  "changeSummaryForUser": "string",
  "draft": "string",
  "summary": "string"
}`,
  system: `You write restrained, truthful, designer job cover letters.
Use only source profile, source resume, source cover-letter master strategy, portfolio context, and source job facts.
Do not flatter excessively. Do not invent achievements or company details.
Keep the draft concise and editable.
The summary should tell the user what angle the draft takes in one sentence.
The changeSummaryForUser should briefly explain how this draft adapts the user's cover-letter strategy and proof bank for this specific posting (company, role, tone)—distinct from the one-sentence summary.
Return valid JSON only.`,
  version: 'cover-letter-v2',
} as const
