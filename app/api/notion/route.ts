import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

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

    // 重试函数，处理网络连接问题
    const retry = async <T>(
      fn: () => Promise<T>,
      maxRetries: number = 3,
      delay: number = 1000
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

    // 获取页面内容（带重试）
    const page = await retry(async () => {
      return await notion.pages.retrieve({ page_id: pageId })
    })
    
    // 获取页面块内容（带重试）
    const blocks = await retry(async () => {
      return await notion.blocks.children.list({
        block_id: pageId,
        page_size: 100,
      })
    })

    // 递归获取所有子块（带重试）
    const allBlocks = await getAllBlocks(notion, blocks.results)

    return NextResponse.json({
      page,
      blocks: allBlocks,
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

async function getAllBlocks(notion: Client, blocks: any[]): Promise<any[]> {
  const allBlocks = [...blocks]

  // 重试函数
  const retry = async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
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

  for (const block of blocks) {
    if (block.has_children) {
      const children = await retry(async () => {
        return await notion.blocks.children.list({
          block_id: block.id,
          page_size: 100,
        })
      })
      const childBlocks = await getAllBlocks(notion, children.results)
      allBlocks.push(...childBlocks)
    }
  }

  return allBlocks
}

