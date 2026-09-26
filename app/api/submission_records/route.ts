import { authMiddleware, getDb } from 'lyzr-architect-pg'
import { submissionRecords } from '@/lib/db/schema'
import { NextRequest, NextResponse } from 'next/server'

export const GET = authMiddleware(async () => {
  try {
    const data = await getDb().select().from(submissionRecords)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load submission records.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
})

export const POST = authMiddleware(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const [data] = await getDb().insert(submissionRecords).values(body).returning()
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create submission record.'
    return NextResponse.json({ success: false, error: message }, { status: 400 })
  }
})
