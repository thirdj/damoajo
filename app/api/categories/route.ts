import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { requireUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await requireUser()
    const data = await sql`
      SELECT id, name, color, created_at FROM categories
      WHERE user_id = ${user.id} ORDER BY created_at ASC
    `
    return NextResponse.json(data)
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const { name, color } = await req.json()
    const [cat] = await sql`
      INSERT INTO categories (user_id, name, color)
      VALUES (${user.id}, ${name}, ${color || '#3b82f6'})
      ON CONFLICT (user_id, name) DO NOTHING
      RETURNING *
    `
    if (!cat) return NextResponse.json({ error: 'Already exists' }, { status: 409 })
    return NextResponse.json(cat, { status: 201 })
  } catch (e) {
    if ((e as Error).message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}