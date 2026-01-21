'use client'

import React, { useState, useEffect } from 'react'
import styles from './NotionRenderer.module.css'

interface NotionRendererProps {
  blocks: any[]
}

export default function NotionRenderer({ blocks }: NotionRendererProps) {
  const renderBlock = (block: any) => {
    const { type, id } = block
    const value = block[type]

    switch (type) {
      case 'paragraph':
        return (
          <p key={id} className={styles.paragraph}>
            {value.rich_text?.map((text: any, index: number) => (
              <span
                key={index}
                style={{
                  fontWeight: text.annotations.bold ? 'bold' : 'normal',
                  fontStyle: text.annotations.italic ? 'italic' : 'normal',
                  textDecoration: text.annotations.underline
                    ? 'underline'
                    : 'none',
                  color: text.annotations.color !== 'default' ? text.annotations.color : undefined,
                }}
              >
                {text.plain_text}
              </span>
            ))}
          </p>
        )

      case 'heading_1':
        return (
          <h1 key={id} className={styles.heading1}>
            {value.rich_text?.map((text: any, index: number) => (
              <span key={index}>{text.plain_text}</span>
            ))}
          </h1>
        )

      case 'heading_2':
        return (
          <h2 key={id} className={styles.heading2}>
            {value.rich_text?.map((text: any, index: number) => (
              <span key={index}>{text.plain_text}</span>
            ))}
          </h2>
        )

      case 'heading_3':
        return (
          <h3 key={id} className={styles.heading3}>
            {value.rich_text?.map((text: any, index: number) => (
              <span key={index}>{text.plain_text}</span>
            ))}
          </h3>
        )

      case 'bulleted_list_item':
        return (
          <li key={id} className={styles.listItem}>
            {value.rich_text?.map((text: any, index: number) => (
              <span key={index}>{text.plain_text}</span>
            ))}
          </li>
        )

      case 'numbered_list_item':
        return (
          <li key={id} className={styles.listItem}>
            {value.rich_text?.map((text: any, index: number) => (
              <span key={index}>{text.plain_text}</span>
            ))}
          </li>
        )

      case 'to_do':
        return (
          <div key={id} className={styles.todo}>
            <input
              type="checkbox"
              checked={value.checked}
              readOnly
              className={styles.checkbox}
            />
            <span className={value.checked ? styles.checked : ''}>
              {value.rich_text?.map((text: any, index: number) => (
                <span key={index}>{text.plain_text}</span>
              ))}
            </span>
          </div>
        )

      case 'toggle':
        return (
          <details key={id} className={styles.toggle}>
            <summary className={styles.toggleSummary}>
              {value.rich_text?.map((text: any, index: number) => (
                <span key={index}>{text.plain_text}</span>
              ))}
            </summary>
            <div className={styles.toggleContent}>
              {/* 子内容会在后续处理 */}
            </div>
          </details>
        )

      case 'code':
        return (
          <pre key={id} className={styles.codeBlock}>
            <code className={styles.code}>
              {value.rich_text?.map((text: any, index: number) => (
                <span key={index}>{text.plain_text}</span>
              ))}
            </code>
          </pre>
        )

      case 'quote':
        return (
          <blockquote key={id} className={styles.quote}>
            {value.rich_text?.map((text: any, index: number) => (
              <span key={index}>{text.plain_text}</span>
            ))}
          </blockquote>
        )

      case 'callout':
        return (
          <div key={id} className={styles.callout}>
            <span className={styles.calloutIcon}>{value.icon?.emoji || '💡'}</span>
            <div className={styles.calloutContent}>
              {value.rich_text?.map((text: any, index: number) => (
                <span key={index}>{text.plain_text}</span>
              ))}
            </div>
          </div>
        )

      case 'divider':
        return <hr key={id} className={styles.divider} />

      case 'image':
        const imageUrl = value.type === 'external' 
          ? value.external.url 
          : value.file?.url
        return (
          <img
            key={id}
            src={imageUrl}
            alt={value.caption?.[0]?.plain_text || 'Image'}
            className={styles.image}
          />
        )

      case 'bookmark':
        return (
          <a
            key={id}
            href={value.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.bookmark}
          >
            <div className={styles.bookmarkContent}>
              <div className={styles.bookmarkTitle}>
                {value.caption?.[0]?.plain_text || value.url}
              </div>
              <div className={styles.bookmarkUrl}>{value.url}</div>
            </div>
          </a>
        )

      // 数据库块：当前站点不渲染数据库视图，避免在前端出现
      // “NEW DATABASE / ECONNRESET” 这类网络错误提示
      case 'child_database':
        return null

      case 'video':
        const videoUrl = value.type === 'external' 
          ? value.external.url 
          : value.file?.url
        return (
          <div key={id} className={styles.video}>
            <video
              src={videoUrl}
              controls
              className={styles.videoElement}
            >
              您的浏览器不支持视频播放
            </video>
            {value.caption?.length > 0 && (
              <p className={styles.caption}>
                {value.caption.map((cap: any, idx: number) => cap.plain_text).join('')}
              </p>
            )}
          </div>
        )

      case 'file':
        const fileUrl = value.type === 'external' 
          ? value.external.url 
          : value.file?.url
        const fileName = value.name || value.caption?.[0]?.plain_text || '文件'
        return (
          <div key={id} className={styles.file}>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.fileLink}
            >
              <span className={styles.fileIcon}>📎</span>
              <span>{fileName}</span>
            </a>
          </div>
        )

      case 'pdf':
        const pdfUrl = value.type === 'external' 
          ? value.external.url 
          : value.file?.url
        return (
          <div key={id} className={styles.pdf}>
            <iframe
              src={pdfUrl}
              className={styles.pdfFrame}
              title="PDF 文档"
            />
          </div>
        )

      case 'audio':
        const audioUrl = value.type === 'external' 
          ? value.external.url 
          : value.file?.url
        return (
          <div key={id} className={styles.audio}>
            <audio controls className={styles.audioElement}>
              <source src={audioUrl} />
              您的浏览器不支持音频播放
            </audio>
            {value.caption?.length > 0 && (
              <p className={styles.caption}>
                {value.caption.map((cap: any, idx: number) => cap.plain_text).join('')}
              </p>
            )}
          </div>
        )

      case 'embed':
        return (
          <div key={id} className={styles.embed}>
            <iframe
              src={value.url}
              className={styles.embedFrame}
              title="嵌入内容"
            />
            {value.caption?.length > 0 && (
              <p className={styles.caption}>
                {value.caption.map((cap: any, idx: number) => cap.plain_text).join('')}
              </p>
            )}
          </div>
        )

      case 'equation':
        return (
          <div key={id} className={styles.equation}>
            <code className={styles.equationCode}>{value.expression}</code>
          </div>
        )

      case 'table':
        // 表格内容通过子块（table_row）处理
        return null // 不直接渲染，由 processBlocks 处理

      case 'table_row':
        const cells = value.cells || []
        return (
          <tr key={id} className={styles.tableRow}>
            {cells.map((cell: any[], cellIndex: number) => (
              <td key={cellIndex} className={styles.tableCell}>
                {cell?.map((text: any, textIndex: number) => text.plain_text).join('') || ''}
              </td>
            ))}
          </tr>
        )

      case 'column_list':
        // 列布局内容通过子块（column）处理
        return null // 不直接渲染，由 processBlocks 处理

      case 'column':
        // 列内容通过子块处理
        return null // 不直接渲染，由 processBlocks 处理

      case 'link_to_page':
        const pageId = value.page_id?.replace(/-/g, '')
        return (
          <div key={id} className={styles.linkToPage}>
            <a
              href={`/doc/${pageId}`}
              className={styles.linkToPageLink}
            >
              <span className={styles.linkToPageIcon}>🔗</span>
              <span>链接到页面</span>
            </a>
          </div>
        )

      case 'synced_block':
        return (
          <div key={id} className={styles.syncedBlock}>
            <div className={styles.syncedBlockLabel}>同步块</div>
            {/* 同步内容会在子块中处理 */}
          </div>
        )

      case 'template':
        return (
          <div key={id} className={styles.template}>
            <div className={styles.templateLabel}>模板</div>
            {value.rich_text?.map((text: any, index: number) => (
              <span key={index}>{text.plain_text}</span>
            ))}
          </div>
        )

      case 'table_of_contents':
        return (
          <div key={id} className={styles.tableOfContents}>
            <div className={styles.tableOfContentsLabel}>目录</div>
            <p className={styles.tableOfContentsNote}>目录功能正在开发中</p>
          </div>
        )

      default:
        return (
          <div key={id} className={styles.unsupported}>
            <p>不支持的内容类型: {type}</p>
            <details style={{ marginTop: '10px', fontSize: '0.9rem', opacity: 0.7 }}>
              <summary style={{ cursor: 'pointer' }}>查看详情</summary>
              <pre style={{ marginTop: '10px', fontSize: '0.8rem', overflow: 'auto' }}>
                {JSON.stringify(block, null, 2)}
              </pre>
            </details>
          </div>
        )
    }
  }

  // 处理列表项分组、表格、列布局
  const processedBlocks = processBlocks(blocks)

  // 检查是否有"参展经历"（或"获奖经历"）和"项目经历"需要并排显示
  const exhibitionsIndex = processedBlocks.findIndex((item) => {
    if (item.type === 'block' && item.block) {
      const block = item.block
      if (block.type === 'heading_2' || block.type === 'heading_3') {
        const text = block[block.type]?.rich_text?.map((t: any) => t.plain_text).join('') || ''
        return text.includes('参展经历') || text.includes('获奖经历') || text.includes('获奖') || text.includes('参展')
      }
    }
    return false
  })

  const projectsIndex = processedBlocks.findIndex((item) => {
    if (item.type === 'block' && item.block) {
      const block = item.block
      if (block.type === 'heading_2' || block.type === 'heading_3') {
        const text = block[block.type]?.rich_text?.map((t: any) => t.plain_text).join('') || ''
        return text.includes('项目经历') || text.includes('项目')
      }
    }
    return false
  })

  // 如果找到了两个部分，将它们组织成两列布局
  if (exhibitionsIndex !== -1 && projectsIndex !== -1 && exhibitionsIndex < projectsIndex) {
    const beforeExhibitions = processedBlocks.slice(0, exhibitionsIndex)
    // 参展经历部分：从参展经历标题到项目经历标题之前的所有内容
    const exhibitionsSection = processedBlocks.slice(exhibitionsIndex, projectsIndex)
    // 项目经历部分：从项目经历标题开始，找到下一个标题或结束
    let projectsEndIndex = processedBlocks.length // 默认到结尾
    for (let i = projectsIndex + 1; i < processedBlocks.length; i++) {
      const item = processedBlocks[i]
      if (item.type === 'block' && item.block) {
        const block = item.block
        if (block.type === 'heading_1' || block.type === 'heading_2' || block.type === 'heading_3') {
          const text = block[block.type]?.rich_text?.map((t: any) => t.plain_text).join('') || ''
          // 如果遇到新的标题（不是项目经历），停止收集
          if (!text.includes('项目经历') && !text.includes('项目')) {
            projectsEndIndex = i
            break
          }
        }
      }
    }
    const projectsSection = processedBlocks.slice(projectsIndex, projectsEndIndex)
    const afterProjects = processedBlocks.slice(projectsEndIndex)

    return (
      <div className={styles.container}>
        {beforeExhibitions.map((item, index) => {
          if (item.type === 'list') {
            const isNumbered = item.blocks[0]?.type === 'numbered_list_item'
            const ListTag = isNumbered ? 'ol' : 'ul'
            return (
              <ListTag key={`list-${index}`} className={styles.list}>
                {item.blocks.map(renderBlock)}
              </ListTag>
            )
          }
          if (item.type === 'table') {
            return (
              <div key={`table-${index}`} className={styles.tableWrapper}>
                <table className={styles.table}>
                  <tbody>
                    {item.rows.map(renderBlock)}
                  </tbody>
                </table>
              </div>
            )
          }
          return renderBlock(item.block)
        })}
        
        {/* 两列布局：参展经历和项目经历 */}
        <div className={styles.twoColumnLayout}>
          <div className={styles.column}>
            {exhibitionsSection.map((item, index) => {
              if (item.type === 'list') {
                const isNumbered = item.blocks[0]?.type === 'numbered_list_item'
                const ListTag = isNumbered ? 'ol' : 'ul'
                return (
                  <ListTag key={`exhibitions-list-${index}`} className={styles.list}>
                    {item.blocks.map(renderBlock)}
                  </ListTag>
                )
              }
              if (item.type === 'table') {
                return (
                  <div key={`exhibitions-table-${index}`} className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <tbody>
                        {item.rows.map(renderBlock)}
                      </tbody>
                    </table>
                  </div>
                )
              }
              return renderBlock(item.block)
            })}
          </div>
          <div className={styles.column}>
            {projectsSection.map((item, index) => {
              if (item.type === 'list') {
                const isNumbered = item.blocks[0]?.type === 'numbered_list_item'
                const ListTag = isNumbered ? 'ol' : 'ul'
                return (
                  <ListTag key={`projects-list-${index}`} className={`${styles.list} ${styles.projectsList}`}>
                    {item.blocks.map(renderBlock)}
                  </ListTag>
                )
              }
              if (item.type === 'table') {
                return (
                  <div key={`projects-table-${index}`} className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <tbody>
                        {item.rows.map(renderBlock)}
                      </tbody>
                    </table>
                  </div>
                )
              }
              return renderBlock(item.block)
            })}
          </div>
        </div>

        {afterProjects.map((item, index) => {
          if (item.type === 'list') {
            const isNumbered = item.blocks[0]?.type === 'numbered_list_item'
            const ListTag = isNumbered ? 'ol' : 'ul'
            return (
              <ListTag key={`list-${index}`} className={styles.list}>
                {item.blocks.map(renderBlock)}
              </ListTag>
            )
          }
          if (item.type === 'table') {
            return (
              <div key={`table-${index}`} className={styles.tableWrapper}>
                <table className={styles.table}>
                  <tbody>
                    {item.rows.map(renderBlock)}
                  </tbody>
                </table>
              </div>
            )
          }
          return renderBlock(item.block)
        })}
      </div>
    )
  }

  // 如果没有找到两个部分，使用原来的渲染方式
  return (
    <div className={styles.container}>
      {processedBlocks.map((item, index) => {
        if (item.type === 'list') {
          const isNumbered = item.blocks[0]?.type === 'numbered_list_item'
          const ListTag = isNumbered ? 'ol' : 'ul'
          return (
            <ListTag key={`list-${index}`} className={styles.list}>
              {item.blocks.map(renderBlock)}
            </ListTag>
          )
        }
        if (item.type === 'table') {
          return (
            <div key={`table-${index}`} className={styles.tableWrapper}>
              <table className={styles.table}>
                <tbody>
                  {item.rows.map(renderBlock)}
                </tbody>
              </table>
            </div>
          )
        }
        return renderBlock(item.block)
      })}
    </div>
  )
}

