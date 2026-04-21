import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function getDomain(url: string): string {
  try {
    const { hostname } = new URL(url)
    return hostname.replace('www.', '')
  } catch {
    return url
  }
}

export function getSiteLabel(url: string): string {
  const domain = getDomain(url)
  const map: Record<string, string> = {
    'smartstore.naver.com': '네이버 스마트스토어',
    'shopping.naver.com': '네이버쇼핑',
    'musinsa.com': '무신사',
    'coupang.com': '쿠팡',
    'gmarket.co.kr': 'G마켓',
    '11st.co.kr': '11번가',
    'auction.co.kr': '옥션',
    'ssg.com': 'SSG닷컴',
    'ohou.se': '오늘의집',
    'brandi.co.kr': '브랜디',
    '29cm.co.kr': '29CM',
    'zigzag.kr': '지그재그',
    'ably.co.kr': '에이블리',
  }
  for (const [key, label] of Object.entries(map)) {
    if (domain.includes(key)) return label
  }
  return domain
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}
