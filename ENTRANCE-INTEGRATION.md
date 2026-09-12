# 水面入站界面整合

## 访问流程

- `/`：水面登录/注册入口。
- 注册或登录成功：默认前往 `/home`；有效的站内 `returnTo` 会保留。
- “进入网站”：直接访问 `/home`，不创建新会话、不绕过后端权限检查。
- `/home`：原学习主页。原有课程、论坛、个人中心、AI 与实训继续使用现有实现。
- `/author`：迁移的作者介绍页面。
- 旧 `/?lang=...&topic=...`、`/?assistant=open` 和课程 hash 链接由入口兼容转到 `/home`。
- 原 `/login` 和 `/register` 页面继续可用。

## 文件

修改：`app/page.tsx`、`app/layout.tsx`、`app/course-links.ts`、课程目录/论坛/个人中心/登录/注册中的主页链接，以及现有测试的学习主页读取路径。

新增：`app/home/page.tsx`、`app/learning-workspace.tsx`（原主页保留）、`app/site-effects.tsx`、`app/author/page.tsx`、`app/entrance/`（模板、隔离样式、动画模块、生命周期与认证适配）、`public/entrance/`（原素材与许可证）、`tests/entrance.test.mjs`。

删除：无。依赖新增：无。原始 `waterwebgl-shader` 项目未修改。桌宠文件、数据库结构和认证后端均未修改。

## 实现说明

入站页使用 React 模板及 Shadow DOM 样式隔离，不使用 iframe。原 WebGL 参数、着色器与视觉样式保留；动画监听器、定时器和 GPU 上下文随页面清理，页面隐藏时暂停。

认证复用 `/api/auth/password/login`、`/api/auth/password/register`、`/api/auth/session`。注册字段与后端校验保持一致。仅展示服务端确认已配置的第三方入口，不包含模拟成功处理器；密码不写入浏览器存储。

## 验证与人工检查

生产构建、TypeScript 检查、全量回归与本地 HTTP 路由/认证冒烟测试已执行。认证冒烟测试只在本机创建了 `entry_mtvhklw8` 测试账号并退出会话，未操作线上账号。

尚需人工检查：桌面/手机浏览器的水面与人物视觉、触摸与软键盘、真实第三方 OAuth 回调。未配置的平台保持隐藏。

本次为指定本地项目的整合；线上发布需单独进行。Sites 外层若保持私有，匿名用户仍需先通过平台访问限制，访客按钮不会改变该限制。
