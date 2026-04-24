import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const filter = searchParams.get('filter') || 'all'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  let query = supabase
    .from('links')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)

  if (filter === 'favorite') query = query.eq('is_favorite', true)
  else if (filter === 'no_price') query = query.is('price', null)

  if (category && category !== '전체') query = query.eq('category', category)

  query = query
    .order('is_favorite', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    items: data || [],
    total: count || 0,
    page,
    hasMore: (offset + limit) < (count || 0),
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data: existing } = await supabase
    .from('links')
    .select('id, title')
    .eq('user_id', user.id)
    .eq('url', body.url)
    .single()

  if (existing) return NextResponse.json({ error: 'DUPLICATE', existing }, { status: 409 })

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
      is_favorite: false,
      memo: null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
