import { authMiddleware, getDb } from 'lyzr-architect-pg'
import { reminderDeliveries } from '@/lib/db/schema'
import { NextRequest, NextResponse } from 'next/server'

export const GET = authMiddleware(async () => {
  try {
    const data = await getDb().select().from(reminderDeliveries)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load reminder deliveries.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})

export const POST = authMiddleware(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const [data] = await getDb().insert(reminderDeliveries).values({
      ...body,
      employee_id: body.employee_id ?? '',
      error_message: body.error_message ?? '',
      sent_at: body.sent_at ?? '2026-09-26T10:45:00.000Z',
    }).returning()
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create reminder delivery.'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
})
