// 각 사이트별 특화 파싱
function extractPageInfo() {
  const url = location.href
  const hostname = location.hostname

  let title = null
  let thumbnail = null
  let price = null
  let siteName = null

  // ── 네이버 스마트스토어 ──
  if (hostname.includes('smartstore.naver.com') || hostname.includes('brand.naver.com')) {
    siteName = '네이버 스마트스토어'

    // 제목
    title =
      document.querySelector('._2-I30Gj9jQ')?.textContent?.trim() ||
      document.querySelector('.product_title')?.textContent?.trim() ||
      document.querySelector('[class*="ProductName"]')?.textContent?.trim() ||
      document.querySelector('h2.product_name')?.textContent?.trim() ||
      getOgMeta('og:title')

    // 썸네일
    const mainImg =
      document.querySelector('._3OSFTnqY3L img') ||
      document.querySelector('.product_img img') ||
      document.querySelector('[class*="ProductImage"] img') ||
      document.querySelector('._2tyUI8iK93 img')

    thumbnail = mainImg?.src ||
      mainImg?.getAttribute('data-src') ||
      getOgMeta('og:image')

    // 가격
    const priceEl =
      document.querySelector('._1LY7DqCnwR') ||
      document.querySelector('[class*="price"] strong') ||
      document.querySelector('.price_area strong')

    price = priceEl?.textContent?.trim()?.replace(/[^0-9,]/g, '')
    if (price) price = price + '원'
  }

  // ── 쿠팡 ──
  else if (hostname.includes('coupang.com')) {
    siteName = '쿠팡'

    title =
      document.querySelector('h2.prod-buy-header__title')?.textContent?.trim() ||
      document.querySelector('.prod-title')?.textContent?.trim() ||
      getOgMeta('og:title')

    const mainImg =
      document.querySelector('#repImageContainer img') ||
      document.querySelector('.prod-image__detail img') ||
      document.querySelector('.prod-image img')

    thumbnail = mainImg?.src || getOgMeta('og:image')

    const priceEl =
      document.querySelector('.total-price strong') ||
      document.querySelector('.prod-price .total-price')

    price = priceEl?.textContent?.trim()?.replace(/[^0-9,]/g, '')
    if (price) price = price + '원'
  }

  // ── 무신사 ──
  else if (hostname.includes('musinsa.com')) {
    siteName = '무신사'

    title =
      document.querySelector('.product_title')?.textContent?.trim() ||
      document.querySelector('h2.product-detail__name')?.textContent?.trim() ||
      getOgMeta('og:title')

    thumbnail =
      document.querySelector('.product-detail__slider img')?.src ||
      document.querySelector('#detail_main_thumbnail_wrapper img')?.src ||
      getOgMeta('og:image')

    const priceEl = document.querySelector('.price')
    price = priceEl?.textContent?.trim()?.replace(/[^0-9,]/g, '')
    if (price) price = price + '원'
  }

  // ── 인스타그램 ──
  else if (hostname.includes('instagram.com')) {
    siteName = '인스타그램'

    title = getOgMeta('og:title') ||
      document.querySelector('title')?.textContent?.trim()

    thumbnail =
      document.querySelector('article img')?.src ||
      document.querySelector('._aagt img')?.src ||
      getOgMeta('og:image')
  }

  // ── 오늘의집 ──
  else if (hostname.includes('ohou.se')) {
    siteName = '오늘의집'

    title =
      document.querySelector('.product-detail-info__name')?.textContent?.trim() ||
      getOgMeta('og:title')

    thumbnail =
      document.querySelector('.product-detail-carousel img')?.src ||
      getOgMeta('og:image')

    const priceEl = document.querySelector('.product-detail-price__sale')
    price = priceEl?.textContent?.trim()?.replace(/[^0-9,]/g, '')
    if (price) price = price + '원'
  }

  // ── 29CM ──
  else if (hostname.includes('29cm.co.kr')) {
    siteName = '29CM'
    title = getOgMeta('og:title')
    thumbnail = getOgMeta('og:image') ||
      document.querySelector('.detail-image img')?.src
    const priceEl = document.querySelector('[class*="price"]')
    price = priceEl?.textContent?.trim()?.replace(/[^0-9,]/g, '')
    if (price) price = price + '원'
  }

  // ── G마켓 ──
  else if (hostname.includes('gmarket.co.kr') || hostname.includes('auction.co.kr')) {
    siteName = hostname.includes('gmarket') ? 'G마켓' : '옥션'
    title = document.querySelector('.itemtit')?.textContent?.trim() || getOgMeta('og:title')
    thumbnail = document.querySelector('#mainImage img')?.src || getOgMeta('og:image')
    const priceEl = document.querySelector('.price-real')
    price = priceEl?.textContent?.trim()?.replace(/[^0-9,]/g, '')
    if (price) price = price + '원'
  }

  // ── 11번가 ──
  else if (hostname.includes('11st.co.kr')) {
    siteName = '11번가'
    title = document.querySelector('.prd_name')?.textContent?.trim() || getOgMeta('og:title')
    thumbnail = document.querySelector('#mainPrdImg')?.src || getOgMeta('og:image')
    const priceEl = document.querySelector('.price_area .sale')
    price = priceEl?.textContent?.trim()?.replace(/[^0-9,]/g, '')
    if (price) price = price + '원'
  }

  // ── 에이블리 ──
  else if (hostname.includes('ably.co.kr')) {
    siteName = '에이블리'
    title = getOgMeta('og:title')
    thumbnail = getOgMeta('og:image')
  }

  // ── 지그재그 ──
  else if (hostname.includes('zigzag.kr')) {
    siteName = '지그재그'
    title = getOgMeta('og:title')
    thumbnail = getOgMeta('og:image')
  }

  // ── 기본 (OG 태그) ──
  else {
    siteName = getSiteLabel(hostname)
    title = getOgMeta('og:title') || document.title
    thumbnail = getOgMeta('og:image')
  }

  // 썸네일 URL 정리 (//로 시작하는 경우 https: 추가)
  if (thumbnail?.startsWith('//')) {
    thumbnail = 'https:' + thumbnail
  }

  // 제목 정리
  if (!title || title.includes('에러') || title.includes('오류')) {
    title = document.title || siteName + ' 상품'
  }

  return {
    url,
    title: title?.trim() || siteName + ' 상품',
    thumbnail: thumbnail || null,
    price: price || null,
    site_name: siteName,
    favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
    description: getOgMeta('og:description') || null,
  }
}

