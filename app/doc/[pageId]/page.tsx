'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { usePathname } from 'next/navigation'
import styles from './page.module.css'
import NotionRenderer from '@/components/NotionRenderer'

interface NotionPage {
  page: any
  blocks: any[]
}

export default function DocPage() {
  const params = useParams()
  const pageId = params.pageId as string
  const [data, setData] = useState<NotionPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchNotionContent()
  }, [pageId])

  const fetchNotionContent = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/notion?pageId=${pageId}`)
      const result = await response.json()

      if (!response.ok) {
        setError(result.error || '获取内容失败')
        setLoading(false)
        return
      }

      setData(result)
    } catch (err: any) {
      setError(err.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>正在加载文档内容...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>加载失败</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {data.page.properties?.title?.title?.[0]?.plain_text || 'HOVER WEB'}
        </h1>
      </div>
      <div className={styles.content}>
        <NotionRenderer blocks={data.blocks} />
      </div>
    </div>
  )
}

