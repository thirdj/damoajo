'use client'
import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
}

export default function SearchBar({ value, onChange }: Props) {
  const [local, setLocal] = useState(value)

  // 디바운스 300ms
  useEffect(() => {
    const t = setTimeout(() => onChange(local), 300)
    return () => clearTimeout(t)
  }, [local, onChange])

  // 외부에서 value 초기화 시 동기화
  useEffect(() => {
    if (value === '' && local !== '') setLocal('')
  }, [value, local])

  return (
    <div className="relative mb-4">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={local}
        onChange={e => setLocal(e.target.value)}
        placeholder="제목, 사이트로 검색..."
        className="w-full h-10 pl-9 pr-9 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
      />
      {local && (
        <button
          onClick={() => { setLocal(''); onChange('') }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}