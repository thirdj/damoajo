'use client'
import { useState, useEffect } from 'react'
import { X, TrendingDown } from 'lucide-react'
import { LinkItem } from '@/types'

interface Props {
  item: LinkItem | null
  categories: string[]
  onSave: (id: string, updates: Partial<LinkItem>) => void
  onClose: () => void
  onPriceHistory?: () => void
}

export default function EditModal({ item, categories, onSave, onClose, onPriceHistory }: Props) {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [memo, setMemo] = useState('')

  useEffect(() => {
    if (item) {
      setTitle(item.title)
      setPrice(item.price || '')
      setCategory(item.category)
      setMemo(item.memo || '')
    }
  }, [item])

  if (!item) return null

  const handleSave = () => {
    onSave(item.id, { title, price: price || null, category, memo: memo || null })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="text-base font-semibold text-gray-900">항목 수정</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">제목</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full h-11 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500">가격</label>
              {item.last_price && onPriceHistory && (
                <button onClick={onPriceHistory} className="text-xs text-blue-600 flex items-center gap-1">
                  <TrendingDown size={11} /> 변동 내역
                </button>
              )}
            </div>
            <input value={price} onChange={e => setPrice(e.target.value)} placeholder="예: 39000"
              className="w-full h-11 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
            {item.last_price && item.last_price !== item.price && (
              <p className="text-xs text-gray-400 mt-1">이전: {item.last_price}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">카테고리</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full h-11 px-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none">
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1.5">메모</label>
            <textarea value={memo} onChange={e => setMemo(e.target.value)} rows={2} placeholder="메모..."
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none resize-none" />
          </div>
        </div>

        <div className="px-5 pb-6 flex gap-2">
          <button onClick={onClose} className="h-12 px-5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600">취소</button>
          <button onClick={handleSave} className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl">저장</button>
        </div>
      </div>
    </div>
  )
}
