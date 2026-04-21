import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function getSiteLabel(hostname: string): string {
  const map: Record<string, string> = {
    'smartstore.naver.com': '네이버 스마트스토어',
    'brand.naver.com': '네이버 브랜드스토어',
    'shopping.naver.com': '네이버쇼핑',
    'musinsa.com': '무신사',
    'coupang.com': '쿠팡',
    'gmarket.co.kr': 'G마켓',
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

function getMeta(html: string, ...properties: string[]): string | null {
  for (const property of properties) {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"'<>]+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"'<>]+)["'][^>]+property=["']${property}["']`, 'i'),
      new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"'<>]+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"'<>]+)["'][^>]+name=["']${property}["']`, 'i'),
    ]
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1]) {
        const val = match[1].trim()
        if (val && !val.includes('에러') && !val.includes('오류') && !val.includes('Error')) {
          return val
        }
      }
    }
  }
  return null
}

function getTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const t = match?.[1]?.trim()
  if (!t) return null
  if (t.includes('에러') || t.includes('오류') || t.includes('Error') || t.includes('404') || t.includes('403')) return null
  return t
}

// 여러 서비스로 OG 데이터 조회 시도
async function tryLinkPreview(url: string) {
  try {
    const apiKey = process.env.LINK_PREVIEW_API_KEY
    if (!apiKey) return null

    const res = await fetch(
      `https://api.linkpreview.net/?key=${apiKey}&q=${encodeURIComponent(url)}`,
      {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      }
    )
    if (!res.ok) return null
    const data = await res.json()

    return {
      title: data.title || null,
      description: data.description || null,
      thumbnail: data.image || null,
    }
  } catch {
    return null
  }
}

async function tryDirectFetch(url: string) {
  const agents = [
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Twitterbot/1.0',
    'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  ]

  for (const ua of agents) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Referer': 'https://www.google.com/',
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(7000),
        redirect: 'follow',
      })
      if (!res.ok) continue
      const html = await res.text()

      // 차단된 페이지 감지
      if (
        html.includes('에러페이지') ||
        html.includes('시스템오류') ||
        html.includes('accessDenied') ||
        html.includes('challenge-platform') ||
        html.includes('cf-browser-verification') ||
        html.length < 500
      ) continue

      const title = getMeta(html, 'og:title', 'twitter:title') || getTitle(html)
      const thumbnail = getMeta(html, 'og:image', 'twitter:image')
      const description = getMeta(html, 'og:description', 'twitter:description', 'description')

      if (title || thumbnail) {
        return { title, description, thumbnail }
      }
    } catch {
      continue
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const hostname = parsedUrl.hostname
    const siteName = getSiteLabel(hostname)
    const favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`

    // 1순위: Microlink 무료 API (네이버/쿠팡도 처리)
    const microlink = await tryLinkPreview(url)

    // 2순위: 직접 HTML fetch
    const direct = (!microlink?.title && !microlink?.thumbnail)
      ? await tryDirectFetch(url)
      : null

    const title = microlink?.title || direct?.title || null
    const thumbnail = microlink?.thumbnail || direct?.thumbnail || null
    const description = microlink?.description || direct?.description || null

    const needsManualEdit = !title || !thumbnail

    return NextResponse.json({
      title: title || siteName + ' 상품',
      description,
      thumbnail,
      site_name: siteName,
      favicon,
      needsManualEdit,
    })
  } catch (err) {
    console.error('OG parse error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}