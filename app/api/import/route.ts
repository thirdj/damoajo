import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = await req.json()

    let links: Record<string, unknown>[] = []
    let categories: Record<string, unknown>[] = []

    if (Array.isArray(body)) {
      links = body
    } else if (body.links || body.categories) {
      links = body.links || []
      categories = body.categories || []
    } else if (body.data) {
      links = body.data.links || []
      categories = body.data.categories || []
    } else {
      return NextResponse.json({ error: '파일 형식이 올바르지 않습니다.' }, { status: 400 })
    }

    let importedLinks = 0, importedCats = 0, skipped = 0

    for (const cat of categories) {
      if (!cat.name) continue
      const result = await sql`
        INSERT INTO categories (user_id, name, color)
        VALUES (${user.id}, ${cat.name as string}, ${(cat.color as string) || '#3b82f6'})
        ON CONFLICT (user_id, name) DO NOTHING
        RETURNING id
      `
      if (result.length > 0) importedCats++
    }

    for (const link of links) {
      if (!link.url || !link.title) { skipped++; continue }
      // URL 유효성 검사
      try { new URL(link.url as string) } catch { skipped++; continue }
      // base64 썸네일 제외
      const thumbnail = (link.thumbnail as string)?.startsWith('data:') ? null : (link.thumbnail ?? null)
      // 가격 숫자만
      const price = link.price ? String(link.price).replace(/[^0-9]/g, '') || null : null

      try {
        const result = await sql`
          INSERT INTO links (user_id, url, title, thumbnail, site_name, favicon, price, category, is_favorite, memo)
          VALUES (
            ${user.id}, ${link.url as string}, ${link.title as string},
            ${thumbnail as string | null}, ${(link.site_name as string) ?? null},
            ${(link.favicon as string) ?? null}, ${price},
            ${(link.category as string) || '기타'}, ${(link.is_favorite as boolean) || false},
            ${(link.memo as string) ?? null}
          )
          ON CONFLICT (user_id, url) DO NOTHING
          RETURNING id
        `
        if (result.length > 0) importedLinks++
        else skipped++
      } catch { skipped++ }
    }

    return NextResponse.json({ importedLinks, importedCats, skipped })
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.error('Import error:', e)
    return NextResponse.json({ error: '파일 형식이 올바르지 않습니다.' }, { status: 400 })
  }
}