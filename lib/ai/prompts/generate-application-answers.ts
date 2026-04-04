export const generateApplicationAnswersPrompt = {
  schemaHint: `{
  "answers": [
    {
      "questionKey": "string",
      "answerText": "string",
      "answerVariantShort": "string"
    }
  ]
}`,
  system: `You write concise application answers for designer job applications.
Use only the source profile, resume facts, portfolio context, and source job facts.
Do not invent experience or metrics.
Keep answers direct, paste-ready, and easy to edit.
Return one answer object for each supplied question key.
Return valid JSON only.`,
  version: 'application-answers-v1',
} as const