function getOgMeta(...properties) {
  for (const property of properties) {
    const selectors = [
      `meta[property="${property}"]`,
      `meta[name="${property}"]`,
    ]
    for (const selector of selectors) {
      const content = document.querySelector(selector)?.getAttribute('content')
      if (content?.trim()) return content.trim()
    }
  }
  return null
}

function getSiteLabel(hostname) {
  const map = {
    'smartstore.naver.com': '네이버 스마트스토어',
    'brand.naver.com': '네이버 브랜드스토어',
    'shopping.naver.com': '네이버쇼핑',
    'musinsa.com': '무신사',
    'coupang.com': '쿠팡',
    'gmarket.co.kr': 'G마켓',
    'auction.co.kr': '옥션',
    '11st.co.kr': '11번가',
    'ssg.com': 'SSG닷컴',
    'ohou.se': '오늘의집',
    '29cm.co.kr': '29CM',
    'zigzag.kr': '지그재그',
    'instagram.com': '인스타그램',
    'ably.co.kr': '에이블리',
    'brandi.co.kr': '브랜디',
  }
  for (const [key, label] of Object.entries(map)) {
    if (hostname.includes(key)) return label
  }
  return hostname.replace('www.', '')
}

// popup에서 메시지 받아서 페이지 정보 추출 후 응답
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PAGE_INFO') {
    try {
      const info = extractPageInfo()
      sendResponse({ success: true, data: info })
    } catch (e) {
      sendResponse({ success: false, error: e.message })
    }
  }
  return true
})
