import 'server-only'

import { getOpenAIEnv, hasOpenAIEnv } from '@/lib/env'

interface OpenAIJsonRequest {
  model: string
  promptVersion: string
  schemaHint: string
  system: string
  user: string
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

export async function generateOpenAIJson<T>({
  model,
  promptVersion,
  schemaHint,
  system,
  user,
}: OpenAIJsonRequest): Promise<T> {
  const { apiKey } = getOpenAIEnv()
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    body: JSON.stringify({
      messages: [
        {
          content: `${system}\n\nPrompt version: ${promptVersion}\nReturn valid JSON only.`,
          role: 'system',
        },
        {
          content: `${user}\n\nReturn a JSON object with this shape:\n${schemaHint}`,
          role: 'user',
        },
      ],
      model,
      response_format: { type: 'json_object' },
      temperature: 0.2,
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

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>
  }
  const content = payload.choices?.[0]?.message?.content

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
