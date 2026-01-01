'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  
  // 固定的 Notion 页面 ID
  const FIXED_PAGE_ID = '2d974318f7ec8063ab63ecd5a7ecddbe'

  useEffect(() => {
    // 直接跳转到固定的 Notion 页面
    router.push(`/doc/${FIXED_PAGE_ID}`)
  }, [router])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#000',
      color: '#fff'
    }}>
      <div style={{
        textAlign: 'center',
        fontSize: '1.2rem'
      }}>
        加载中...
      </div>
    </div>
  )
}

