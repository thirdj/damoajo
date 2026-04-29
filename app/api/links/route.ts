import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'all'
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')
    const offset = (page - 1) * limit

    let items, countResult

    if (filter === 'favorite') {
      ;[items, countResult] = await Promise.all([
        sql`SELECT id, url, title, thumbnail, favicon, site_name, price, last_price, price_updated_at, category, is_favorite, memo, created_at, updated_at
            FROM links WHERE user_id = ${user.id} AND is_favorite = true
            ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int as total FROM links WHERE user_id = ${user.id} AND is_favorite = true`,
      ])
    } else if (filter === 'no_price') {
      ;[items, countResult] = await Promise.all([
        sql`SELECT id, url, title, thumbnail, favicon, site_name, price, last_price, price_updated_at, category, is_favorite, memo, created_at, updated_at
            FROM links WHERE user_id = ${user.id} AND price IS NULL
            ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int as total FROM links WHERE user_id = ${user.id} AND price IS NULL`,
      ])
    } else if (category && category !== '전체') {
      ;[items, countResult] = await Promise.all([
        sql`SELECT id, url, title, thumbnail, favicon, site_name, price, last_price, price_updated_at, category, is_favorite, memo, created_at, updated_at
            FROM links WHERE user_id = ${user.id} AND category = ${category}
            ORDER BY is_favorite DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int as total FROM links WHERE user_id = ${user.id} AND category = ${category}`,
      ])
    } else {
      ;[items, countResult] = await Promise.all([
        sql`SELECT id, url, title, thumbnail, favicon, site_name, price, last_price, price_updated_at, category, is_favorite, memo, created_at, updated_at
            FROM links WHERE user_id = ${user.id}
            ORDER BY is_favorite DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}`,
        sql`SELECT COUNT(*)::int as total FROM links WHERE user_id = ${user.id}`,
      ])
    }

    const total = countResult[0].total
    return NextResponse.json({ items, total, page, hasMore: (offset + limit) < total })
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