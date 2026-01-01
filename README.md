# HOVER WEB

一个实时抓取和展示 Notion 文档内容的网站，采用黑色背景新媒体艺术风格设计。

## 功能特性

- 🔗 固定抓取指定的 Notion 页面
- ⚡ 实时抓取 Notion 文档内容
- 🎨 黑色背景新媒体艺术风格设计
- 📱 响应式设计，支持移动端
- 🔄 支持多种 Notion 内容类型（标题、段落、列表、代码块、图片、视频、数据库等）
- 🔍 SEO 优化，支持搜索引擎索引

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
NOTION_API_TOKEN=你的_notion_token
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 部署

### 使用 Vercel（推荐）

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量：
   - `NOTION_API_TOKEN`
   - `NEXT_PUBLIC_SITE_URL`
4. 部署完成！

详细部署指南请查看 [部署指南.md](./部署指南.md)

## 技术栈

- **Next.js 13** - React 框架
- **TypeScript** - 类型安全
- **Notion API** - 官方 API 客户端
- **CSS Modules** - 样式管理

## 项目结构

```
├── app/
│   ├── api/
│   │   └── notion/          # Notion API 路由
│   ├── doc/
│   │   └── [pageId]/        # 文档展示页面
│   ├── globals.css          # 全局样式
│   ├── layout.tsx           # 根布局
│   ├── page.tsx             # 首页
│   ├── robots.ts            # robots.txt
│   └── sitemap.ts           # sitemap.xml
├── components/
│   ├── NotionRenderer.tsx   # Notion 内容渲染组件
│   └── NotionRenderer.module.css
└── public/                   # 静态文件
```

## 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `NOTION_API_TOKEN` | Notion API Token | 是 |
| `NEXT_PUBLIC_SITE_URL` | 网站 URL（用于 SEO） | 否 |

## License

MIT
