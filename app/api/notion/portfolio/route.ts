import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import { readFileSync } from 'fs'
import { join } from 'path'

// 添加缓存配置：缓存 5 分钟
export const revalidate = 300

// 读取配置
function getConfig() {
  try {
    const configPath = join(process.cwd(), 'config', 'pages.json')
    const configData = readFileSync(configPath, 'utf-8')
    return JSON.parse(configData)
  } catch (error) {
    console.error('读取配置失败:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  const notionToken = process.env.NOTION_API_TOKEN

  if (!notionToken) {
    return NextResponse.json(
      { error: '未配置 Notion API Token' },
      { status: 500 }
    )
  }

  try {
    const config = getConfig()
    const databaseId = config?.databaseId

    if (!databaseId) {
      return NextResponse.json(
        { error: '未配置数据库 ID。请在 config/pages.json 中设置 databaseId' },
        { status: 400 }
      )
    }

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

    const cleanDatabaseId = databaseId.replace(/-/g, '')

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

    // 先尝试作为数据库访问
    let database: any
    let response: any

    try {
      // 尝试获取数据库信息（带重试）
      database = await retry(async () => {
        return await notion.databases.retrieve({
          database_id: cleanDatabaseId,
        })
      })

      // 查询数据库内容（带重试）
      response = await retry(async () => {
        return await notion.databases.query({
          database_id: cleanDatabaseId,
          page_size: 100,
        })
      })
    } catch (error: any) {
      // 如果不是数据库，尝试作为页面访问，查找页面中的数据库
      if (error.code === 'object_not_found' || error.code === 'validation_error') {
        try {
          const page = await retry(async () => {
            return await notion.pages.retrieve({
              page_id: cleanDatabaseId,
            })
          })

          // 获取页面中的子块，查找数据库（带重试）
          const blocks = await retry(async () => {
            return await notion.blocks.children.list({
              block_id: cleanDatabaseId,
              page_size: 100,
            })
          })

          // 查找 child_database 类型的块
          const databaseBlock = blocks.results.find((block: any) => block.type === 'child_database')
          
          if (databaseBlock) {
            // 使用找到的数据库（需要去掉连字符）
            const actualDatabaseId = databaseBlock.id.replace(/-/g, '')
            
            // 使用找到的数据库（带重试）
            database = await retry(async () => {
              return await notion.databases.retrieve({
                database_id: actualDatabaseId,
              })
            })

            response = await retry(async () => {
              return await notion.databases.query({
                database_id: actualDatabaseId,
                page_size: 100,
              })
            })
          } else {
            throw new Error('页面中未找到数据库。请确保页面包含数据库块。')
          }
        } catch (pageError: any) {
          throw new Error('无法访问数据库或页面。请确保 ID 正确且已连接到集成。')
        }
      } else {
        throw error
      }
    }

    // 处理结果，提取作品信息（需要异步获取封面，因此使用 Promise.all）
    const workResults = await Promise.all(
      response.results.map(async (page: any) => {
        try {
          const properties = page.properties || {}

        // 获取作品名称（Title 属性）
        const nameProperty = properties.Name || properties['作品名称'] || properties['Name']
        const name =
          nameProperty?.type === 'title'
            ? nameProperty.title.map((t: any) => t.plain_text).join('')
            : '未命名作品'

        // 获取页面 ID
        // 优先从 URL 属性中提取，也支持 Page ID 属性
        const urlProperty = properties['URL'] || properties['url'] || properties['Url']
        const pageIdProperty =
          properties['Page ID'] ||
          properties['页面ID'] ||
          properties['page_id'] ||
          properties['PageID'] ||
          properties['PageId']

        let pageId = null

        // 优先处理 URL 属性
        if (urlProperty && urlProperty.type === 'url' && urlProperty.url) {
          // 从 URL 中提取页面 ID
          const urlMatch = urlProperty.url.match(/-([a-f0-9]{32})(?:\?|$)/i)
          if (urlMatch) {
            pageId = urlMatch[1]
          }
        }

        // 如果没有从 URL 获取到，尝试从 Page ID 属性获取
        if (!pageId && pageIdProperty) {
          if (pageIdProperty.type === 'rich_text' && pageIdProperty.rich_text) {
            pageId = pageIdProperty.rich_text
              .map((t: any) => t.plain_text)
              .join('')
              .replace(/-/g, '')
          } else if (pageIdProperty.type === 'title' && pageIdProperty.title) {
            pageId = pageIdProperty.title
              .map((t: any) => t.plain_text)
              .join('')
              .replace(/-/g, '')
          }
        }

        // 如果还是没有找到，使用记录本身的 ID
        if (!pageId && page.id) {
          pageId = page.id.replace(/-/g, '')
        }

        // 获取封面图片（Files 属性）
        // 支持多种属性名：image, Image, Cover, 封面等
        const coverProperty =
          properties.image ||
          properties.Image ||
          properties.Cover ||
          properties['封面'] ||
          properties.cover ||
          properties['Cover Image']
        let coverImage = null
        if (coverProperty?.type === 'files' && coverProperty.files?.length > 0) {
          const file = coverProperty.files[0]
          coverImage = file.type === 'external' ? file.external.url : file.file?.url
        }

        // 如果没有封面，尝试使用页面的封面
        if (!coverImage && page.cover) {
          coverImage =
            page.cover.type === 'external' ? page.cover.external.url : page.cover.file?.url
        }

        // 优化：移除从页面内容获取封面的逻辑，减少 API 调用
        // 如果需要在首页显示封面，请在 Notion 数据库的属性中设置封面图片
        // 或者在前端处理占位符

        // 获取描述（Text 属性）
        const descProperty =
          properties.Description || properties['描述'] || properties['description']
        const description =
          descProperty?.type === 'rich_text' || descProperty?.type === 'text'
            ? (descProperty.rich_text || descProperty.text || [])
                .map((t: any) => t.plain_text)
                .join('')
            : ''

        // 获取分类（Select 属性）
        const categoryProperty =
          properties.Category || properties['分类'] || properties['category']
        const category =
          categoryProperty?.type === 'select' ? categoryProperty.select?.name : null

        // 获取日期（Date 属性）
        const dateProperty = properties.Date || properties['日期'] || properties['date']
        const date =
          dateProperty?.type === 'date' ? dateProperty.date?.start : null

        return {
          id: page.id,
          name,
          pageId,
          coverImage,
          description,
          category,
          date,
          url: pageId ? `/doc/${pageId}` : null,
        }
      } catch (itemError: any) {
        console.error('处理作品项时出错:', itemError.message)
        console.error('页面 ID:', page?.id)
        console.error('页面属性键:', Object.keys(page?.properties || {}))
        // 返回 null，后续会被过滤掉
        return null
      }
    })
    )

    const works = workResults.filter((work: any) => work !== null) // 过滤掉处理失败的项目
    
    // 调试信息：输出所有记录的属性
    if (response.results.length > 0 && works.length === 0) {
      console.log('调试：找到记录但没有作品，检查属性...')
      const firstPage = response.results[0]
      console.log('第一条记录的属性:', Object.keys(firstPage.properties || {}))
      console.log('第一条记录的完整属性:', JSON.stringify(firstPage.properties, null, 2))
    }
    
    // 只返回有 pageId 的作品
    const filteredWorks = works.filter((work: any) => work.pageId)
    
    if (response.results.length > 0 && filteredWorks.length === 0) {
      console.log('警告：数据库有记录但没有有效的 Page ID')
      console.log('所有作品:', works.map((w: any) => ({ name: w.name, pageId: w.pageId })))
    }
    
    return NextResponse.json({
      database: {
        title: database.title,
        id: database.id,
      },
      works: filteredWorks,
    }, {
      // 添加缓存头
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error: any) {
    console.error('获取作品集错误:', error)
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      name: error.name
    })
    
    if (error.code === 'object_not_found') {
      return NextResponse.json(
        { error: '数据库未找到。请确保数据库 ID 正确，且已通过 Notion API 共享' },
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
        error: error.message || '获取作品集时出错',
        code: error.code || 'UNKNOWN'
      },
      { status: 500 }
    )
  }
}

