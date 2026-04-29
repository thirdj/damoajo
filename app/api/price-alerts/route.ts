import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireUser()
    // 7일 지난 알림 자동 삭제
    await sql`
      DELETE FROM price_alerts
      WHERE user_id = ${user.id} AND created_at < now() - interval '7 days'
    `
    const data = await sql`
      SELECT * FROM price_alerts
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 30
    `
    return NextResponse.json(data)
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser()
    const { id } = await req.json()
    await sql`
      UPDATE price_alerts SET is_read = true
      WHERE id = ${id} AND user_id = ${user.id}
    `
    return NextResponse.json({ success: true })
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const user = await requireUser()
    await sql`DELETE FROM price_alerts WHERE user_id = ${user.id}`
    return NextResponse.json({ success: true })
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
