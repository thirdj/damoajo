import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const { filter, category } = await req.json()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const params = new URLSearchParams()
    params.set('shared', user.id.slice(0, 8))
    if (filter && filter !== 'all') params.set('filter', filter)
    if (category && category !== '전체') params.set('category', category)

    const shareUrl = `${siteUrl}/shared?${params.toString()}`
    return NextResponse.json({ url: shareUrl })
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
