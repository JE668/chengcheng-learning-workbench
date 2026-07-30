# 程程学习工作台

基于《奇妙萌可》主题的儿童学习工作台，支持家长发布任务、孩子学习赚积分、兑换奖励与趣味小游戏。

## 技术栈

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- 数据库：Turso (LibSQL)，本地开发回退到 `local.db`
- 认证：自定义 session cookie（家长/孩子双角色）
- 部署：GitHub + Vercel

## 初始账号

运行 `npm run seed` 创建默认账号：

- 家长：`parent` / `12345678`
- 孩子：`cara` / `0000`

> 生产环境务必在「家长端 - 设置」里修改孩子密码。

## 本地开发

```bash
npm install
npm run seed
npm run dev
```

## 部署到 Vercel

1. 将仓库 push 到 GitHub（私有仓库）。
2. 在 Vercel 导入项目，绑定 GitHub 仓库。
3. 在 Vercel Project Settings → Environment Variables 中填入 `TURSO_URL`、`TURSO_AUTH_TOKEN`、`SESSION_SECRET`。
4. 建议开启 Vercel 的 Password Protection（Settings → Deployment Protection）。

## 版权说明

项目中使用的《奇妙萌可》角色图片来源于公开百科缩略图，仅用于非商用的家庭私有学习场景。本项目为私有仓库并需登录访问，不对外公开传播。
