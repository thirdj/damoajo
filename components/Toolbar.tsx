'use client'
import { LayoutGrid, List, Grid3X3 } from 'lucide-react'
import { ViewMode } from '@/types'

interface Props {
  view: ViewMode
  filter: string
  onViewChange: (v: ViewMode) => void
  onFilterChange: (f: string) => void
  totalCounts: { all: number; wish: number; bought: number; archived: number }
}

export default function Toolbar({ view, filter, onViewChange, onFilterChange, totalCounts }: Props) {
  const filters = [
    { key: 'all', label: `전체 ${totalCounts.all}` },
    { key: 'wish', label: `위시 ${totalCounts.wish}` },
    { key: 'bought', label: `구매완료 ${totalCounts.bought}` },
    { key: 'archived', label: `보관함 ${totalCounts.archived}` },
  ]

  return (
    <div className="flex items-center justify-between mb-4">
      {/* 필터 */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`text-xs h-7 px-3 rounded-lg transition-all ${
              filter === f.key
                ? 'bg-white text-gray-900 shadow-sm font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 뷰 전환 */}
      <div className="flex items-center gap-0.5 border border-gray-200 rounded-xl p-1 bg-white">
        {[
          { key: 'grid2' as ViewMode, Icon: LayoutGrid, label: '2열' },
          { key: 'grid3' as ViewMode, Icon: Grid3X3, label: '3열' },
          { key: 'list' as ViewMode, Icon: List, label: '목록' },
        ].map(({ key, Icon, label }) => (
          <button
            key={key}
            onClick={() => onViewChange(key)}
            title={label}
            className={`p-1.5 rounded-lg transition-all ${
              view === key ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Icon size={15} />
          </button>
        ))}
      </div>
    </div>
  )
}
