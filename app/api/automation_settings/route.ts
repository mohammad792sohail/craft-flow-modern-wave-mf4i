import { authMiddleware, getDb } from 'lyzr-architect-pg'
import { automationSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export const GET = authMiddleware(async () => {
  try {
    const data = await getDb().select().from(automationSettings)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load automation settings.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})

export const POST = authMiddleware(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const db = getDb()
    const existing = await db.select().from(automationSettings).where(eq(automationSettings.setting_key, body.setting_key)).limit(1)
    const value = typeof body.setting_value === 'string' ? body.setting_value : JSON.stringify(body.setting_value ?? '')
    if (existing[0]) {
      const [data] = await db.update(automationSettings).set({ setting_value: value, description: body.description ?? existing[0].description }).where(eq(automationSettings.id, existing[0].id)).returning()
      return NextResponse.json({ success: true, data })
    }
    const [data] = await db.insert(automationSettings).values({ setting_key: body.setting_key, setting_value: value, description: body.description ?? '' }).returning()
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not save automation setting.'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
})
