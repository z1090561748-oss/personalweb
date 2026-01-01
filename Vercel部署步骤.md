# 🚀 部署到 Vercel - 详细步骤

## 当前进度 ✅
- ✅ Git 仓库已初始化
- ✅ 代码已推送到 GitHub
- ⏳ 部署到 Vercel（当前步骤）

---

## 第一步：访问 Vercel

1. 打开浏览器，访问：**https://vercel.com**
2. 点击右上角的 **"Sign Up"** 或 **"Log In"**

---

## 第二步：使用 GitHub 登录

1. 点击 **"Continue with GitHub"** 按钮
2. 授权 Vercel 访问你的 GitHub 账号
3. 完成登录

---

## 第三步：导入项目

1. 登录后，点击 **"Add New..."** 按钮
2. 选择 **"Project"**
3. 在 "Import Git Repository" 列表中找到你的仓库：**`personalweb`**
4. 点击仓库右侧的 **"Import"** 按钮

---

## 第四步：配置项目（重要！）

Vercel 会自动检测到这是 Next.js 项目，通常不需要修改，但请确认：

- ✅ **Framework Preset**: Next.js（自动检测）
- ✅ **Root Directory**: `./`（默认）
- ✅ **Build Command**: `npm run build`（默认）
- ✅ **Output Directory**: `.next`（默认）
- ✅ **Install Command**: `npm install`（默认）

**⚠️ 先不要点击 Deploy！** 我们需要先配置环境变量。

---

## 第五步：配置环境变量（非常重要！）

在点击 "Deploy" 之前，必须先配置环境变量：

### 5.1 找到环境变量设置

在项目配置页面的下方，找到 **"Environment Variables"** 部分

### 5.2 添加第一个环境变量

点击 **"Add"** 或 **"Add Environment Variable"**，添加：

- **Name（名称）**: `NOTION_API_TOKEN`
- **Value（值）**: `你的_notion_token`（从 Notion 集成页面获取）
- **Environment（环境）**: 
  - ✅ 勾选 **Production**
  - ✅ 勾选 **Preview**  
  - ✅ 勾选 **Development**

点击 **"Save"**

### 5.3 添加第二个环境变量

再次点击 **"Add"**，添加：

- **Name（名称）**: `NEXT_PUBLIC_SITE_URL`
- **Value（值）**: `https://你的项目名.vercel.app`（先填这个，部署后会更新）
- **Environment（环境）**: 
  - ✅ 勾选 **Production**
  - ✅ 勾选 **Preview**
  - ✅ 勾选 **Development**

点击 **"Save"**

### 5.4 确认环境变量

你应该看到两个环境变量：
1. `NOTION_API_TOKEN`
2. `NEXT_PUBLIC_SITE_URL`

---

## 第六步：开始部署

1. 确认环境变量已添加
2. 点击页面底部的 **"Deploy"** 按钮
3. 等待部署完成（通常 2-5 分钟）

---

## 第七步：获取网站地址

部署完成后，你会看到：

- ✅ **Congratulations!** 提示
- 🌐 **Your Project is live at**: `https://你的项目名.vercel.app`

**这就是你的网站地址！** 🎉

---

## 第八步：更新环境变量（重要）

部署完成后，需要更新 `NEXT_PUBLIC_SITE_URL`：

1. 进入项目页面
2. 点击 **"Settings"** 标签
3. 点击左侧的 **"Environment Variables"**
4. 找到 `NEXT_PUBLIC_SITE_URL`
5. 点击编辑（铅笔图标）
6. 将值改为你的实际域名（如 `https://你的项目名.vercel.app`）
7. 点击 **"Save"**
8. 返回 **"Deployments"** 标签
9. 点击最新部署右侧的 **"..."** → **"Redeploy"**

---

## 第九步：测试网站

1. 访问你的网站地址（如 `https://你的项目名.vercel.app`）
2. 检查网站是否正常加载
3. 检查 Notion 内容是否正常显示

---

## 完成！🎉

你的网站现在已经上线了！

### 接下来可以：

1. **分享给朋友** - 发送网站链接
2. **提交到搜索引擎** - 使用 Google Search Console
3. **自定义域名** - 在 Vercel 设置中添加自己的域名
4. **监控访问** - 在 Vercel 仪表板查看访问统计

---

## 常见问题

### Q: 部署失败怎么办？
A: 
1. 检查环境变量是否正确配置
2. 查看部署日志（点击部署 → View Function Logs）
3. 确认 Notion API Token 正确

### Q: 网站显示错误？
A:
1. 检查环境变量是否已添加
2. 确认 Notion 页面已连接到集成
3. 查看浏览器控制台的错误信息

### Q: 如何更新网站？
A:
1. 修改代码
2. `git add .`
3. `git commit -m "更新内容"`
4. `git push`
5. Vercel 会自动重新部署

---

需要帮助？随时告诉我！

