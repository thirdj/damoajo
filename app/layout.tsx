import type { Metadata, Viewport } from 'next'
import { StackProvider, StackTheme } from '@stackframe/stack'
import { stackServerApp } from '../stack'
import { Suspense } from 'react'
import './globals.css'

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'Damoajo - 링크 보관함',
  description: '링크를 한 곳에 모아두는 나만의 즐겨찾기',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Damoajo',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Damoajo" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <Suspense fallback={<LoadingSpinner />}>
          <StackProvider app={stackServerApp}>
            <StackTheme>
              <Suspense fallback={<LoadingSpinner />}>
                {children}
              </Suspense>
            </StackTheme>
          </StackProvider>
        </Suspense>
      </body>
    </html>
  )
}