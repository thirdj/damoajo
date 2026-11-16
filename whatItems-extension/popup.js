// ★ 배포 후에는 실제 Vercel 도메인으로 변경하세요 (예: 'https://damoajo.vercel.app')
const API_BASE = 'http://localhost:3000'

let pageData = {
  url: '',
  title: '',
  description: null,
  thumbnail: null,
  site_name: null,
  favicon: null,
  price: null,
}

// 1. 현재 탭 정보 및 페이지 내 메타태그 추출
async function extractCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab?.id || !tab.url) return

  pageData.url = tab.url
  pageData.title = tab.title || ''
  pageData.favicon = tab.favIconUrl || null

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const getMeta = (selector) => document.querySelector(selector)?.getAttribute('content') || null
        const ogTitle = getMeta('meta[property="og:title"]')
        const ogImage = getMeta('meta[property="og:image"]')
        const ogSite = getMeta('meta[property="og:site_name"]')
        const desc = getMeta('meta[property="og:description"]') || getMeta('meta[name="description"]')
        // 쇼핑몰 가격 메타태그 추출 시도
        const rawPrice =
          getMeta('meta[property="product:price:amount"]') ||
          getMeta('meta[property="og:price:amount"]') ||
          null

        return { ogTitle, ogImage, ogSite, desc, rawPrice, hostname: location.hostname }
      },
    })

    if (result) {
      if (result.ogTitle) pageData.title = result.ogTitle
      pageData.thumbnail = result.ogImage
      pageData.site_name = result.ogSite || result.hostname.replace(/^www\./, '')
      pageData.description = result.desc
      if (result.rawPrice) {
        const num = parseInt(result.rawPrice.replace(/[^0-9]/g, ''), 10)
        if (num > 0) pageData.price = num.toLocaleString('ko-KR') + '원'
      }
    }
  } catch (e) {
    // 크롬 내부 페이지(chrome://) 등 스크립트 실행 불가 영역 예외 처리
  }

  document.getElementById('title').value = pageData.title
  document.getElementById('siteName').textContent = pageData.site_name || new URL(pageData.url).hostname
  document.getElementById('urlText').textContent = pageData.url

  if (pageData.price) document.getElementById('price').value = pageData.price
  if (pageData.thumbnail && !pageData.thumbnail.startsWith('data:')) {
    document.getElementById('thumb').src = pageData.thumbnail
  }
}

// 2. 내 카테고리 목록 불러오기 (로그인 세션 쿠키 자동 포함)
async function loadCategories() {
  const statusEl = document.getElementById('status')
  try {
    const res = await fetch(`${API_BASE}/api/categories`, { credentials: 'include' })
    if (res.status === 401) {
      statusEl.className = 'status error'
      statusEl.innerHTML = `로그인이 필요합니다. <a href="${API_BASE}/handler/sign-in" target="_blank">로그인하기</a>`
      document.getElementById('saveBtn').disabled = true
      return
    }
    if (res.ok) {
      const cats = await res.json()
      const select = document.getElementById('category')
      cats.forEach((c) => {
        if (c.name === '기타') return
        const opt = document.createElement('option')
        opt.value = c.name
        opt.textContent = c.name
        select.appendChild(opt)
      })
    }
  } catch {
    statusEl.className = 'status error'
    statusEl.textContent = '서버에 연결할 수 없습니다.'
  }
}

// 3. 저장 버튼 클릭 시 POST /api/links 호출
document.getElementById('saveBtn').addEventListener('click', async () => {
  const btn = document.getElementById('saveBtn')
  const statusEl = document.getElementById('status')
  btn.disabled = true
  statusEl.className = 'status'
  statusEl.textContent = '저장 중...'

  const payload = {
    ...pageData,
    title: document.getElementById('title').value.trim() || pageData.title,
    category: document.getElementById('category').value,
    price: document.getElementById('price').value.trim() || null,
  }

  try {
    const res = await fetch(`${API_BASE}/api/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    if (res.status === 409) {
      statusEl.className = 'status warn'
      statusEl.textContent = '이미 저장된 링크입니다.'
      btn.disabled = false
      return
    }
    if (!res.ok) {
      statusEl.className = 'status error'
      statusEl.textContent = '저장에 실패했습니다.'
      btn.disabled = false
      return
    }

    statusEl.className = 'status success'
    statusEl.textContent = '저장 완료!'
    setTimeout(() => window.close(), 800)
  } catch {
    statusEl.className = 'status error'
    statusEl.textContent = '네트워크 오류가 발생했습니다.'
    btn.disabled = false
  }
})

extractCurrentTab()
loadCategories()
