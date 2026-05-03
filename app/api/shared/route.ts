export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('shared')
    const filter = searchParams.get('filter')
    const category = searchParams.get('category')

    if (!userId) return NextResponse.json({ error: '잘못된 공유 링크입니다.' }, { status: 400 })

    // user_id 앞 8자리로 매칭
    const userResult = await sql`
      SELECT DISTINCT user_id FROM links
      WHERE user_id LIKE ${userId + '%'}
      LIMIT 1
    `
    if (userResult.length === 0) return NextResponse.json({ error: '공유 링크를 찾을 수 없습니다.' }, { status: 404 })

    const fullUserId = userResult[0].user_id

    let items
    if (filter && filter !== 'all') {
      if (category && category !== '전체') {
        items = await sql`SELECT * FROM links WHERE user_id = ${fullUserId} AND status = ${filter} AND category = ${category} ORDER BY created_at DESC`
      } else {
        items = await sql`SELECT * FROM links WHERE user_id = ${fullUserId} AND status = ${filter} ORDER BY created_at DESC`
      }
    } else if (category && category !== '전체') {
      items = await sql`SELECT * FROM links WHERE user_id = ${fullUserId} AND category = ${category} ORDER BY created_at DESC`
    } else {
      items = await sql`SELECT * FROM links WHERE user_id = ${fullUserId} ORDER BY created_at DESC`
    }

    return NextResponse.json(items)
  } catch (e) {
    console.error('shared error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
