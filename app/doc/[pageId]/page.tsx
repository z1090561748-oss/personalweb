'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
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

  // 请求去重：防止 React Strict Mode 导致的重复请求
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // 取消之前的请求
    if (controllerRef.current) {
      controllerRef.current.abort()
    }

    const controller = new AbortController()
    controllerRef.current = controller

    fetchNotionContent(controller.signal)

    return () => {
      controller.abort()
    }
  }, [pageId])

  const fetchNotionContent = async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError('')

      // 使用 fetch 的 next 选项启用缓存
      const response = await fetch(`/api/notion?pageId=${pageId}`, {
        signal,
        next: { revalidate: 60 } // 缓存 60 秒
      })
      
      // 如果请求已被取消，直接返回
      if (signal?.aborted) {
        return
      }
      
      const result = await response.json()

      if (!response.ok) {
        let errorMsg = result.error || '获取内容失败'
        if (result.code === 'ECONNRESET') {
          errorMsg = '网络连接失败。请检查网络或使用 VPN 后重试。'
        }
        setError(errorMsg)
        setLoading(false)
        return
      }

      setData(result)
    } catch (err: any) {
      // 忽略 AbortError（请求被取消是正常的）
      if (err.name === 'AbortError' || signal?.aborted) {
        return
      }
      setError(err.message || '网络错误')
    } finally {
      // 只有在请求未被取消时才更新 loading 状态
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p>Loading...</p>
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
          <button onClick={fetchNotionContent} className={styles.retryButton}>
            重试
          </button>
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

