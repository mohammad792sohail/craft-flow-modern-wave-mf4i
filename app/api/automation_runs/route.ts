import { authMiddleware, getDb } from 'lyzr-architect-pg'
import { automationRuns } from '@/lib/db/schema'
import { NextRequest, NextResponse } from 'next/server'

export const GET = authMiddleware(async () => {
  try {
    const data = await getDb().select().from(automationRuns)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load automation runs.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})

export const POST = authMiddleware(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const [data] = await getDb().insert(automationRuns).values({
      ...body,
      error_message: body.error_message ?? '',
      roster_snapshot_id: body.roster_snapshot_id ?? '',
      submission_snapshot_id: body.submission_snapshot_id ?? '',
      started_at: body.started_at ?? '2026-09-26T10:45:00.000Z',
      completed_at: body.completed_at ?? '2026-09-26T10:46:00.000Z',
    }).returning()
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create automation run.'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
})
