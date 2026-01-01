'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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

// 生成随机位置
const generateRandomPositions = (length: number) => {
  const positions = []
  const maxOffset = 400 // 最大偏移距离（像素）
  for (let i = 0; i < length; i++) {
    positions.push({
      x: (Math.random() - 0.5) * maxOffset * 2,
      y: (Math.random() - 0.5) * maxOffset * 2,
      rotation: (Math.random() - 0.5) * 90,
    })
  }
  return positions
}

export default function Home() {
  const router = useRouter()
  const [works, setWorks] = useState<Work[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [workPositions, setWorkPositions] = useState<Record<string, Array<{x: number, y: number, rotation: number}>>>({})

  useEffect(() => {
    fetchPortfolio()
  }, [])

  useEffect(() => {
    // 为每个作品生成随机位置
    if (works.length > 0) {
      const positions: Record<string, Array<{x: number, y: number, rotation: number}>> = {}
      works.forEach(work => {
        positions[work.id] = generateRandomPositions(work.name.length)
      })
      setWorkPositions(positions)
    }
  }, [works])

  const fetchPortfolio = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/notion/portfolio')
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
      setError(err.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  const handleWorkClick = (url: string | null) => {
    if (url) {
      router.push(url)
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

  // 将文本分解为字符，并添加随机位置
  const splitText = (text: string, randomPositions?: Array<{x: number, y: number, rotation: number}>) => {
    return text.split('').map((char, index) => {
      const position = randomPositions?.[index]
      const style = position ? {
        '--random-x': `${position.x}px`,
        '--random-y': `${position.y}px`,
        '--random-rotation': `${position.rotation}deg`,
      } as React.CSSProperties : {}
      
      return (
        <span key={index} className={styles.char} style={style}>
          {char === ' ' ? '\u00A0' : char}
        </span>
      )
    })
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>加载中...</p>
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
          <button onClick={fetchPortfolio} className={styles.retryButton}>
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.mainTitle}>
          HOME
        </h1>
        <div className={styles.worksList}>
          {works.length === 0 ? (
            <div className={styles.empty}>
              <p>暂无作品</p>
            </div>
          ) : (
            works.map((work) => (
              <div
                key={work.id}
                className={styles.workItem}
                onClick={() => handleWorkClick(work.url)}
              >
                <h2 className={styles.workTitle}>
                  {splitText(work.name, workPositions[work.id])}
                </h2>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
