'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from '@stackframe/stack'
import { LinkItem, ViewMode, SortMode, FilterMode, Category } from '@/types'
import AddLinkBar from '@/components/AddLinkBar'
import LinkCard from '@/components/LinkCard'
import Toolbar from '@/components/Toolbar'
import EditModal from '@/components/EditModal'
import SearchBar from '@/components/SearchBar'
import ImportExportModal from '@/components/ImportExportModal'
import ToastContainer, { showToast } from '@/components/Toast'
import ConfirmModal from '@/components/ConfirmModal'
import { Plus, X, MoreVertical, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'

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

const PAGE_SIZE = 60

export default function DashboardPage() {
  const user = useUser({ or: 'redirect' })
  const [items, setItems] = useState<LinkItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1) // <-- 여기(1): totalPages 상태 선언

  const [view, setView] = useState<ViewMode>('grid2')
  const [filter, setFilter] = useState<FilterMode>('all')
  const [sort, setSort] = useState<SortMode>('newest')
  const [categoryFilter, setCategoryFilter] = useState('전체')
  const [categories, setCategories] = useState<Category[]>([])
  const [editItem, setEditItem] = useState<LinkItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showImportExport, setShowImportExport] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showAddLink, setShowAddLink] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<LinkItem | null>(null)

  const catsFetchedRef = useRef(false)
  const isFirstSearchRender = useRef(true)

  // 초기 마운트 시에는 실행하지 않고, 사용자가 검색어를 실제로 입력했을 때만 실행
  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false
      return
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])


  useEffect(() => {
    if (catsFetchedRef.current) return
    catsFetchedRef.current = true
    fetch('/api/categories')
      .then(res => (res.ok ? res.json() : []))
      .then(data => {
        if (data.length > 0) setCategories(data)
      })
      .catch(() => {})
  }, [])

  const lastQueryKeyRef = useRef<string>('')

  const fetchLinks = useCallback(async (force = false) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      search: debouncedSearch,
      filter,
      category: categoryFilter,
      sort,
    })
    const queryKey = params.toString()

    // 동일한 조건으로 이미 요청을 보냈다면 중복 호출 차단 (StrictMode 방어)
    if (!force && lastQueryKeyRef.current === queryKey) return
    lastQueryKeyRef.current = queryKey

    setLoading(true)
    try {
      const res = await fetch(`/api/links?${queryKey}`)
      if (res.status === 401) {
        window.location.href = '/handler/sign-in'
        return
      }
      if (!res.ok) {
        lastQueryKeyRef.current = '' // 실패 시 재시도 허용
        showToast('데이터를 불러오지 못했습니다.', 'error')
        return
      }
      const data = await res.json()
      setItems(data.items ?? [])
      setTotalPages(data.totalPages ?? 1)
    } catch {
      lastQueryKeyRef.current = ''
      showToast('네트워크 오류가 발생했습니다.', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, filter, categoryFilter, sort])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])


  const handleAdd = async (linkData: Omit<LinkItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(linkData),
      })
      if (res.status === 409) return { duplicate: true }
      if (res.status === 401) { window.location.href = '/handler/sign-in'; return {} }
      if (!res.ok) { showToast('저장에 실패했습니다.', 'error'); return {} }
      const newItem = await res.json()
      if (page === 1) {
        setItems(prev => [newItem, ...prev.slice(0, PAGE_SIZE - 1)])
      } else {
        setPage(1)
      }
      showToast('링크가 저장되었습니다.')
    } catch {
      showToast('네트워크 오류가 발생했습니다.', 'error')
    }
    return {}
  }

  const handleEdit = async (id: string, updates: Partial<LinkItem>) => {
    try {
      const res = await fetch(`/api/links/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.status === 401) { window.location.href = '/handler/sign-in'; return }
      if (!res.ok) { showToast('수정에 실패했습니다.', 'error'); return }
      const updated = await res.json()
      setItems(prev => prev.map(i => (i.id === id ? updated : i)))
      if (updated.priceChanged) {
        showToast(`가격 변동: ${updated.oldPrice || '미입력'} → ${updates.price || '미입력'}`, 'warning')
      }
    } catch {
      showToast('네트워크 오류가 발생했습니다.', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' })
      if (res.status === 401) { window.location.href = '/handler/sign-in'; return }
      if (!res.ok) { showToast('삭제에 실패했습니다.', 'error'); return }
      setItems(prev => prev.filter(i => i.id !== id))
      showToast('삭제되었습니다.')
    } catch {
      showToast('네트워크 오류가 발생했습니다.', 'error')
    }
  }

  const handleToggleFavorite = (id: string, val: boolean) => handleEdit(id, { is_favorite: val })

  const handleAddCategory = async () => {
    const name = prompt('새 카테고리 이름:')
    if (!name?.trim()) return
    if (categories.find(c => c.name === name)) {
      showToast('이미 존재하는 카테고리입니다.', 'warning'); return
    }
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) { showToast('카테고리 추가에 실패했습니다.', 'error'); return }
      const newCat = await res.json()
      setCategories(prev => [...prev, newCat])
      showToast(`"${name}" 카테고리가 추가되었습니다.`)
    } catch {
      showToast('네트워크 오류가 발생했습니다.', 'error')
    }
  }

  const handleDeleteCategory = async (cat: Category) => {
    const msg = `"${cat.name}" 카테고리를 삭제할까요? 해당 카테고리의 링크는 "기타"로 변경됩니다.`
    if (!confirm(msg)) return
    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
      if (!res.ok) { showToast('카테고리 삭제에 실패했습니다.', 'error'); return }
      setCategories(prev => prev.filter(c => c.id !== cat.id))
      if (categoryFilter === cat.name) {
        setCategoryFilter('전체')
        setPage(1)
      } else {
        fetchLinks()
      }
      showToast(`"${cat.name}" 카테고리가 삭제되었습니다.`)
    } catch {
      showToast('네트워크 오류가 발생했습니다.', 'error')
    }
  }

  const handleLogout = async () => {
    await user?.signOut()
    window.location.href = '/handler/sign-in'
  }

  const categoryNames = categories.map(c => c.name)

  const gridClass =
    view === 'grid2' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3' :
    view === 'grid3' ? 'grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2' :
    'flex flex-col gap-2'

  const goToPage = (nextPage: number) => {
    setPage(nextPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <ToastContainer />

      <ConfirmModal
        open={!!deleteTarget}
        message={deleteTarget ? `"${deleteTarget.title.slice(0, 30)}${deleteTarget.title.length > 30 ? '...' : ''}"을 삭제할까요?` : ''}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <span className="font-black text-gray-900 tracking-tight text-lg">whatItems</span>
          </div>
          <div className="flex items-center gap-1">
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
              <button onClick={() => { setCategoryFilter(cat); setPage(1) }}
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
          onFilterChange={f => { setFilter(f); setPage(1) }}
          onSortChange={s => { setSort(s); setPage(1) }}
        />

        {loading ? (
          <div className={gridClass}>
            {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} view={view} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-4">📦</span>
            <p className="text-sm font-medium">{search ? '검색 결과가 없습니다.' : '저장된 링크가 없습니다.'}</p>
            <p className="text-xs mt-1">{search ? '다른 키워드로 검색해보세요.' : '+ 버튼으로 저장해보세요.'}</p>
          </div>
        ) : (
          <>
            <div className={gridClass}>
              {items.map(item => (
                <LinkCard
                  key={item.id}
                  item={item}
                  view={view}
                  onEdit={setEditItem}
                  onDelete={id => setDeleteTarget(items.find(i => i.id === id) || null)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>

            {/* <-- 여기(3): totalPages 기반 페이지 번호 버튼 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap mt-8">
                <button
                  onClick={() => goToPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-0.5 px-2.5 h-8 sm:h-9 text-xs font-medium bg-white border border-gray-200 rounded-xl text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  <ChevronLeft size={14} /> 이전
                </button>

                {(() => {
                  const pages: (number | '...')[] = []
                  if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i)
                  } else if (page <= 3) {
                    pages.push(1, 2, 3, 4, '...', totalPages)
                  } else if (page >= totalPages - 2) {
                    pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
                  } else {
                    pages.push(1, '...', page - 1, page, page + 1, '...', totalPages)
                  }

                  return pages.map((p, idx) =>
                    p === '...' ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs text-gray-400 select-none">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goToPage(p)}
                        className={`w-8 h-8 sm:w-9 sm:h-9 text-xs font-semibold rounded-xl border transition-colors flex-shrink-0 ${
                          p === page
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )
                })()}

                <button
                  onClick={() => goToPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-0.5 px-2.5 h-8 sm:h-9 text-xs font-medium bg-white border border-gray-200 rounded-xl text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors whitespace-nowrap flex-shrink-0"
                >
                  다음 <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {showAddLink && (
        <AddLinkBar categories={categoryNames} onAdd={handleAdd} defaultOpen={true} onClose={() => setShowAddLink(false)} />
      )}

      <EditModal
        item={editItem}
        categories={['기타', ...categoryNames]}
        onSave={handleEdit}
        onClose={() => setEditItem(null)}
      />

      {showImportExport && (
        <ImportExportModal
          onClose={() => setShowImportExport(false)}
          onImportDone={() => { setPage(1); fetchLinks() }}
        />
      )}
    </div>
  )
}
