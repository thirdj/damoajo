import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireUser()

    const items = await sql`
      SELECT id, url, title, thumbnail, favicon, site_name, price, last_price,
             price_updated_at, category, is_favorite, memo, created_at, updated_at
      FROM links
      WHERE user_id = ${user.id}
      ORDER BY is_favorite DESC, created_at DESC
    `

    return NextResponse.json(items)
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('GET links error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = await req.json()

    const existing = await sql`
      SELECT id, title FROM links WHERE user_id = ${user.id} AND url = ${body.url} LIMIT 1
    `
    if (existing.length > 0) {
      return NextResponse.json({ error: 'DUPLICATE', existing: existing[0] }, { status: 409 })
    }

    const [item] = await sql`
      INSERT INTO links (user_id, url, title, description, thumbnail, site_name, favicon, price, category, is_favorite, memo)
      VALUES (
        ${user.id}, ${body.url}, ${body.title}, ${body.description ?? null},
        ${body.thumbnail ?? null}, ${body.site_name ?? null}, ${body.favicon ?? null},
        ${body.price ?? null}, ${body.category || '기타'}, false, null
      )
      RETURNING *
    `
    return NextResponse.json(item, { status: 201 })
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    console.error('POST links error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}