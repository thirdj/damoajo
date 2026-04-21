'use client'
import Image from 'next/image'
import { ExternalLink, Pencil, Trash2, ShoppingBag, Heart, Archive } from 'lucide-react'
import { LinkItem } from '@/types'
import { getSiteLabel, formatDate } from '@/lib/utils'

interface Props {
  item: LinkItem
  view: 'grid2' | 'grid3' | 'list'
  onEdit: (item: LinkItem) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: LinkItem['status']) => void
}

const STATUS_CONFIG = {
  wish: { label: '위시', color: 'bg-amber-50 text-amber-700', icon: Heart },
  bought: { label: '구매완료', color: 'bg-green-50 text-green-700', icon: ShoppingBag },
  archived: { label: '보관', color: 'bg-gray-100 text-gray-500', icon: Archive },
}

export default function LinkCard({ item, view, onEdit, onDelete, onStatusChange }: Props) {
  const status = STATUS_CONFIG[item.status]
  const StatusIcon = status.icon

  if (view === 'list') {
    return (
      <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-gray-200 transition-colors group">
        {/* 썸네일 */}
        <div className="w-12 h-12 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
          {item.thumbnail ? (
            <Image src={item.thumbnail} alt="" width={48} height={48} className="object-cover w-full h-full" unoptimized />
          ) : (
            <span className="text-xl">🔗</span>
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400">{item.site_name || getSiteLabel(item.url)}</span>
            {item.price && <span className="text-xs text-blue-600 font-medium">{item.price}</span>}
            <span className="text-xs text-gray-300">{formatDate(item.created_at)}</span>
          </div>
        </div>

        {/* 오른쪽 액션 */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${status.color}`}>
            <StatusIcon size={10} />
            {status.label}
          </span>
          <button onClick={() => window.open(item.url, '_blank')} className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600">
            <ExternalLink size={14} />
          </button>
          <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    )
  }

  // 그리드 뷰
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all group flex flex-col">
      {/* 썸네일 */}
      <div className="relative aspect-[16/10] bg-gray-50 overflow-hidden">
        {item.thumbnail ? (
          <Image src={item.thumbnail} alt={item.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            {item.favicon && (
              <Image src={item.favicon} alt="" width={24} height={24} unoptimized />
            )}
            <span className="text-xs text-gray-400">{item.site_name || getSiteLabel(item.url)}</span>
          </div>
        )}
        {/* 외부링크 버튼 */}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
        >
          <ExternalLink size={12} className="text-gray-600" />
        </a>
      </div>

      {/* 본문 */}
      <div className="p-3 flex flex-col flex-1">
        {/* 사이트명 */}
        <div className="flex items-center gap-1.5 mb-1.5">
          {item.favicon && (
            <Image src={item.favicon} alt="" width={12} height={12} unoptimized className="rounded-sm" />
          )}
          <span className="text-[11px] text-gray-400 uppercase tracking-wide truncate">
            {item.site_name || getSiteLabel(item.url)}
          </span>
        </div>

        {/* 제목 */}
        <p className={`text-sm font-medium text-gray-900 leading-snug mb-2 flex-1 ${view === 'grid3' ? 'line-clamp-2' : 'line-clamp-2'}`}>
          {item.title}
        </p>

        {/* 가격 */}
        {item.price && (
          <p className="text-sm font-semibold text-blue-600 mb-2">{item.price}</p>
        )}

        {/* 하단 */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-gray-50">
          <div className="flex items-center gap-1.5">
            {/* 카테고리 */}
            <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.category}</span>
            {/* 상태 */}
            <button
              onClick={() => {
                const next = item.status === 'wish' ? 'bought' : item.status === 'bought' ? 'archived' : 'wish'
                onStatusChange(item.id, next)
              }}
              className={`text-[11px] px-2 py-0.5 rounded-full flex items-center gap-0.5 ${status.color}`}
              title="클릭하여 상태 변경"
            >
              <StatusIcon size={9} />
              {status.label}
            </button>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(item)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
