import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

// 添加缓存配置：缓存 60 秒
export const revalidate = 60

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const pageId = searchParams.get('pageId')

  if (!pageId) {
    return NextResponse.json(
      { error: '缺少页面 ID' },
      { status: 400 }
    )
  }

  const notionToken = process.env.NOTION_API_TOKEN

  // 调试信息（仅开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log('NOTION_API_TOKEN exists:', !!notionToken)
    console.log('NOTION_API_TOKEN length:', notionToken?.length || 0)
  }

  if (!notionToken) {
    return NextResponse.json(
      { error: '未配置 Notion API Token。请在 .env.local 中设置 NOTION_API_TOKEN' },
      { status: 500 }
    )
  }

  try {
    // 配置 Notion 客户端，支持代理
    const notionConfig: any = {
      auth: notionToken,
    }

    // 如果设置了代理环境变量，使用代理
    const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy
    const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy
    
    if (httpsProxy || httpProxy) {
      try {
        const { HttpsProxyAgent } = require('https-proxy-agent')
        const proxyUrl = httpsProxy || httpProxy
        notionConfig.agent = new HttpsProxyAgent(proxyUrl)
        console.log('使用代理:', proxyUrl)
      } catch (proxyError: any) {
        console.error('代理配置失败:', proxyError?.message || proxyError)
      }
    } else {
      console.log('未配置代理，直接连接 Notion API')
    }

    const notion = new Client(notionConfig)

    // 重试函数，处理网络连接问题（优化：减少重试次数和延迟）
    const retry = async <T>(
      fn: () => Promise<T>,
      maxRetries: number = 2,
      delay: number = 500
    ): Promise<T> => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fn()
        } catch (error: any) {
          const isNetworkError = error.message?.includes('ECONNRESET') || 
                                 error.message?.includes('timeout') ||
                                 error.code === 'ECONNRESET' ||
                                 error.code === 'ETIMEDOUT'
          
          if (i === maxRetries - 1) throw error
          
          if (isNetworkError) {
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
            continue
          }
          throw error
        }
      }
      throw new Error('重试失败')
    }

    // 优化：并行获取页面和初始块
    const [page, blocksResponse] = await Promise.all([
      retry(async () => {
        return await notion.pages.retrieve({ page_id: pageId })
      }),
      retry(async () => {
        return await notion.blocks.children.list({
          block_id: pageId,
          page_size: 100,
        })
      })
    ])

    // 优化：并行获取所有子块（而不是串行）
    const allBlocks = await getAllBlocksParallel(notion, blocksResponse.results)

    return NextResponse.json({
      page,
      blocks: allBlocks,
    }, {
      // 添加缓存头
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error: any) {
    console.error('Notion API 错误:', error)
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      name: error.name
    })
    
    if (error.code === 'object_not_found') {
      return NextResponse.json(
        { error: '页面未找到。请确保页面 ID 正确，且已通过 Notion API 共享' },
        { status: 404 }
      )
    }

    // 网络连接错误
    if (error.code === 'ECONNRESET' || error.message?.includes('ECONNRESET')) {
      console.error('网络连接错误 (ECONNRESET):', error.message)
      return NextResponse.json(
        { 
          error: '网络连接失败。请检查网络或使用 VPN 后重试。',
          code: 'ECONNRESET'
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { 
        error: error.message || '获取 Notion 内容时出错',
        code: error.code || 'UNKNOWN'
      },
      { status: 500 }
    )
  }
}

// 并发控制：限制同时进行的请求数量
async function limitConcurrency<T>(
  tasks: (() => Promise<T>)[],
  maxConcurrency: number = 5
): Promise<T[]> {
  const results: T[] = new Array(tasks.length)
  const executing: Promise<void>[] = []
  let index = 0
  
  for (const task of tasks) {
    const currentIndex = index++
    const promise = task().then(result => {
      results[currentIndex] = result
      executing.splice(executing.indexOf(promise), 1)
    })
    
    executing.push(promise)
    
    if (executing.length >= maxConcurrency) {
      await Promise.race(executing)
    }
  }
  
  await Promise.all(executing)
  return results
}

// 优化：并行获取所有子块（带并发控制）
async function getAllBlocksParallel(
  notion: Client, 
  blocks: any[],
  maxConcurrency: number = 5
): Promise<any[]> {
  const allBlocks = [...blocks]
  
  const retry = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 2,
    delay: number = 500
  ): Promise<T> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (error: any) {
        const isNetworkError = error.message?.includes('ECONNRESET') || 
                               error.message?.includes('timeout') ||
                               error.code === 'ECONNRESET' ||
                               error.code === 'ETIMEDOUT'
        
        if (i === maxRetries - 1) throw error
        
        if (isNetworkError) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
          continue
        }
        throw error
      }
    }
    throw new Error('重试失败')
  }

  // 找出所有有子块的块
  const blocksWithChildren = blocks.filter(block => block.has_children)
  
  if (blocksWithChildren.length === 0) {
    return allBlocks
  }

  // 使用并发控制获取所有子块的第一层
  const childrenTasks = blocksWithChildren.map(block => () =>
    retry(async () => {
      return await notion.blocks.children.list({
        block_id: block.id,
        page_size: 100,
      })
    }).then(response => ({
      parentId: block.id,
      children: response.results
    }))
  )

  const childrenResults = await limitConcurrency(childrenTasks, maxConcurrency)
  
  // 递归处理子块（带并发控制）
  const nestedChildrenTasks = childrenResults.map(({ children }) => () =>
    getAllBlocksParallel(notion, children, maxConcurrency)
  )
  
  const nestedChildren = await limitConcurrency(nestedChildrenTasks, maxConcurrency)
  
  // 合并所有子块
  nestedChildren.forEach(children => {
    allBlocks.push(...children)
  })

  return allBlocks
}

