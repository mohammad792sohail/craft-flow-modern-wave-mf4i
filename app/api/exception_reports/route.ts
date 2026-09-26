import { authMiddleware, getDb } from 'lyzr-architect-pg'
import { exceptionReports } from '@/lib/db/schema'
import { NextRequest, NextResponse } from 'next/server'

export const GET = authMiddleware(async () => {
  try {
    const data = await getDb().select().from(exceptionReports)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load exception reports.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})

export const POST = authMiddleware(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const [data] = await getDb().insert(exceptionReports).values({
      ...body,
      reason: body.reason ?? '',
      hr_approved: body.hr_approved ?? false,
      resolved_at: body.resolved_at ?? '2026-09-26T13:00:00.000Z',
      notes: body.notes ?? '',
    }).returning()
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create exception report.'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
})