function processBlocks(blocks: any[]): any[] {
  const result: any[] = []
  let currentList: any[] = []
  let currentTable: any = null
  let currentTableRows: any[] = []

  blocks.forEach((block) => {
    // 跳过不直接渲染的块（列布局由子块处理）
    if (block.type === 'column_list' || block.type === 'column') {
      return
    }

    // 处理列表
    if (
      block.type === 'bulleted_list_item' ||
      block.type === 'numbered_list_item'
    ) {
      currentList.push(block)
      return
    }

    // 处理表格
    if (block.type === 'table') {
      // 如果之前有表格，先保存
      if (currentTable && currentTableRows.length > 0) {
        result.push({ type: 'table', block: currentTable, rows: currentTableRows })
      }
      currentTable = block
      currentTableRows = []
      return
    }

    if (block.type === 'table_row') {
      if (currentTable) {
        currentTableRows.push(block)
      } else {
        // 如果没有 table 父块，直接渲染行
        result.push({ type: 'block', block })
      }
      return
    }

    // 处理其他块
    if (currentList.length > 0) {
      result.push({ type: 'list', blocks: currentList })
      currentList = []
    }

    if (currentTable && currentTableRows.length > 0) {
      result.push({ type: 'table', block: currentTable, rows: currentTableRows })
      currentTable = null
      currentTableRows = []
    }

    result.push({ type: 'block', block })
  })

  // 处理末尾的列表、表格
  if (currentList.length > 0) {
    result.push({ type: 'list', blocks: currentList })
  }
  if (currentTable && currentTableRows.length > 0) {
    result.push({ type: 'table', block: currentTable, rows: currentTableRows })
  }

  return result
}

