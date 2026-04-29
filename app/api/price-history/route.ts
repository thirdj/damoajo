import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(req.url)
    const linkId = searchParams.get('link_id')
    if (!linkId) return NextResponse.json({ error: 'link_id required' }, { status: 400 })

    const data = await sql`
      SELECT * FROM price_history
      WHERE link_id = ${linkId} AND user_id = ${user.id}
      ORDER BY changed_at DESC
      LIMIT 50
    `
    return NextResponse.json(data)
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
