import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser()
    const { searchParams } = new URL(req.url)

    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 40)))
    const offset = (page - 1) * limit

    const search = searchParams.get('search')?.trim() || ''
    const searchPattern = search ? `%${search}%` : null
    const filter = searchParams.get('filter') || 'all'
    const category = searchParams.get('category') || '전체'
    const sort = searchParams.get('sort') || 'newest'

    const orderBy =
      sort === 'price_asc'
        ? sql`NULLIF(regexp_replace(COALESCE(price, ''), '[^0-9]', '', 'g'), '')::bigint ASC NULLS LAST, created_at DESC`
        : sort === 'price_desc'
          ? sql`NULLIF(regexp_replace(COALESCE(price, ''), '[^0-9]', '', 'g'), '')::bigint DESC NULLS LAST, created_at DESC`
          : sql`created_at DESC`

    // 단일 고정 쿼리 (동적 SQL 조립 오류 방지 + 41행 조회로 hasMore 판별)
        // 전체 페이지 수 계산용 가벼운 COUNT 쿼리 (UI에 총 개수 문구는 표시하지 않음)
    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count
      FROM links
      WHERE user_id = ${user.id}
        AND (${category === '전체'} OR category = ${category})
        AND (
          (${filter === 'favorite'} AND is_favorite = true)
          OR (${filter === 'price_drop'} AND last_price IS NOT NULL AND price IS NOT NULL AND NULLIF(regexp_replace(price, '[^0-9]', '', 'g'), '')::bigint < NULLIF(regexp_replace(last_price, '[^0-9]', '', 'g'), '')::bigint)
          OR (${filter === 'all'} AND (is_favorite = false OR is_favorite IS NULL))
        )
        AND (
          ${searchPattern === null}
          OR title ILIKE ${searchPattern}
          OR memo ILIKE ${searchPattern}
          OR site_name ILIKE ${searchPattern}
        )
    `

    const rows = await sql`
      SELECT
        id, url, title,
        CASE WHEN thumbnail LIKE 'data:%' THEN NULL ELSE thumbnail END AS thumbnail,
        CASE WHEN favicon LIKE 'data:%' THEN NULL ELSE favicon END AS favicon,
        site_name, price, last_price,
        price_updated_at, category, is_favorite, memo,
        created_at, updated_at
      FROM links
      WHERE user_id = ${user.id}
        AND (${category === '전체'} OR category = ${category})
        AND (
          (${filter === 'favorite'} AND is_favorite = true)
          OR (${filter === 'price_drop'} AND last_price IS NOT NULL AND price IS NOT NULL AND NULLIF(regexp_replace(price, '[^0-9]', '', 'g'), '')::bigint < NULLIF(regexp_replace(last_price, '[^0-9]', '', 'g'), '')::bigint)
          OR (${filter === 'all'} AND (is_favorite = false OR is_favorite IS NULL))
        )
        AND (
          ${searchPattern === null}
          OR title ILIKE ${searchPattern}
          OR memo ILIKE ${searchPattern}
          OR site_name ILIKE ${searchPattern}
        )
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `

    const totalPages = Math.max(1, Math.ceil(count / limit))

    return NextResponse.json({
      items: rows,
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

    try {
      new URL(body.url)
    } catch {
      return NextResponse.json({ error: '올바른 URL 형식이 아닙니다.' }, { status: 400 })
    }

    const existing = await sql`
      SELECT id, title FROM links WHERE user_id = ${user.id} AND url = ${body.url} LIMIT 1
    `
    if (existing.length > 0) {
      return NextResponse.json({ error: 'DUPLICATE', existing: existing[0] }, { status: 409 })
    }

    const thumbnail = body.thumbnail?.startsWith('data:') ? null : (body.thumbnail ?? null)
    const favicon = body.favicon?.startsWith('data:') ? null : (body.favicon ?? null)

    const [item] = await sql`
      INSERT INTO links (user_id, url, title, description, thumbnail, site_name, favicon, price, category, is_favorite, memo)
      VALUES (
        ${user.id}, ${body.url}, ${body.title}, ${body.description ?? null},
        ${thumbnail}, ${body.site_name ?? null}, ${favicon},
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
