import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = await req.json()
    const links = body.links || []
    const categories = body.categories || []

    let importedLinks = 0, importedCats = 0, skipped = 0

    for (const cat of categories) {
      const result = await sql`
        INSERT INTO categories (user_id, name, color)
        VALUES (${user.id}, ${cat.name}, ${cat.color || '#3b82f6'})
        ON CONFLICT (user_id, name) DO NOTHING
        RETURNING id
      `
      if (result.length > 0) importedCats++
    }

    for (const link of links) {
      const result = await sql`
        INSERT INTO links (user_id, url, title, description, thumbnail, site_name, favicon, price, category, is_favorite, status, memo)
        VALUES (
          ${user.id}, ${link.url}, ${link.title}, ${link.description ?? null},
          ${link.thumbnail ?? null}, ${link.site_name ?? null}, ${link.favicon ?? null},
          ${link.price ?? null}, ${link.category || '기타'}, ${link.is_favorite || false},
          ${link.status || 'wish'}, ${link.memo ?? null}
        )
        ON CONFLICT (user_id, url) DO NOTHING
        RETURNING id
      `
      if (result.length > 0) importedLinks++
      else skipped++
    }

    return NextResponse.json({ importedLinks, importedCats, skipped })
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: '파일 형식이 올바르지 않습니다.' }, { status: 400 })
  }
}
