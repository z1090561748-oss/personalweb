import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const databaseId = searchParams.get('databaseId')

  if (!databaseId) {
    return NextResponse.json(
      { error: '缺少数据库 ID' },
      { status: 400 }
    )
  }

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

    // 获取数据库信息
    const database = await notion.databases.retrieve({
      database_id: databaseId,
    })

    // 查询数据库内容
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 100,
    })

    return NextResponse.json({
      database,
      results: response.results,
      has_more: response.has_more,
      next_cursor: response.next_cursor,
    })
  } catch (error: any) {
    console.error('Notion Database API 错误:', error)
    
    if (error.code === 'object_not_found') {
      return NextResponse.json(
        { error: '数据库未找到。请确保数据库 ID 正确，且已通过 Notion API 共享' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || '获取数据库内容时出错' },
      { status: 500 }
    )
  }
}

