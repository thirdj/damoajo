'use client'
import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, XCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning'

interface Toast {
  id: number
  type: ToastType
  message: string
}

let toastId = 0
type Listener = (toasts: Toast[]) => void
let listeners: Listener[] = []
let toasts: Toast[] = []

function notify(listeners: Listener[], toasts: Toast[]) {
  listeners.forEach(l => l([...toasts]))
}

export function showToast(message: string, type: ToastType = 'success') {
  const id = ++toastId
  toasts = [...toasts, { id, type, message }]
  notify(listeners, toasts)
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id)
    notify(listeners, toasts)
  }, 3500)
}

export default function ToastContainer() {
  const [items, setItems] = useState<Toast[]>([])

  useEffect(() => {
    listeners.push(setItems)
    return () => { listeners = listeners.filter(l => l !== setItems) }
  }, [])

  if (items.length === 0) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {items.map(item => (
        <div
          key={item.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium ${
            item.type === 'success' ? 'bg-gray-900 text-white' :
            item.type === 'error' ? 'bg-red-600 text-white' :
            'bg-amber-500 text-white'
          }`}
        >
          {item.type === 'success' && <CheckCircle2 size={16} className="flex-shrink-0" />}
          {item.type === 'error' && <XCircle size={16} className="flex-shrink-0" />}
          {item.type === 'warning' && <AlertCircle size={16} className="flex-shrink-0" />}
          <span className="flex-1">{item.message}</span>
          <button onClick={() => setItems(p => p.filter(t => t.id !== item.id))}>
            <X size={14} className="opacity-70" />
          </button>
        </div>
      ))}
    </div>
  )
}