// 数据库视图组件
function DatabaseView({ databaseId, title }: { databaseId: string; title: any }) {
  const [database, setDatabase] = useState<any>(null)
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const dbTitle = Array.isArray(title) 
    ? title[0]?.plain_text || '数据库'
    : title || '数据库'

  useEffect(() => {
    fetchDatabase()
  }, [databaseId])

  const fetchDatabase = async () => {
    try {
      setLoading(true)
      setError('')
      
      const cleanId = databaseId.replace(/-/g, '')
      const response = await fetch(`/api/notion/database?databaseId=${cleanId}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '加载数据库失败')
        setLoading(false)
        return
      }

      setDatabase(data.database)
      setRows(data.results || [])
    } catch (err: any) {
      setError(err.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  const formatPropertyValue = (property: any): string => {
    if (!property) return ''

    const type = property.type

    switch (type) {
      case 'title':
        return property.title?.map((t: any) => t.plain_text).join('') || ''
      case 'rich_text':
        return property.rich_text?.map((t: any) => t.plain_text).join('') || ''
      case 'number':
        return property.number?.toString() || ''
      case 'select':
        return property.select?.name || ''
      case 'multi_select':
        return property.multi_select?.map((s: any) => s.name).join(', ') || ''
      case 'date':
        if (property.date) {
          const date = new Date(property.date.start)
          return date.toLocaleDateString('zh-CN')
        }
        return ''
      case 'checkbox':
        return property.checkbox ? '✓' : '✗'
      case 'url':
        return property.url || ''
      case 'email':
        return property.email || ''
      case 'phone_number':
        return property.phone_number || ''
      case 'people':
        return property.people?.map((p: any) => p.name || '用户').join(', ') || ''
      case 'files':
        return property.files?.length ? `${property.files.length} 个文件` : ''
      default:
        return JSON.stringify(property).substring(0, 50)
    }
  }

  if (loading) {
    return (
      <div className={styles.childDatabase}>
        <div className={styles.databaseHeader}>
          <span className={styles.databaseIcon}>📊</span>
          <span className={styles.databaseTitle}>{dbTitle}</span>
        </div>
        <div className={styles.databaseLoading}>加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.childDatabase}>
        <div className={styles.databaseHeader}>
          <span className={styles.databaseIcon}>📊</span>
          <span className={styles.databaseTitle}>{dbTitle}</span>
        </div>
        <div className={styles.databaseError}>
          <p>❌ {error}</p>
        </div>
      </div>
    )
  }

  if (!database || rows.length === 0) {
    return (
      <div className={styles.childDatabase}>
        <div className={styles.databaseHeader}>
          <span className={styles.databaseIcon}>📊</span>
          <span className={styles.databaseTitle}>{dbTitle}</span>
        </div>
        <div className={styles.databaseEmpty}>数据库为空</div>
      </div>
    )
  }

  // 获取数据库属性（列）
  const properties = Object.keys(database.properties || {})
  const visibleProperties = properties.filter(prop => {
    const propType = database.properties[prop]?.type
    // 排除一些不常用的类型
    return !['formula', 'rollup', 'relation', 'created_time', 'created_by', 'last_edited_time', 'last_edited_by'].includes(propType)
  })

  return (
    <div className={styles.childDatabase}>
      <div className={styles.databaseHeader}>
        <span className={styles.databaseIcon}>📊</span>
        <span className={styles.databaseTitle}>{dbTitle}</span>
        <span className={styles.databaseCount}>({rows.length} 条记录)</span>
      </div>
      <div className={styles.databaseTableWrapper}>
        <table className={styles.databaseTable}>
          <thead>
            <tr>
              {visibleProperties.map((propKey) => {
                const prop = database.properties[propKey]
                return (
                  <th key={propKey} className={styles.databaseTableHeader}>
                    {prop.name}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.id} className={styles.databaseTableRow}>
                {visibleProperties.map((propKey) => {
                  const property = row.properties[propKey]
                  return (
                    <td key={propKey} className={styles.databaseTableCell}>
                      {formatPropertyValue(property)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

