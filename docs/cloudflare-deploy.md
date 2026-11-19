# Cloudflare Workers 部署

本项目使用 vinext 构建一个同时提供页面和 `/api/*` 的 Cloudflare Worker。`wrangler.cloudflare.jsonc` 仅用于独立 Cloudflare 部署；常规 `npm run build` 和现有 `.openai/hosting.json` 仍用于原来的 ChatGPT Sites 流程。

当前公开地址：[https://blinga-coding.motoyatiago.workers.dev](https://blinga-coding.motoyatiago.workers.dev)。它使用独立 D1，新注册用户和学习记录不会自动与 Sites 站点同步。

## 准备

- Node.js `>= 22.13.0`，并执行 `npm ci`。
- 使用 `npx wrangler whoami` 核对当前 Cloudflare 账号。此配置关联账号 `600a9a9b481526dab58e2930f0910799` 下的专用 D1 数据库 `blinga-coding-prod`；其他账号部署时必须创建自己的 D1 并替换配置中的数据库 ID。
- 新库首次部署前运行 `npx wrangler d1 migrations apply blinga-coding-prod --remote --config wrangler.cloudflare.jsonc`。迁移会修改目标库，执行前请确认数据库名称和账号。
- 在 Worker 的 Cloudflare **Settings → Variables and Secrets** 中将 `AUTH_SESSION_SECRET` 设置为长随机值。不要把密钥放进仓库、Wrangler 配置或公开的构建变量。

## 构建与发布

```bash
npm run lint
npm run typecheck
npm run test:all
npm run build:cloudflare
npm run deploy:cloudflare
```

`build:cloudflare` 使用独立 Wrangler 配置生成 `dist/server/wrangler.json`，其中包含生产 D1 绑定和 `dist/client` 静态资源。部署命令只读取该产物。推送到 GitHub 本身不会自动部署；若在 Cloudflare Workers Builds 中连接仓库，可将 `main` 设为生产分支，Build command 设为 `npm run build:cloudflare`，Deploy command 设为 `npm run deploy:cloudflare`。运行时密钥仍应在 Worker 的 Variables and Secrets 中管理。

## 运行时依赖与限制

- `DB`：D1，保存账号、论坛、课程进度、复习与项目记录。独立部署使用新库，不自动复制原 Sites 的用户数据。
- `AUTH_SESSION_SECRET`：登录和会话必需。首次部署后必须设置，且应长期保持不变；更换它会使已有会话失效。
- `LLM_API_KEY`：AI 助教必需。请在 Cloudflare 中设置一枚新的 DeepSeek 或兼容服务密钥；不要使用曾在聊天或公开渠道发出的旧密钥。`LLM_API_BASE_URL` 和 `LLM_MODEL` 可按服务端配置调整。
- `CODE_RUNNER_URL`：在线运行与判题依赖 Judge0 兼容服务，默认地址不保证生产可用。自托管服务若需认证，再配置 `CODE_RUNNER_AUTH_TOKEN`。
- `AVATARS`：上传头像需要 R2。当前目标账号尚未启用 R2，因此独立部署不绑定此存储桶；预设头像仍可用，上传接口会返回“头像存储尚未启用”。启用 R2 后创建专用桶，在 Wrangler 配置中添加 `AVATARS` 绑定并重新构建部署。
- Microsoft、QQ、微信登录均为可选功能，需要对应 OAuth 凭据和正确的 `OAUTH_BASE_URL`。未配置时不应展示为可用入口。

部署后应检查首页、课程、论坛、登录与注册、静态资源和 API 响应；只有页面可打开不能证明数据库及外部 AI/判题服务可用。
