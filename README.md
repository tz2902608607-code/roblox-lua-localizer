# Roblox 汉化脚本在线生成器

一个用于生成 Roblox Lua 汉化脚本的静态网页工具。支持 20+ 翻译接口自动翻译，一键生成可复制、可下载的 Lua 汉化脚本。

项目地址：<https://github.com/tz2902608607-code/roblox-lua-localizer>

项目体验地址：
<https://liyizhou.cc.cd>

## 功能

- 添加英文原文和中文翻译词条
- **20+ 翻译接口**，支持自动选择和手动切换
- AI 翻译接口支持**自定义提示词**，控制翻译风格
- 生成 Roblox Lua 汉化脚本（普通扫描模式 + Hook 模式）
- 支持远程脚本 Raw 链接
- 支持 JSON 导入和导出
- 支持复制代码和下载 `.lua` 文件
- 内置使用教程
- 适配手机端和桌面端
- Cloudflare Turnstile 人机验证保护
- Key 状态指示器（待检测 / 有效 / 无效）
- 一键申请 API Key 链接
- 无需构建，纯静态部署

## 翻译接口

### 免费接口（无需 Key）

| 接口 | 说明 |
|------|------|
| MyMemory | 免费翻译，自动选择首选 |
| DeepLX | DeepL 免费代理（多实例 fallback） |
| Lingva | 谷歌翻译代理（多实例 fallback） |
| LibreTranslate | 开源翻译（多实例 fallback） |
| Reverso | 在线翻译 |
| 搜狗翻译 | 在线翻译 |
| 彩云小译 | 在线翻译 |
| 有道翻译 | 在线翻译 |
| 必应翻译 | 在线翻译 |
| 谷歌翻译 | 需 VPN |

### 需 Key 的翻译接口

| 接口 | 模型 | 免费额度 | 申请地址 |
|------|------|---------|---------|
| 百度翻译（机翻） | 通用翻译 | 100W 字符/月 | [fanyi-api.baidu.com](https://fanyi-api.baidu.com/) |
| 百度大模型翻译 | 大模型翻译 | 认证后 100W 字符/月 | [fanyi-api.baidu.com](https://fanyi-api.baidu.com/) |
| 百度AI 翻译 | 文心一言 ERNIE Speed | 免费 | [千帆控制台](https://console.bce.baidu.com/qianfan/ais/console/applicationConsole/application) |
| DeepSeek AI | DeepSeek | 新用户免费额度 | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| 豆包 AI | 豆包 | 新用户免费额度 | [火山引擎](https://console.volcengine.com/ark) |
| Kimi AI | Moonshot | 新用户免费额度 | [Moonshot](https://platform.moonshot.cn/console/api-keys) |
| ChatGPT AI | GPT | 按量付费 | [OpenAI](https://platform.openai.com/api-keys) |
| Gemini AI | Gemini | 有免费额度 | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| 通义千问 AI | qwen-turbo | 新用户 7000W Token | [百炼控制台](https://bailian.console.aliyun.com/#/api-key) |
| 智谱AI GLM | glm-4.7-flash | **永久免费** | [智谱AI](https://bigmodel.cn/usercenter/proj-mgmt/apikeys) |
| 讯飞星火 | lite | **永久免费** | [讯飞开放平台](https://console.xfyun.cn/services/bm3) |
| 零一万物 Yi | yi-lightning | 新用户 360W Token | [零一万物](https://platform.lingyiwanwu.com/apikeys) |
| 腾讯混元 | hunyuan-turbo | 新用户 100W Token | [TokenHub](https://console.cloud.tencent.com/tokenhub) |
| Yandex 翻译 | Yandex | 有免费额度 | [Yandex Cloud](https://cloud.yandex.com/en/services/translate) |
| DeepL 翻译 | DeepL | 有免费额度 | [DeepL](https://www.deepl.com/pro-api) |
| 自定义 AI | OpenAI 兼容 | 取决于平台 | 自行填写 API 地址和模型 |

> AI 翻译接口均支持自定义提示词，可选择留空使用默认提示词，或自定义翻译风格。

## 使用方法

### 快速开始

1. 打开网页，在翻译接口下拉框选择接口（推荐"自动选择"）
2. 在词条列表中填写英文原文
3. 点击"自动翻译"批量翻译
4. 根据需要填写远程脚本 Raw 链接
5. 点击"生成脚本"，复制代码或下载 `.lua` 文件

### UI 文本提取

使用 UI 文本提取脚本获取当前 Roblox 游戏页面上的英文 UI 文本，然后粘贴到词条列表中进行翻译。

### 自定义 AI 提示词

选择任意 AI 翻译接口后，Key 输入框下方会出现"AI 提示词"文本框。可以自定义翻译风格，例如：

```
你是一个游戏翻译专家，请将以下Roblox游戏文本翻译成中文玩家习惯用语，只返回翻译结果。
```

## 文件结构

```text
.
├── index.html
├── style.css
├── script.js
├── changelog.html
├── README.md
├── LICENSE
├── _headers
└── functions/
    └── api/
        ├── translate.js      # 翻译代理
        ├── test-key.js       # Key 测试
        └── stats.js          # 在线统计
```

## JSON 导入格式

支持对象数组：

```json
[
  { "英文原文": "Play", "中文翻译": "开始" },
  { "en": "Settings", "cn": "设置" }
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

使用 GitHub Pages 时：

1. 新建一个公开 GitHub 仓库
2. 上传所有文件
3. 进入仓库 `Settings` → `Pages` → Source 选择 `main` 分支
4. 保存后等待自动生成访问地址

> 纯静态部署下，免费翻译接口中 MyMemory 可浏览器直连使用。其他接口需要 Cloudflare Functions 代理。

### 方式二：Cloudflare Pages + Functions（支持全部接口）

如果需要使用全部翻译接口，需要部署 Cloudflare Pages Functions 代理。

#### Wrangler CLI 部署

```bash
# 安装 Wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
wrangler pages deploy .
```

#### Dashboard 手动上传

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧菜单进入 `Workers & Pages` → `Create application` → `Pages` → `Upload assets`
3. 上传项目文件夹（包含 `index.html` 和 `functions/`）
4. 部署完成后获得访问地址

#### 验证代理

打开部署后的地址，在浏览器控制台执行：

```javascript
fetch('/api/translate?provider=mymemory&text=hello').then(r => r.json()).then(console.log)
```

如果返回 `{provider: "mymemory", translated: "你好"}`，说明代理已正确部署。

## 使用提醒

- 普通扫描模式兼容性更好，Hook 模式可能在有反作弊的游戏中失效
- 请只使用可信来源的远程 Raw 链接
- 本项目仅用于学习交流，请勿用于违反 Roblox 平台规则或其他不当用途
- 谷歌翻译在国内网络环境下通常需要 VPN
- API Key 仅保存在浏览器本地，不会上传到服务器

## 开源协议

本项目使用 MIT License 开源。你可以自由使用、修改和分发本项目代码，但需要保留原协议声明。
