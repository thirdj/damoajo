'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useUser } from '@stackframe/stack'
import { LinkItem, ViewMode, SortMode, FilterMode, Category } from '@/types'
import AddLinkBar from '@/components/AddLinkBar'
import LinkCard from '@/components/LinkCard'
import Toolbar from '@/components/Toolbar'
import EditModal from '@/components/EditModal'
import PriceHistoryModal from '@/components/PriceHistoryModal'
import SearchBar from '@/components/SearchBar'
import ImportExportModal from '@/components/ImportExportModal'
import PriceAlertBell from '@/components/PriceAlertBell'
import { Plus, X, MoreVertical, LogOut } from 'lucide-react'

function parsePrice(p: string | null): number {
  if (!p) return 0
  return parseInt(p.replace(/[^0-9]/g, '')) || 0
}

function CardSkeleton({ view }: { view: ViewMode }) {
  if (view === 'list') {
    return (
      <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3 py-3 animate-pulse">
        <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 bg-gray-200 rounded-full w-3/4" />
          <div className="h-3 bg-gray-100 rounded-full w-1/2" />
        </div>
      </div>
    )
  }
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 bg-gray-100 rounded-full w-1/3" />
        <div className="h-3.5 bg-gray-200 rounded-full w-full" />
        <div className="h-3.5 bg-gray-200 rounded-full w-4/5" />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const user = useUser({ or: 'redirect' })
  const [allItems, setAllItems] = useState<LinkItem[]>([])
  const [view, setView] = useState<ViewMode>('grid2')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [sort, setSort] = useState<SortMode>('newest')
  const [categoryFilter, setCategoryFilter] = useState('전체')
  const [categories, setCategories] = useState<Category[]>([])
  const [editItem, setEditItem] = useState<LinkItem | null>(null)
  const [priceHistoryItem, setPriceHistoryItem] = useState<{ id: string; title: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showImportExport, setShowImportExport] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showAddLink, setShowAddLink] = useState(false)

  // 전체 데이터 한번에 로딩
  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [linksRes, catsRes] = await Promise.all([
      fetch('/api/links'),
      fetch('/api/categories'),
    ])
    if (linksRes.ok) setAllItems(await linksRes.json())
    if (catsRes.ok) {
      const data = await catsRes.json()
      if (data.length > 0) setCategories(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!user) return
    fetchAll()
  }, [user, fetchAll])

  const handleAdd = async (linkData: Omit<LinkItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(linkData),
    })
    if (res.status === 409) return { duplicate: true }
    if (res.ok) {
      const newItem = await res.json()
      setAllItems(prev => [newItem, ...prev])
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
      setAllItems(prev => prev.map(i => i.id === id ? updated : i))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return
    const res = await fetch(`/api/links/${id}`, { method: 'DELETE' })
    if (res.ok) setAllItems(prev => prev.filter(i => i.id !== id))
  }

  const handleToggleFavorite = (id: string, val: boolean) => handleEdit(id, { is_favorite: val })

  const handleAddCategory = async () => {
    const name = prompt('새 카테고리 이름:')
    if (!name || categories.find(c => c.name === name)) return
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const newCat = await res.json()
      setCategories(prev => [...prev, newCat])
    }
  }

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`"${cat.name}" 삭제?`)) return
    const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
    if (res.ok) {
      setCategories(prev => prev.filter(c => c.id !== cat.id))
      if (categoryFilter === cat.name) setCategoryFilter('전체')
    }
  }

  const handleLogout = async () => {
    await user?.signOut()
    window.location.href = '/handler/sign-in'
  }

  const categoryNames = categories.map(c => c.name)

  // 클라이언트 필터링 + 정렬 (API 호출 없이 즉시 반응)
  const displayed = useMemo(() => {
    let list = [...allItems]

    // 검색
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(i =>
        i.title.toLowerCase().includes(q) ||
        (i.site_name || '').toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
      )
    }

    // 필터
    if (filter === 'favorite') list = list.filter(i => i.is_favorite)
    else if (filter === 'no_price') list = list.filter(i => !i.price)

    // 카테고리
    if (categoryFilter !== '전체') list = list.filter(i => i.category === categoryFilter)

    // 정렬
    list.sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sort === 'price_asc') return parsePrice(a.price) - parsePrice(b.price)
      if (sort === 'price_desc') return parsePrice(b.price) - parsePrice(a.price)
      if (sort === 'site') return (a.site_name || '').localeCompare(b.site_name || '')
      return 0
    })

    return list
  }, [allItems, search, filter, categoryFilter, sort])

  const totalBudget = useMemo(() => {
    const priced = displayed.filter(i => i.price)
    if (priced.length === 0) return null
    const sum = priced.reduce((s, i) => s + parsePrice(i.price), 0)
    return '₩' + sum.toLocaleString('ko-KR')
  }, [displayed])

  const gridClass =
    view === 'grid2' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3' :
    view === 'grid3' ? 'grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2' :
    'flex flex-col gap-2'

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <span className="font-black text-gray-900 tracking-tight text-lg">Damoajo</span>
          </div>
          <div className="flex items-center gap-1">
            <PriceAlertBell />
            <button
              onClick={() => setShowAddLink(true)}
              className="flex items-center gap-1 px-3 h-8 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all"
            >
              <span className="text-lg leading-none">+</span>
              <span className="hidden sm:inline">추가</span>
            </button>
            <div className="relative">
              <button onClick={() => setShowMenu(v => !v)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
                <MoreVertical size={16} />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-10 bg-white border border-gray-100 rounded-2xl shadow-xl w-44 py-1.5 z-50">
                    <button onClick={() => { setShowImportExport(true); setShowMenu(false) }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      📤 내보내기 / 가져오기
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2">
                      <LogOut size={14} /> 로그아웃
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4">
        <SearchBar value={search} onChange={setSearch} />

        {/* 카테고리 필터 */}
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
          {['전체', ...categoryNames].map(cat => (
            <div key={cat} className="relative group flex-shrink-0">
              <button
                onClick={() => setCategoryFilter(cat)}
                className={`text-xs h-7 px-3 rounded-full border transition-all whitespace-nowrap ${
                  categoryFilter === cat ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'
                }`}>
                {cat}
              </button>
              {cat !== '전체' && (
                <button
                  onClick={e => { e.stopPropagation(); const c = categories.find(x => x.name === cat); if (c) handleDeleteCategory(c) }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-gray-400 hover:bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex text-[10px]">
                  <X size={8} />
                </button>
              )}
            </div>
          ))}
          <button onClick={handleAddCategory}
            className="flex-shrink-0 text-xs h-7 px-3 rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 whitespace-nowrap flex items-center gap-1">
            <Plus size={10} /> 추가
          </button>
        </div>

        <Toolbar
          view={view} filter={filter} sort={sort}
          onViewChange={setView}
          onFilterChange={(f) => setFilter(f)}
          onSortChange={setSort}
          totalCount={displayed.length}
          totalBudget={totalBudget}
        />

        {/* 콘텐츠 */}
        {loading ? (
          <div className={gridClass}>
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} view={view} />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-4">📦</span>
            <p className="text-sm font-medium">{search ? '검색 결과가 없습니다.' : '저장된 링크가 없습니다.'}</p>
            <p className="text-xs mt-1">{search ? '다른 키워드로 검색해보세요.' : '+ 버튼으로 저장해보세요.'}</p>
          </div>
        ) : (
          <div className={gridClass}>
            {displayed.map(item => (
              <LinkCard
                key={item.id}
                item={item}
                view={view}
                onEdit={setEditItem}
                onDelete={handleDelete}
                onPriceHistory={() => setPriceHistoryItem({ id: item.id, title: item.title })}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        )}

        {/* 하단 카운트 */}
        {!loading && displayed.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-6">총 {displayed.length}개</p>
        )}
      </main>

      {showAddLink && (
        <AddLinkBar
          categories={categoryNames}
          onAdd={handleAdd}
          defaultOpen={true}
          onClose={() => setShowAddLink(false)}
        />
      )}

      <EditModal
        item={editItem}
        categories={['기타', ...categoryNames]}
        onSave={handleEdit}
        onClose={() => setEditItem(null)}
        onPriceHistory={editItem ? () => { setEditItem(null); setPriceHistoryItem({ id: editItem.id, title: editItem.title }) } : undefined}
      />

      <PriceHistoryModal
        linkId={priceHistoryItem?.id ?? null}
        linkTitle={priceHistoryItem?.title ?? ''}
        onClose={() => setPriceHistoryItem(null)}
      />

      {showImportExport && (
        <ImportExportModal
          onClose={() => setShowImportExport(false)}
          onImportDone={fetchAll}
        />
      )}
    </div>
  )
}