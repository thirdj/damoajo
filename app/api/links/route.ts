import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(req.url)

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '40', 10)))
    const offset = (page - 1) * limit

    const search = (searchParams.get('search') || '').trim()
    const category = searchParams.get('category') || '전체'
    const filter = searchParams.get('filter') || 'all'
    const sort = searchParams.get('sort') || 'newest'

    const searchPattern = `%${search}%`

    const [countResult, items] = await Promise.all([
      sql`
        SELECT COUNT(*)::int AS count
        FROM links
        WHERE user_id = ${user.id}
          AND (${search === ''} OR title ILIKE ${searchPattern} OR site_name ILIKE ${searchPattern} OR category ILIKE ${searchPattern})
          AND (${category === '전체'} OR category = ${category})
          AND (
            ${filter === 'all'}
            OR (${filter === 'favorite'} AND is_favorite = true)
            OR (${filter === 'no_price'} AND (price IS NULL OR price = ''))
          )
      `,
      sql`
        SELECT
          id, url, title, thumbnail,
          favicon, site_name, price, last_price,
          price_updated_at, category, is_favorite, memo,
          created_at, updated_at
        FROM links
        WHERE user_id = ${user.id}
          AND (${search === ''} OR title ILIKE ${searchPattern} OR site_name ILIKE ${searchPattern} OR category ILIKE ${searchPattern})
          AND (${category === '전체'} OR category = ${category})
          AND (
            ${filter === 'all'}
            OR (${filter === 'favorite'} AND is_favorite = true)
            OR (${filter === 'no_price'} AND (price IS NULL OR price = ''))
          )
        ORDER BY
          CASE WHEN ${sort} = 'newest' THEN created_at END DESC,
          CASE WHEN ${sort} = 'oldest' THEN created_at END ASC,
          CASE WHEN ${sort} = 'price_asc' THEN NULLIF(REGEXP_REPLACE(COALESCE(price, ''), '[^0-9]', '', 'g'), '')::bigint END ASC NULLS LAST,
          CASE WHEN ${sort} = 'price_desc' THEN NULLIF(REGEXP_REPLACE(COALESCE(price, ''), '[^0-9]', '', 'g'), '')::bigint END DESC NULLS LAST,
          CASE WHEN ${sort} = 'site' THEN site_name END ASC NULLS LAST,
          created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `,
    ])

    const totalCount = countResult[0]?.count ?? 0
    const totalPages = Math.max(1, Math.ceil(totalCount / limit))

    return NextResponse.json({
      items,
      totalCount,
      totalPages,
      page,
    })
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

    try { new URL(body.url) } catch {
      return NextResponse.json({ error: '올바른 URL 형식이 아닙니다.' }, { status: 400 })
    }

    const existing = await sql`
      SELECT id, title FROM links WHERE user_id = ${user.id} AND url = ${body.url} LIMIT 1
    `
    if (existing.length > 0) {
      return NextResponse.json({ error: 'DUPLICATE', existing: existing[0] }, { status: 409 })
    }

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
