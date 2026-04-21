import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET /api/links - 링크 목록 조회
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const category = searchParams.get('category')

  let query = supabase
    .from('links')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)
  if (category && category !== '전체') query = query.eq('category', category)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/links - 링크 저장
export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // 중복 URL 체크
  const { data: existing } = await supabase
    .from('links')
    .select('id, title')
    .eq('user_id', user.id)
    .eq('url', body.url)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: 'DUPLICATE', existing },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from('links')
    .insert({
      user_id: user.id,
      url: body.url,
      title: body.title,
      description: body.description,
      thumbnail: body.thumbnail,
      site_name: body.site_name,
      favicon: body.favicon,
      price: body.price || null,
      category: body.category || '기타',
      status: 'wish',
      memo: null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
