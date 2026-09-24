# Blinga coding

Blinga coding 是一个面向编程学习的全栈 Web 平台。主要为了初学编程的人去获得编程的趣味，它将结构化课程、在线代码执行、自动判题、AI 助教、知识图谱、学习记录、社区论坛和桌面宠物整合在同一套学习工作区中，等待大家探索。

## Demo

- 当前部署：[https://codeatlas-learning-lab.tahdsiukahdi.chatgpt.site](https://codeatlas-learning-lab.tahdsiukahdi.chatgpt.site)

该地址由现有 ChatGPT Sites 项目提供，实际访问范围取决于站点的访问策略。完整公开部署建议使用 Cloudflare Workers，并配置独立的 D1、R2 与运行时密钥。

## 功能

- Python、C/C++、JavaScript、Java 课程与章节导航
- 课程讲解、代码示例、知识图谱与 PDF 导出
- 在线代码运行、标准输入、基础测试用例和自动判题
- DeepSeek 驱动的 AI 助教、课程问答、报错分析与代码优化
- 云端学习进度、代码草稿、笔记、完成记录和运行历史
- 用户名或邮箱登录、独立密码、会话管理与可选 OAuth 登录
- 个人资料、头像上传、偏好设置和学习数据导出/清理
- 用户论坛、分类讨论、楼中楼回复、作者权限与已解决状态
- 支持明暗主题、移动端、减少动画和可拖动 AI 面板
- 桌面宠物及 Feeling 中的烟花祝福、流明场、空中绘画和星星体验

## 技术栈

- Next.js 16、React 19、TypeScript
- [vinext](https://github.com/cloudflare/vinext)、Vite 8
- Cloudflare Workers、D1、R2 和 Images
- Drizzle ORM / Drizzle Kit
- React Flow、GSAP、Lenis、Lottie
- DeepSeek 兼容的 Chat Completions API
- Judge0 代码执行 API
- Node.js 原生测试运行器和 ESLint

## 运行要求

- Node.js `>= 22.13.0`
- npm
- 本地运行完整服务端功能时需要 Cloudflare Workers 兼容运行环境
- AI、代码执行、OAuth 等功能需要对应的环境变量或上游服务

## 安装

```bash
git clone https://github.com/motoyatiago-cpu/Blinga-coding.git
cd Blinga-coding
npm ci
```

复制环境变量模板，并只在本地文件或托管平台的 Secret 设置中填写真实值：

```powershell
Copy-Item .env.example .dev.vars
```

`.dev.vars`、`.env` 和所有本地环境变量文件均被 Git 忽略，不应提交。

## 本地运行

```bash
npm run dev
```

默认开发服务器由 vinext 和 Cloudflare Vite 插件启动。D1 与 R2 在本地使用项目配置的模拟绑定。

## Build

```bash
npm run typecheck
npm run build
npm run test:all
```

其他质量检查：

```bash
npm run lint
npm test
```

`npm test` 会先执行生产构建，再运行核心渲染回归测试；`npm run test:all` 会执行全部测试文件。

## 环境变量

| 变量 | 必需性 | 用途 |
| --- | --- | --- |
| `LLM_API_KEY` | AI 功能必需 | DeepSeek 或兼容服务的服务端密钥 |
| `LLM_API_BASE_URL` | 可选 | 默认 `https://api.deepseek.com` |
| `LLM_MODEL` | 可选 | 默认 `deepseek-flash` |
| `CODE_RUNNER_URL` | 可选 | 默认 `https://ce.judge0.com` |
| `CODE_RUNNER_AUTH_TOKEN` | 视上游而定 | 私有 Judge0 服务认证 |
| `AUTH_SESSION_SECRET` | 账号系统必需 | 服务端会话签名密钥 |
| `AUTH_LEGACY_TRANSITION` | 可选 | 旧账户过渡开关 |
| `OAUTH_BASE_URL` | OAuth 部署时需要 | OAuth 回调公开基础地址 |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` | 可选 | Microsoft OAuth |
| `QQ_CLIENT_ID` / `QQ_CLIENT_SECRET` | 可选 | QQ OAuth |
| `WECHAT_OPEN_APP_ID` / `WECHAT_OPEN_APP_SECRET` | 可选 | 微信开放平台 OAuth |
| `WECHAT_OA_APP_ID` / `WECHAT_OA_APP_SECRET` | 可选 | 微信公众号 OAuth |

生产密钥必须通过部署平台的 Secret 管理配置，不能写入源码、GitHub Actions YAML 或公开仓库。

## 数据与服务端依赖

- `DB`：Cloudflare D1，保存账户、会话、课程进度、草稿、笔记、运行记录和论坛数据。
- `AVATARS`：Cloudflare R2，保存用户上传头像。
- `IMAGES`：Cloudflare Images 兼容绑定，用于图片处理。
- `/api/ai`：服务端代理 AI 请求，避免浏览器接触密钥。
- `/api/run`：服务端调用 Judge0，并记录运行与判题结果。
- `/api/auth/*`、`/api/profile/*`、`/api/forum/*`：动态认证、个人中心和论坛接口。

这些依赖意味着项目不能在 GitHub Pages 上完整运行。GitHub Pages 只支持静态文件，无法提供 Worker、D1、R2、会话 Cookie 或服务端 API。推荐使用 Cloudflare Workers 部署，并在目标账户中创建 D1/R2 绑定和 Secret。

## 项目结构

```text
app/                 Next.js 页面、学习工作区和客户端组件
app/web-pet/         桌面宠物状态机、交互与素材注册表
worker/              Cloudflare Worker、认证和 API 路由
db/                  Drizzle 数据模型
drizzle/             D1 数据库迁移
public/feeling/       Feeling 的四个独立交互体验
tests/                回归、安全、论坛、认证和主题测试
.openai/              现有 ChatGPT Sites 托管配置
.github/              GitHub 协作模板与 CI
```

## GitHub Actions

CI 在推送到 `main` 或向 `main` 提交 Pull Request 时执行：

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`
5. `npm run test:all`

CI 不会部署生产环境，也不需要第三方 Secret。

## Contributing

欢迎提交 Issue 和 Pull Request。开始前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。安全问题请按 [SECURITY.md](SECURITY.md) 私下报告。

## License

本项目的原创代码采用 [MIT License](LICENSE)。第三方依赖、字体、图片和打包素材仍遵循各自的上游许可证或授权条款。
