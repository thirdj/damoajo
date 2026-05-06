import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const user = await requireUser()
    const items = await sql`
      SELECT
        id, url, title,
        CASE WHEN thumbnail LIKE 'data:%' THEN NULL ELSE thumbnail END as thumbnail,
        favicon, site_name, price, last_price,
        price_updated_at, category, is_favorite, memo,
        created_at, updated_at
      FROM links
      WHERE user_id = ${user.id}
      ORDER BY is_favorite DESC, created_at DESC
    `
    return NextResponse.json(items)
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('GET links error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = await req.json()

    if (!body.url || !body.title) {
      return NextResponse.json({ error: 'url과 title은 필수입니다.' }, { status: 400 })
    }

    // URL 유효성 검사
    try { new URL(body.url) } catch {
      return NextResponse.json({ error: '올바른 URL 형식이 아닙니다.' }, { status: 400 })
    }

    const existing = await sql`
      SELECT id, title FROM links WHERE user_id = ${user.id} AND url = ${body.url} LIMIT 1
    `
    if (existing.length > 0) {
      return NextResponse.json({ error: 'DUPLICATE', existing: existing[0] }, { status: 409 })
    }

    // base64 이미지는 저장 거부
    const thumbnail = body.thumbnail?.startsWith('data:') ? null : (body.thumbnail ?? null)

    const [item] = await sql`
      INSERT INTO links (user_id, url, title, description, thumbnail, site_name, favicon, price, category, is_favorite, memo)
      VALUES (
        ${user.id}, ${body.url}, ${body.title}, ${body.description ?? null},
        ${thumbnail}, ${body.site_name ?? null}, ${body.favicon ?? null},
        ${body.price ?? null}, ${body.category || '기타'}, false, null
      )
      RETURNING
        id, url, title, thumbnail, favicon, site_name, price, last_price,
        price_updated_at, category, is_favorite, memo, created_at, updated_at
    `
    return NextResponse.json(item, { status: 201 })
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('POST links error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}