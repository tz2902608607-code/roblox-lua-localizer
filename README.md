# Roblox 汉化脚本在线生成器

一个用于生成 Roblox Lua 汉化脚本的静态网页工具。它可以把英文 UI 文本和中文翻译整理成词条，并生成可复制、可下载的 Lua 脚本，方便在使用脚本时快速理解界面内容。

本项目不依赖后端服务，也不需要安装依赖。下载源码后直接打开 `index.html` 即可使用。

项目地址：<https://github.com/tz2902608607-code/roblox-lua-localizer>

## 功能

- 添加英文原文和中文翻译词条
- 生成 Roblox Lua 汉化脚本
- 默认使用普通扫描模式
- 可手动开启 Hook 模式
- 支持远程脚本 Raw 链接
- 支持 JSON 导入和导出
- 支持有道翻译、必应翻译、谷歌翻译自动翻译选项
- 支持复制代码和下载 `.lua` 文件
- 内置使用教程
- 适配手机端和桌面端
- 无需构建，纯静态部署
- 导航栏提供 GitHub 开源项目入口

## 使用方法

直接打开 `index.html`，按页面提示填写内容。

常见流程：

1. 使用 UI 文本提取脚本获取当前页面上的英文 UI 文本。
2. 在词条列表中填写英文原文和中文翻译。
3. 如果需要，可以选择有道翻译、必应翻译或谷歌翻译，把已有英文原文批量翻译为中文。
4. 根据需要填写远程脚本 Raw 链接。
5. 保持普通扫描模式，或在需要时手动开启 Hook 模式。
6. 点击“生成脚本”，复制代码或下载 `.lua` 文件。

页面内的“使用教程”提供了更详细的说明。

## 文件结构

```text
.
├── index.html
├── style.css
├── script.js
├── README.md
└── LICENSE
```

## JSON 导入格式

支持对象数组：

```json
[
  {
    "英文原文": "Play",
    "中文翻译": "开始"
  },
  {
    "en": "Settings",
    "cn": "设置"
  }
]
```

也支持二维数组：

```json
[
  ["Play", "开始"],
  ["Settings", "设置"]
]
```

## 部署

### 方式一：纯静态部署（推荐，最简单）

直接把 `index.html`、`style.css`、`script.js` 放到任意静态托管即可使用。支持 GitHub Pages、Cloudflare Pages（纯静态）、Vercel、Netlify 或普通虚拟主机。

使用 GitHub Pages 时，可以按以下方式部署：

1. 新建一个公开 GitHub 仓库。
2. 上传 `index.html`、`style.css`、`script.js`、`README.md` 和 `LICENSE`。
3. 进入仓库 `Settings` → `Pages`。
4. Source 选择 `Deploy from a branch`，Branch 选择 `main`，目录选择 `/root`。
5. 保存后等待 GitHub Pages 自动生成访问地址。

> 纯静态部署下，翻译接口中的**谷歌翻译**、**MyMemory**、**Lingva**、**LibreTranslate** 支持浏览器直连，可直接使用。其他接口（有道、必应、百度、DeepSeek、Kimi 等）需要下方的 Cloudflare Function 代理才能使用。

### 方式二：Cloudflare Pages + Functions（支持全部翻译接口）

如果需要使用**全部翻译接口**（包括有道、必应、百度、DeepSeek、Kimi、豆包、自定义 AI 等），需要部署 Cloudflare Pages Functions 代理。

#### 步骤 1：准备文件

确保项目根目录包含以下文件和文件夹：

```text
.
├── index.html
├── style.css
├── script.js
├── README.md
├── LICENSE
└── functions/
    └── api/
        └── translate.js
```

#### 步骤 2：通过 Wrangler CLI 部署

1. 安装 Wrangler（Cloudflare 官方 CLI）：
   ```bash
   npm install -g wrangler
   ```

2. 登录 Cloudflare 账号：
   ```bash
   wrangler login
   ```
   这会打开浏览器让你授权登录。

3. 进入项目目录，执行部署：
   ```bash
   wrangler pages deploy .
   ```
   按提示选择：
   - 如果是新项目，输入项目名称（如 `roblox-localizer`）
   - 选择生产分支（默认 `main`）

4. 部署完成后，终端会输出访问地址，如 `https://roblox-localizer.pages.dev`。

#### 步骤 3：验证代理是否生效

打开部署后的地址，在浏览器控制台执行：
```javascript
fetch('/api/translate?provider=mymemory&text=hello').then(r => r.json()).then(console.log)
```

如果返回类似 `{provider: "mymemory", translated: "你好"}`，说明代理已正确部署。

#### 方式 2B：通过 Cloudflare Dashboard 手动上传

如果不方便用命令行，也可以直接上传：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 左侧菜单进入 `Workers & Pages` → `Create application` → `Pages` → `Upload assets`。
3. 拖拽或选择项目文件夹（包含 `index.html` 和 `functions/`）。
4. Cloudflare 会自动识别 `functions/` 目录并部署 Functions。
5. 部署完成后获得访问地址。

> 注意：后续更新时，需要重新上传整个文件夹。

## 使用提醒

普通扫描模式兼容性更好，Hook 模式可能在有反作弊的游戏中失效或被拦截。建议默认使用普通扫描模式，只有在普通扫描无法及时处理动态 UI 文本时，再考虑手动开启 Hook。

生成的 Lua 脚本会加载你填写的远程 Raw 链接。请只使用可信来源，避免账号、设备或隐私风险。

本项目仅用于学习交流，请勿用于违反 Roblox 平台规则或其他不当用途。

自动翻译功能依赖第三方网页翻译接口，可能受到浏览器跨域限制、地区网络环境或服务策略影响。谷歌翻译在国内网络环境下通常需要 VPN。

## 开源协议

本项目使用 MIT License 开源。你可以自由使用、修改和分发本项目代码，但需要保留原协议声明。
