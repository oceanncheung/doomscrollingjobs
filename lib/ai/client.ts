import 'server-only'

import { getOpenAIEnv, hasOpenAIEnv } from '@/lib/env'

interface OpenAIJsonRequest {
  model: string
  promptVersion: string
  schemaHint: string
  system: string
  user: string
}

interface ResponsesApiPayload {
  output?: Array<{
    content?: Array<{
      text?: string | null
      type?: string
    }>
  }>
  output_text?: string | null
}

function stripFence(value: string) {
  const trimmed = value.trim()

  if (!trimmed.startsWith('```')) {
    return trimmed
  }

  return trimmed
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim()
}

export function canGenerateWithOpenAI() {
  return hasOpenAIEnv()
}

function extractResponseText(payload: ResponsesApiPayload) {
  const outputText = payload.output_text?.trim()

  if (outputText) {
    return outputText
  }

  for (const item of payload.output ?? []) {
    for (const contentItem of item.content ?? []) {
      const text = contentItem.text?.trim()

      if (text) {
        return text
      }
    }
  }

  return ''
}

export async function generateOpenAIJson<T>({
  model,
  promptVersion,
  schemaHint,
  system,
  user,
}: OpenAIJsonRequest): Promise<T> {
  const { apiKey } = getOpenAIEnv()
  const response = await fetch('https://api.openai.com/v1/responses', {
    body: JSON.stringify({
      input: [
        {
          role: 'system',
          content: [
            {
              text: `${system}\n\nPrompt version: ${promptVersion}\nReturn valid JSON only.`,
              type: 'input_text',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              text: `${user}\n\nReturn a JSON object with this shape:\n${schemaHint}`,
              type: 'input_text',
            },
          ],
        },
      ],
      model,
      temperature: 0.2,
      text: {
        format: {
          type: 'json_object',
        },
      },
    }),
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`OpenAI request failed (${response.status}): ${message}`)
  }

  const payload = (await response.json()) as ResponsesApiPayload
  const content = extractResponseText(payload)

  if (!content) {
    throw new Error('OpenAI response did not include any content.')
  }

  try {
    return JSON.parse(stripFence(content)) as T
  } catch (error) {
    throw new Error(
      `OpenAI JSON parsing failed: ${error instanceof Error ? error.message : 'unknown parsing error'}`,
    )
  }
}
