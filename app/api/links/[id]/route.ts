import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await params
    const body = await req.json()

    // 기존 데이터 조회
    const [existing] = await sql`
      SELECT price, title FROM links WHERE id = ${id} AND user_id = ${user.id}
    `
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const oldPrice = existing.price
    const newPrice = body.price !== undefined ? (body.price || null) : oldPrice
    const priceChanged = body.price !== undefined && oldPrice !== newPrice && (oldPrice || newPrice)

    const [updated] = await sql`
      UPDATE links SET
        title             = COALESCE(${body.title ?? null}, title),
        price             = ${body.price !== undefined ? (body.price || null) : sql`price`},
        last_price        = ${priceChanged ? oldPrice : sql`last_price`},
        price_updated_at  = ${priceChanged ? new Date().toISOString() : sql`price_updated_at`},
        category          = COALESCE(${body.category ?? null}, category),
        is_favorite       = COALESCE(${body.is_favorite ?? null}, is_favorite),
        memo              = ${body.memo !== undefined ? (body.memo || null) : sql`memo`},
        updated_at        = now()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `

    if (priceChanged) {
      // 가격 히스토리 기록
      await sql`
        INSERT INTO price_history (link_id, user_id, old_price, new_price)
        VALUES (${id}, ${user.id}, ${oldPrice}, ${newPrice})
      `
      // 가격 알림 생성
      await sql`
        INSERT INTO price_alerts (user_id, link_id, link_title, old_price, new_price)
        VALUES (${user.id}, ${id}, ${existing.title}, ${oldPrice}, ${newPrice})
      `
      // 7일 지난 알림 자동 삭제
      await sql`
        DELETE FROM price_alerts
        WHERE user_id = ${user.id}
        AND created_at < now() - interval '7 days'
      `
    }

    return NextResponse.json({ ...updated, priceChanged, oldPrice })
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    await sql`DELETE FROM links WHERE id = ${id} AND user_id = ${user.id}`
    return NextResponse.json({ success: true })
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
