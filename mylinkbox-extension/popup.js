// ── 화면 전환 ──
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  document.getElementById(id).classList.add('active')
}

// ── 토스트 ──
function showToast(msg) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 2000)
}

// ── 설정 로드/저장 ──
async function loadSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get(['appUrl', 'supabaseUrl', 'supabaseKey'], resolve)
  })
}

// ── 이미지 → base64 ──
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── 썸네일 세팅 ──
let currentThumbnail = null

function setThumbnail(src) {
  currentThumbnail = src
  const img = document.getElementById('thumbImg')
  const placeholder = document.getElementById('thumbPlaceholder')
  if (src) {
    img.src = src
    img.style.display = 'block'
    placeholder.style.display = 'none'
  } else {
    img.style.display = 'none'
    placeholder.style.display = 'flex'
  }
}

// ── 메인 ──
let pageData = null
let isSettingsOpen = false

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await loadSettings()

  // 설정 화면 초기값
  document.getElementById('appUrlInput').value = settings.appUrl || 'http://localhost:3000'
  document.getElementById('supabaseUrlInput').value = settings.supabaseUrl || ''
  document.getElementById('supabaseKeyInput').value = settings.supabaseKey || ''

  // ── 설정 토글 ──
  document.getElementById('settingsToggle').addEventListener('click', () => {
    isSettingsOpen = !isSettingsOpen
    if (isSettingsOpen) {
      showScreen('settingsScreen')
    } else {
      showScreen(pageData ? 'previewScreen' : 'loadingScreen')
    }
  })

  // ── 설정 저장 ──
  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    const appUrl = document.getElementById('appUrlInput').value.trim()
    const supabaseUrl = document.getElementById('supabaseUrlInput').value.trim()
    const supabaseKey = document.getElementById('supabaseKeyInput').value.trim()
    chrome.storage.local.set({ appUrl, supabaseUrl, supabaseKey }, () => {
      showToast('설정이 저장되었습니다')
      isSettingsOpen = false
      setTimeout(() => showScreen(pageData ? 'previewScreen' : 'loadingScreen'), 300)
    })
  })

  // ── 이미지 파일 업로드 ──
  document.getElementById('thumbWrap').addEventListener('click', () => {
    document.getElementById('fileInput').click()
  })

  document.getElementById('fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const base64 = await fileToBase64(file)
    setThumbnail(base64)
  })

  // ── 앱에서 보기 ──
  document.getElementById('openAppBtn').addEventListener('click', async () => {
    const s = await loadSettings()
    chrome.tabs.create({ url: s.appUrl || 'http://localhost:3000' })
  })

  // ── 설정 없으면 설정 화면 먼저 ──
  if (!settings.supabaseUrl || !settings.supabaseKey) {
    isSettingsOpen = true
    showScreen('settingsScreen')
    showToast('먼저 Supabase 설정을 입력해주세요')
    return
  }

  // ── 현재 탭에서 페이지 정보 추출 ──
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_INFO' })

    if (!response?.success) throw new Error(response?.error || 'unknown')

    pageData = response.data
    renderPreview(pageData)
  } catch (e) {
    document.getElementById('errorMsg').textContent =
      '페이지를 새로고침 후 다시 시도해주세요.\n(' + (e.message || '') + ')'
    showScreen('errorScreen')
  }
})

function renderPreview(data) {
  document.getElementById('titleInput').value = data.title || ''
  document.getElementById('priceInput').value = data.price || ''
  document.getElementById('siteNameEl').textContent = data.site_name || ''

  const favicon = document.getElementById('faviconImg')
  if (data.favicon) {
    favicon.src = data.favicon
    favicon.style.display = 'inline'
  } else {
    favicon.style.display = 'none'
  }

  if (data.thumbnail) {
    setThumbnail(data.thumbnail)
    document.getElementById('warnBox').style.display = 'none'
  } else {
    setThumbnail(null)
    document.getElementById('warnBox').style.display = 'flex'
  }

  showScreen('previewScreen')
}

// ── 저장 ──
document.getElementById('saveBtn').addEventListener('click', async () => {
  const btn = document.getElementById('saveBtn')
  const errEl = document.getElementById('saveError')
  errEl.style.display = 'none'

  const title = document.getElementById('titleInput').value.trim()
  if (!title) {
    errEl.textContent = '제목을 입력해주세요.'
    errEl.style.display = 'block'
    return
  }

  btn.disabled = true
  btn.innerHTML = '<span style="opacity:0.7">저장 중...</span>'

  try {
    const settings = await loadSettings()
    const supabaseUrl = settings.supabaseUrl
    const supabaseKey = settings.supabaseKey

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase 설정을 먼저 입력해주세요.')
    }

    // Supabase에서 현재 유저 가져오기
    const sessionRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      }
    })

    // 세션 토큰은 storage에서 직접 가져와야 함
    // 앱과 같은 도메인 쿠키를 익스텐션에서 직접 읽기 어려우므로
    // API Routes를 통해 저장
    const appUrl = settings.appUrl || 'http://localhost:3000'
    const payload = {
      url: pageData.url,
      title,
      description: pageData.description || null,
      thumbnail: currentThumbnail || null,
      site_name: pageData.site_name || null,
      favicon: pageData.favicon || null,
      price: document.getElementById('priceInput').value.trim() || null,
      category: document.getElementById('categorySelect').value,
      status: 'wish',
      memo: null,
    }

    const res = await fetch(`${appUrl}/api/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',  // 쿠키 포함 (로그인 세션)
      body: JSON.stringify(payload),
    })

    if (res.status === 409) {
      errEl.textContent = '이미 저장된 링크입니다.'
      errEl.style.display = 'block'
      btn.disabled = false
      btn.innerHTML = '<span>저장하기</span>'
      return
    }

    if (res.status === 401) {
      errEl.textContent = '로그인이 필요합니다. 앱에서 먼저 로그인해주세요.'
      errEl.style.display = 'block'
      btn.disabled = false
      btn.innerHTML = '<span>저장하기</span>'
      return
    }

    if (!res.ok) throw new Error('서버 오류')

    // 성공
    const saved = await res.json()
    document.getElementById('successMsg').textContent = `"${saved.title}" 가 저장되었습니다.`
    showScreen('successScreen')

  } catch (e) {
    errEl.textContent = e.message || '저장 중 오류가 발생했습니다.'
    errEl.style.display = 'block'
    btn.disabled = false
    btn.innerHTML = '<span>저장하기</span>'
  }
})
