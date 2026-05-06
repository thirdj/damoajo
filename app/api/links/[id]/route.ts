import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await params
    const body = await req.json()

    const [existing] = await sql`
      SELECT price, title FROM links WHERE id = ${id} AND user_id = ${user.id}
    `
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const oldPrice = existing.price
    // 가격 숫자만 저장
    const rawPrice = body.price !== undefined
      ? (body.price ? String(body.price).replace(/[^0-9]/g, '') || null : null)
      : oldPrice
    const priceChanged = body.price !== undefined && oldPrice !== rawPrice && (oldPrice || rawPrice)

    const [updated] = await sql`
      UPDATE links SET
        title            = COALESCE(${body.title?.trim() ?? null}, title),
        price            = ${body.price !== undefined ? rawPrice : sql`price`},
        last_price       = ${priceChanged ? oldPrice : sql`last_price`},
        price_updated_at = ${priceChanged ? new Date().toISOString() : sql`price_updated_at`},
        category         = COALESCE(${body.category ?? null}, category),
        is_favorite      = COALESCE(${body.is_favorite ?? null}, is_favorite),
        memo             = ${body.memo !== undefined ? (body.memo?.trim() || null) : sql`memo`},
        updated_at       = now()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING
        id, url, title, thumbnail, favicon, site_name, price, last_price,
        price_updated_at, category, is_favorite, memo, created_at, updated_at
    `

    if (priceChanged) {
      await Promise.all([
        sql`INSERT INTO price_history (link_id, user_id, old_price, new_price)
            VALUES (${id}, ${user.id}, ${oldPrice}, ${rawPrice})`,
        sql`INSERT INTO price_alerts (user_id, link_id, link_title, old_price, new_price)
            VALUES (${user.id}, ${id}, ${existing.title}, ${oldPrice}, ${rawPrice})`,
        sql`DELETE FROM price_alerts
            WHERE user_id = ${user.id}
            AND created_at < now() - interval '7 days'`,
      ])
    }

    return NextResponse.json({ ...updated, priceChanged, oldPrice })
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('PATCH links error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await params
    const result = await sql`
      DELETE FROM links WHERE id = ${id} AND user_id = ${user.id} RETURNING id
    `
    if (result.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('DELETE links error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}