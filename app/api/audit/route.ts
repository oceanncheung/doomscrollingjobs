import { NextResponse } from 'next/server'

import { getSystemReadinessAudit } from '@/lib/audit/system-readiness'
import { hasOpenAIEnv, hasSupabaseServerEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!hasSupabaseServerEnv()) {
    return NextResponse.json(
      {
        aiReady: hasOpenAIEnv(),
        envReady: false,
        issue: 'Supabase server environment is required for a full system audit.',
        status: 'missing-env',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }

  const audit = await getSystemReadinessAudit()

  return NextResponse.json({
    aiReady: hasOpenAIEnv(),
    audit,
    envReady: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
}
