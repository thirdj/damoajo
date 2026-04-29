import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireUser()
    const [links, categories] = await Promise.all([
      sql`SELECT * FROM links WHERE user_id = ${user.id} ORDER BY created_at DESC`,
      sql`SELECT * FROM categories WHERE user_id = ${user.id} ORDER BY created_at ASC`,
    ])
    const exportData = {
      version: '2.0',
      exported_at: new Date().toISOString(),
      links,
      categories,
    }
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="damoajo-export-${new Date().toISOString().slice(0,10)}.json"`,
      },
    })
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
