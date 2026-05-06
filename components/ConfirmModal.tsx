'use client'
import { Trash2 } from 'lucide-react'

interface Props {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ open, title = '삭제 확인', message, confirmLabel = '삭제', onConfirm, onCancel }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onCancel}>
      <div className="bg-white w-full sm:max-w-xs rounded-t-3xl sm:rounded-2xl shadow-2xl p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 h-11 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 font-medium">
            취소
          </button>
          <button onClick={() => { onConfirm(); onCancel() }} className="flex-1 h-11 bg-red-500 hover:bg-red-600 rounded-xl text-sm text-white font-semibold">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}