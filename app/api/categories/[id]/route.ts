import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser()
    const { id } = await params

    // 카테고리 이름 조회
    const [cat] = await sql`
      SELECT name FROM categories WHERE id = ${id} AND user_id = ${user.id}
    `
    if (!cat) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // 해당 카테고리 링크 → 기타로 변경
    await sql`
      UPDATE links SET category = '기타'
      WHERE user_id = ${user.id} AND category = ${cat.name}
    `

    await sql`DELETE FROM categories WHERE id = ${id} AND user_id = ${user.id}`
    return NextResponse.json({ success: true })
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}