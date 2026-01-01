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
    const notion = new Client({
      auth: notionToken,
    })

    // 获取页面内容
    const page = await notion.pages.retrieve({ page_id: pageId })
    
    // 获取页面块内容
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    })

    // 递归获取所有子块
    const allBlocks = await getAllBlocks(notion, blocks.results)

    return NextResponse.json({
      page,
      blocks: allBlocks,
    })
  } catch (error: any) {
    console.error('Notion API 错误:', error)
    
    if (error.code === 'object_not_found') {
      return NextResponse.json(
        { error: '页面未找到。请确保页面 ID 正确，且已通过 Notion API 共享' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || '获取 Notion 内容时出错' },
      { status: 500 }
    )
  }
}

async function getAllBlocks(notion: Client, blocks: any[]): Promise<any[]> {
  const allBlocks = [...blocks]

  for (const block of blocks) {
    if (block.has_children) {
      const children = await notion.blocks.children.list({
        block_id: block.id,
        page_size: 100,
      })
      const childBlocks = await getAllBlocks(notion, children.results)
      allBlocks.push(...childBlocks)
    }
  }

  return allBlocks
}

