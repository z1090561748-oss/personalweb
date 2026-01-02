import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'
import { readFileSync } from 'fs'
import { join } from 'path'

// 读取页面配置
function getPagesConfig() {
  try {
    const configPath = join(process.cwd(), 'config', 'pages.json')
    const configData = readFileSync(configPath, 'utf-8')
    return JSON.parse(configData)
  } catch (error) {
    console.error('读取页面配置失败:', error)
    // 返回默认配置
    return [
      {
        id: '2d974318f7ec8063ab63ecd5a7ecddbe',
        title: 'HOVER web',
        description: '新媒体艺术项目',
      },
    ]
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
    const notion = new Client({
      auth: notionToken,
    })

    const pagesConfig = getPagesConfig()

    // 并行获取所有页面的信息
    const pages = await Promise.all(
      pagesConfig.map(async (config: any) => {
        try {
          const page = await notion.pages.retrieve({
            page_id: config.id.replace(/-/g, ''),
          })

          // 提取标题
          const titleProperty = (page as any).properties?.title
          let title = config.title

          if (titleProperty?.type === 'title' && titleProperty.title) {
            title = titleProperty.title
              .map((t: any) => t.plain_text)
              .join('') || config.title
          }

          return {
            id: config.id,
            title,
            description: config.description || '',
            url: `/doc/${config.id}`,
            lastEdited: (page as any).last_edited_time || null,
          }
        } catch (error: any) {
          console.error(`获取页面 ${config.id} 失败:`, error)
          return {
            id: config.id,
            title: config.title,
            description: config.description || '',
            url: `/doc/${config.id}`,
            error: '获取失败',
          }
        }
      })
    )

    return NextResponse.json({
      pages: pages.filter((p: any) => !p.error), // 过滤掉失败的页面
    })
  } catch (error: any) {
    console.error('获取页面列表错误:', error)
    return NextResponse.json(
      { error: error.message || '获取页面列表时出错' },
      { status: 500 }
    )
  }
}
