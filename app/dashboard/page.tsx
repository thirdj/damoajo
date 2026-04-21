'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { LinkItem, ViewMode } from '@/types'
import AddLinkBar from '@/components/AddLinkBar'
import LinkCard from '@/components/LinkCard'
import Toolbar from '@/components/Toolbar'
import EditModal from '@/components/EditModal'
import { Package, LogOut, Plus } from 'lucide-react'

const DEFAULT_CATEGORIES = ['패션', '전자기기', '생활용품', '뷰티', '식품', '기타']

export default function DashboardPage() {
  const supabase = createClient()
  const [items, setItems] = useState<LinkItem[]>([])
  const [view, setView] = useState<ViewMode>('grid2')
  const [filter, setFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('전체')
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [editItem, setEditItem] = useState<LinkItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  const fetchLinks = useCallback(async () => {
    const res = await fetch('/api/links')
    if (res.ok) {
      const data = await res.json()
      setItems(data)
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    const res = await fetch('/api/categories')
    if (res.ok) {
      const data = await res.json()
      if (data.length > 0) {
        setCategories(data.map((c: { name: string }) => c.name))
      }
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/auth'; return }
      setUserEmail(user.email || '')
      await Promise.all([fetchLinks(), fetchCategories()])
      setLoading(false)
    }
    init()
  }, [supabase, fetchLinks, fetchCategories])

  const handleAdd = async (linkData: Omit<LinkItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(linkData),
    })
    if (res.status === 409) return { duplicate: true }
    if (res.ok) {
      const newItem = await res.json()
      setItems(prev => [newItem, ...prev])
    }
    return {}
  }

  const handleEdit = async (id: string, updates: Partial<LinkItem>) => {
    const res = await fetch(`/api/links/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      const updated = await res.json()
      setItems(prev => prev.map(i => i.id === id ? updated : i))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    const res = await fetch(`/api/links/${id}`, { method: 'DELETE' })
    if (res.ok) setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleStatusChange = async (id: string, status: LinkItem['status']) => {
    await handleEdit(id, { status })
  }

  const handleAddCategory = async () => {
    const name = prompt('새 카테고리 이름을 입력하세요:')
    if (!name || categories.includes(name)) return
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) setCategories(prev => [...prev, name])
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  // 필터링
  const filtered = items.filter(item => {
    if (filter !== 'all' && item.status !== filter) return false
    if (categoryFilter !== '전체' && item.category !== categoryFilter) return false
    return true
  })

  const counts = {
    all: items.length,
    wish: items.filter(i => i.status === 'wish').length,
    bought: items.filter(i => i.status === 'bought').length,
    archived: items.filter(i => i.status === 'archived').length,
  }

  const gridClass =
    view === 'grid2' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' :
    view === 'grid3' ? 'grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5' :
    'flex flex-col gap-2'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={20} className="text-blue-600" />
            <span className="font-semibold text-gray-900">MyLinkBox</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">{userEmail}</span>
            <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100">
              <LogOut size={13} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* 링크 추가 영역 */}
        <AddLinkBar
          categories={['기타', ...categories]}
          onAdd={handleAdd}
        />

        {/* 카테고리 필터 */}
        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          {['전체', ...categories].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`text-xs h-7 px-3 rounded-full border transition-all ${
                categoryFilter === cat
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={handleAddCategory}
            className="text-xs h-7 px-3 rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600 flex items-center gap-1"
          >
            <Plus size={11} /> 추가
          </button>
        </div>

        {/* 상태 필터 + 뷰 전환 */}
        <Toolbar
          view={view}
          filter={filter}
          onViewChange={setView}
          onFilterChange={setFilter}
          totalCounts={counts}
        />

        {/* 아이템 목록 */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Package size={40} className="mb-3 text-gray-200" />
            <p className="text-sm">저장된 링크가 없습니다.</p>
            <p className="text-xs mt-1">위에서 링크를 붙여넣어 저장해보세요.</p>
          </div>
        ) : (
          <div className={gridClass}>
            {filtered.map(item => (
              <LinkCard
                key={item.id}
                item={item}
                view={view}
                onEdit={setEditItem}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </main>

      {/* 수정 모달 */}
      <EditModal
        item={editItem}
        categories={['기타', ...categories]}
        onSave={handleEdit}
        onClose={() => setEditItem(null)}
      />
    </div>
  )
}
