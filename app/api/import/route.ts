import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const body = await req.json()

    // 다양한 형식 자동 감지
    // 형식 1: { version, links, categories }
    // 형식 2: { data: { links, categories } }
    // 형식 3: 배열 직접 [ {...}, {...} ]
    let links: Record<string, unknown>[] = []
    let categories: Record<string, unknown>[] = []

    if (Array.isArray(body)) {
      // 배열 형식
      links = body
    } else if (body.links || body.categories) {
      // 표준 형식
      links = body.links || []
      categories = body.categories || []
    } else if (body.data) {
      // 중첩 형식
      links = body.data.links || []
      categories = body.data.categories || []
    } else {
      return NextResponse.json({ error: '파일 형식이 올바르지 않습니다.' }, { status: 400 })
    }

    let importedLinks = 0, importedCats = 0, skipped = 0

    // 카테고리 가져오기
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

    // 링크 가져오기
    for (const link of links) {
      if (!link.url || !link.title) continue
      try {
        const result = await sql`
          INSERT INTO links (
            user_id, url, title, description, thumbnail, site_name,
            favicon, price, category, is_favorite, memo
          )
          VALUES (
            ${user.id},
            ${link.url as string},
            ${link.title as string},
            ${(link.description as string) ?? null},
            ${(link.thumbnail as string) ?? null},
            ${(link.site_name as string) ?? null},
            ${(link.favicon as string) ?? null},
            ${(link.price as string) ?? null},
            ${(link.category as string) || '기타'},
            ${(link.is_favorite as boolean) || false},
            ${(link.memo as string) ?? null}
          )
          ON CONFLICT (user_id, url) DO NOTHING
          RETURNING id
        `
        if (result.length > 0) importedLinks++
        else skipped++
      } catch {
        skipped++
      }
    }

    return NextResponse.json({ importedLinks, importedCats, skipped })
  } catch (e) {
    console.error('Import error:', e)
    if ((e as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: '파일 형식이 올바르지 않습니다.' }, { status: 400 })
  }
}
