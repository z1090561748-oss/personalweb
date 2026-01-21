'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import NotionRenderer from '@/components/NotionRenderer'
import styles from './page.module.css'

interface Work {
  id: string
  name: string
  pageId: string
  coverImage: string | null
  description: string
  category: string | null
  date: string | null
  url: string | null
}

// 首页个人介绍所使用的 Notion 页面 ID
// 对应 Notion 页面：https://www.notion.so/Home-2db74318f7ec801eb72ee716ec4692ab
// 这里使用去掉短横线后的 32 位 ID
const HOME_INTRO_PAGE_ID = '2db74318f7ec801eb72ee716ec4692ab'

export default function Home() {
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // 首页个人介绍 blocks
  const [introBlocks, setIntroBlocks] = useState<any[] | null>(null)
  const [introError, setIntroError] = useState('')

  // 请求去重：防止 React Strict Mode 导致的重复请求
  const portfolioControllerRef = useRef<AbortController | null>(null)
  const introControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // 取消之前的请求
    if (portfolioControllerRef.current) {
      portfolioControllerRef.current.abort()
    }
    if (introControllerRef.current) {
      introControllerRef.current.abort()
    }

    const portfolioController = new AbortController()
    const introController = new AbortController()
    portfolioControllerRef.current = portfolioController
    introControllerRef.current = introController

    fetchPortfolio(portfolioController.signal)
    fetchHomeIntro(introController.signal)

    return () => {
      portfolioController.abort()
      introController.abort()
    }
  }, [])

  // 不再为作品标题生成字符级随机位置，保留简单的文字链接样式

  const fetchPortfolio = async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/notion/portfolio', {
        signal,
        next: { revalidate: 300 } // 缓存 5 分钟
      })
      
      // 如果请求已被取消，直接返回
      if (signal?.aborted) {
        return
      }
      
      const result = await response.json()

      if (!response.ok) {
        let errorMsg = result.error || '获取作品集失败'
        if (result.code === 'ECONNRESET') {
          errorMsg = '网络连接失败。请检查网络或使用 VPN 后重试。'
        }
        setError(errorMsg)
        setLoading(false)
        return
      }

      setWorks(result.works || [])
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

  // 获取首页个人介绍内容
  const fetchHomeIntro = async (signal?: AbortSignal) => {
    try {
      setIntroError('')

      const response = await fetch(`/api/notion?pageId=${HOME_INTRO_PAGE_ID}`, {
        signal,
        next: { revalidate: 60 } // 缓存 60 秒
      })
      
      // 如果请求已被取消，直接返回
      if (signal?.aborted) {
        return
      }
      
      const result = await response.json()

      if (!response.ok) {
        let errorMsg = result.error || '获取个人介绍失败'
        if (result.code === 'ECONNRESET') {
          errorMsg = '网络连接失败。请检查网络或使用 VPN 后重试。'
        }
        setIntroError(errorMsg)
        return
      }

      setIntroBlocks(result.blocks || [])
    } catch (err: any) {
      // 忽略 AbortError（请求被取消是正常的）
      if (err.name === 'AbortError' || signal?.aborted) {
        return
      }
      setIntroError(err.message || '获取个人介绍失败')
    }
  }


  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 顶部 Hero */}
        <section className={styles.hero}>
          <p className={styles.heroKicker}>UNFOLDING THE EXTRAORDINARY IN NEW MEDIA ART</p>
          <p className={styles.heroRole}>New Media Artist</p>
          <h1 className={styles.heroName}>ZHAO BOXIONG</h1>
        </section>

        {/* ABOUT 区块：来自 Notion Home 页 */}
        {introBlocks && !introError && (
          <section className={styles.aboutSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>ABOUT</h2>
              <p className={styles.sectionSubtitle}>个人介绍 · 获奖经历 · 参展与项目</p>
            </div>
            <div className={styles.aboutContent}>
              <NotionRenderer blocks={introBlocks} />
            </div>
          </section>
        )}

        {/* 如果个人介绍加载失败，给一个简短提示，但不阻塞作品列表 */}
        {introError && (
          <div className={styles.introError}>
            <span>{introError}</span>
          </div>
        )}

        {/* PROJECTS / 作品列表 */}
        <section className={styles.projectsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>PROJECTS</h2>
            <p className={styles.sectionSubtitle}>精选作品集</p>
          </div>

          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <p>Loading...</p>
            </div>
          ) : error ? (
            <div className={styles.errorCard}>
              <h2>加载失败</h2>
              <p>{error}</p>
              <button 
                onClick={() => {
                  // 创建新的 controller 用于重试
                  if (portfolioControllerRef.current) {
                    portfolioControllerRef.current.abort()
                  }
                  const controller = new AbortController()
                  portfolioControllerRef.current = controller
                  fetchPortfolio(controller.signal)
                }} 
                className={styles.retryButton}
              >
                重试
              </button>
            </div>
              ) : (
                <div className={styles.worksList}>
                  {works.length === 0 ? (
                    <div className={styles.empty}>
                      <p>暂无作品</p>
                    </div>
                  ) : (
                    works.map((work) => (
                      <Link
                        key={work.id}
                        href={work.url || '#'}
                        className={styles.workItem}
                        prefetch={true}
                      >
                        <h2 className={styles.workTitle}>{work.name}</h2>
                      </Link>
                    ))
                  )}
                </div>
              )}
        </section>
      </div>
    </div>
  )
}
