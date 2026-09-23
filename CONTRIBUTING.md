# Contributing to Blinga coding

感谢你帮助改进 Blinga coding。

## 开始之前

1. 搜索现有 Issue，避免重复工作。
2. 对较大的功能或数据模型变更，先创建 Issue 说明目标与方案。
3. 不要在 Issue、日志、截图、测试数据或提交中包含真实密钥和个人数据。

## 本地开发

```bash
npm ci
npm run dev
```

需要服务端功能时，从 `.env.example` 创建本地 `.dev.vars` 并填写自己的开发凭据。不要提交该文件。

## 提交前检查

```bash
npm run lint
npm run typecheck
npm run build
npm run test:all
```

数据库结构发生变化时，请同时更新 `db/schema.ts` 和 `drizzle/` 中的迁移。

## Pull Request

- 保持变更范围清晰，说明用户可见影响和验证方式。
- 为业务逻辑、权限或回归修复补充测试。
- 不要重写与本次变更无关的提交历史。
- UI 变更请同时检查深色/浅色、桌面/移动端和减少动画模式。

提交贡献即表示你同意按项目的 MIT License 提供该贡献。
