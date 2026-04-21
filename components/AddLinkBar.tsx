'use client'
import { useState, useRef } from 'react'
import { Plus, X, Loader2, Link2, AlertCircle, Upload, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { LinkItem, OGData } from '@/types'

interface Props {
  categories: string[]
  onAdd: (item: Omit<LinkItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<{ duplicate?: boolean }>
}

export default function AddLinkBar({ categories, onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'input' | 'confirm'>('input')
  const fileRef = useRef<HTMLInputElement>(null)

  const [url, setUrl] = useState('')
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState('')

  const [og, setOg] = useState<OGData & { needsManualEdit?: boolean } | null>(null)
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('기타')
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    setOpen(false)
    setStep('input')
    setUrl('')
    setOg(null)
    setTitle('')
    setPrice('')
    setCategory('기타')
    setFetchError('')
    setError('')
    setThumbnailPreview(null)
    setThumbnailUrl(null)
  }

  const handleFetch = async () => {
    const trimmed = url.trim()
    if (!trimmed) return
    try { new URL(trimmed) } catch {
      setFetchError('올바른 URL을 입력해주세요. (https:// 포함)')
      return
    }
    setFetching(true)
    setFetchError('')
    try {
      const res = await fetch('/api/og-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })
      const data: OGData & { needsManualEdit?: boolean } = await res.json()
      setOg(data)
      setTitle(data.title || '')
      setThumbnailPreview(data.thumbnail || null)
      setThumbnailUrl(data.thumbnail || null)
      setStep('confirm')
    } catch {
      setFetchError('링크 정보를 가져오지 못했어요.')
    } finally {
      setFetching(false)
    }
  }

  // 이미지 파일 직접 업로드 → base64로 변환해서 미리보기
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setThumbnailPreview(base64)
      setThumbnailUrl(base64)
    }
    reader.readAsDataURL(file)
  }

  // 드래그 앤 드롭
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleImageFile(file)
  }

  const handleSave = async () => {
    if (!title.trim()) { setError('제목을 입력해주세요.'); return }
    setSaving(true)
    setError('')
    try {
      const result = await onAdd({
        url: url.trim(),
        title,
        description: og?.description ?? null,
        thumbnail: thumbnailUrl,
        site_name: og?.site_name ?? null,
        favicon: og?.favicon ?? null,
        price: price || null,
        category,
        status: 'wish',
        memo: null,
      })
      if (result.duplicate) {
        setError('이미 저장된 링크입니다.')
      } else {
        handleClose()
      }
    } catch {
      setError('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-medium rounded-2xl flex items-center justify-center gap-2 transition-all mb-5 shadow-sm"
      >
        <Plus size={16} />
        링크 저장하기
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={handleClose}>
          <div
            className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                {step === 'confirm' && (
                  <button onClick={() => setStep('input')} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 mr-1 text-lg leading-none">
                    ←
                  </button>
                )}
                <h2 className="text-base font-semibold text-gray-900">
                  {step === 'input' ? '링크 추가' : '저장 확인'}
                </h2>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400">
                <X size={16} />
              </button>
            </div>

            {/* STEP 1 */}
            {step === 'input' && (
              <div className="px-5 py-5">
                <label className="text-xs font-medium text-gray-500 block mb-2">쇼핑몰 링크</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      autoFocus
                      type="url"
                      value={url}
                      onChange={e => { setUrl(e.target.value); setFetchError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleFetch()}
                      placeholder="https://smartstore.naver.com/..."
                      className="w-full h-11 pl-9 pr-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>
                  <button
                    onClick={handleFetch}
                    disabled={fetching || !url.trim()}
                    className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {fetching ? <Loader2 size={15} className="animate-spin" /> : '가져오기'}
                  </button>
                </div>

                {fetchError && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
                    <AlertCircle size={12} /> {fetchError}
                  </div>
                )}

                {fetching && (
                  <div className="mt-6 flex flex-col items-center gap-2 py-4 text-gray-400">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                    <p className="text-xs">썸네일과 제목을 가져오는 중...</p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2 */}
            {step === 'confirm' && og && (
              <div className="px-5 py-5 space-y-4">

                {/* 썸네일 영역 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-500">썸네일</label>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Upload size={11} /> 직접 업로드
                    </button>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f) }}
                  />

                  {/* 썸네일 미리보기 or 업로드 영역 */}
                  <div
                    className="w-full aspect-[16/9] bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer relative group border-2 border-dashed border-transparent hover:border-blue-300 transition-colors"
                    onClick={() => fileRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={e => e.preventDefault()}
                  >
                    {thumbnailPreview ? (
                      <>
                        <Image
                          src={thumbnailPreview}
                          alt="썸네일"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        {/* 호버 오버레이 */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                          <Upload size={20} className="text-white" />
                          <p className="text-white text-xs">클릭하여 변경</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-gray-400 pointer-events-none">
                        <ImageIcon size={28} className="text-gray-300" />
                        <p className="text-xs text-center">
                          이미지를 가져오지 못했어요<br />
                          <span className="text-blue-500">클릭</span>하거나 드래그해서 직접 추가하세요
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 이미지 URL 직접 입력 */}
                  <div className="mt-2">
                    <input
                      type="url"
                      placeholder="또는 이미지 URL 직접 입력..."
                      value={thumbnailUrl?.startsWith('data:') ? '' : (thumbnailUrl || '')}
                      onChange={e => {
                        const v = e.target.value
                        setThumbnailUrl(v || null)
                        setThumbnailPreview(v || null)
                      }}
                      className="w-full h-9 px-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-gray-500"
                    />
                  </div>
                </div>

                {/* 제목 */}
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1.5">제목</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>

                {/* 가격 + 카테고리 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">가격 (선택)</label>
                    <input
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      placeholder="예: 39,000원"
                      className="w-full h-10 px-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 block mb-1.5">카테고리</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full h-10 px-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {['기타', ...categories].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* 출처 */}
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  {og.favicon && (
                    <Image src={og.favicon} alt="" width={12} height={12} unoptimized className="rounded-sm" />
                  )}
                  <span>{og.site_name}</span>
                  <span className="text-gray-200">·</span>
                  <span className="truncate text-gray-300 text-[11px]">{url}</span>
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    <AlertCircle size={12} /> {error}
                  </div>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  {saving ? '저장 중...' : '저장하기'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
