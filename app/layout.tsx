import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'HOVER WEB - 新媒体艺术风格内容展示',
    template: '%s | HOVER WEB'
  },
  description: 'HOVER WEB - 实时展示 Notion 文档内容，采用黑色背景新媒体艺术风格设计，提供现代化的阅读体验',
  keywords: ['HOVER WEB', 'Notion', '内容展示', '新媒体艺术', '文档查看器'],
  authors: [{ name: 'HOVER WEB' }],
  creator: 'HOVER WEB',
  publisher: 'HOVER WEB',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: '/',
    siteName: 'HOVER WEB',
    title: 'HOVER WEB - 新媒体艺术风格内容展示',
    description: '实时展示 Notion 文档内容，采用黑色背景新媒体艺术风格设计',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'HOVER WEB',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HOVER WEB - 新媒体艺术风格内容展示',
    description: '实时展示 Notion 文档内容，采用黑色背景新媒体艺术风格设计',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // 可以添加 Google Search Console 验证码
    // google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

