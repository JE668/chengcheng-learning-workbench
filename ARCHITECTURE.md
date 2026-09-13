# 架构文档

> 本文档描述程程学习工作台的**当前真实架构**。历史上曾规划过 Kysely / Repository / DAL 分层、双设计系统、React Query 等，经评估后已统一收敛为下面的单一数据通路与单一设计系统（详见文末「演进记录」）。

---

## 概览

```
src/
├── app/                    # Next.js App Router 页面 + API 路由
│   ├── (child)/           # 孩子端页面组（home/castle/daily-practice/study/games/story/…）
│   ├── (parent)/          # 家长端页面组（dashboard/tasks/settings/…）
│   ├── api/               # ~45 条 API 路由（每路由 = 一个领域动作）
│   ├── login/             # 登录页
│   └── layout.tsx          # 根布局：ensureSchema() 初始化 + ErrorBoundary + 全局壳
├── components/
│   ├── atomic/            # 设计系统（唯一）：Button/Card/Modal/Select/Tabs/Toast/… + utils + a11y 测试
│   └── *.tsx              # 业务组件（MokoCarousel/Castle/GrowthTree/games/…）
├── lib/                    # 领域逻辑（纯 TS，无 React）
│   ├── db-core.ts          # getDb() 单例连接 + withWriteLock 写事务互斥
│   ├── schema.ts           # ensureSchema()：建核心表 + 账号种子 + 跑迁移
│   ├── migrations.ts       # 版本化迁移（唯一迁移入口，幂等）
│   ├── auth.ts             # 会话认证（cookie + bcrypt）
│   ├── castle*.ts          # 城堡/经济/惩罚领域
│   ├── daily-practice/     # 每日一练出题（math/chinese/english 生成器）
│   ├── stores/             # Zustand 状态管理
│   ├── tts/                # TTS 三层降级（engines + orchestrator）
│   └── …                   # moko/story/mistakes/sm2/media/… 领域模块
├── middleware.ts           # 路由级统一鉴权（软闸，只查 cookie 存在性）
└── env.mjs                 # 环境变量类型校验（Zod）
```

---

## 数据层（单一通路：裸 SQL）

### 连接与访问
- **唯一入口 `getDb()`**（`db-core.ts`）：基于 `@libsql/client` 的单例，包装 `execute` 自动补 `args`。
- 所有数据访问走**手写 SQL**（`db.execute`），不再使用 ORM——对自托管单机 + libSQL 足够，且避免「两条腿」心智负担。
- `withWriteLock()`：进程内写事务互斥队列，保证单实例下 `BEGIN…COMMIT` 整段原子执行（多实例部署需另上锁，本项目暂无此场景）。

### Schema 与迁移（单一真源）
- `schema.ts` 的 `ensureSchema()` 只做三件事：
  1. 开启 WAL / `synchronous=NORMAL`（NAS 断电保护）；
  2. 主批次 `CREATE TABLE IF NOT EXISTS` 建核心表；
  3. 全新库账号种子（`cara` / `parent`，受 `_schema_meta` 守卫限制）。
- 所有**增量表 / 增量列 / 历史数据回填**统一放在 `migrations.ts` 的版本化 `MIGRATIONS` 数组（`runMigrations` 只执行未应用的版本，天然幂等）。
- **约定：改 schema 只加一条迁移，不要在 `ensureSchema` 里堆内联 `ALTER`。**

### 关键实现决策
| 决策 | 结论 | 理由 |
|------|------|------|
| ORM | 不用（裸 SQL） | 单机 libSQL 足够；曾引入 Kysely 但未铺开，已移除 |
| 迁移 | 版本化 + 幂等 | 单一入口，避免历史 schema 漂移 |
| 并发写 | 进程内互斥队列 | 单实例部署足够，明确标注多实例需换方案 |

---

## 认证

- 自定义 session cookie（`token` 随机 32 字节），`users.sessions` 表存储。
- bcrypt 密码哈希；`httpOnly` + `sameSite=lax` + 按反代头决定 `secure`。
- 家长/孩子双角色（`role: parent | child`）。
- 登录：IP 级限流 + 账号级连续失败锁定（内存级，单实例适用，见 `rate-limit.ts`）。
- `middleware.ts`：未带 cookie 的请求页面跳登录 / API 返 401（软闸），真值仍由各路由 `getCurrentUser()` 比对数据库决定。

---

## 状态管理（Zustand）

`lib/stores/index.ts`：

| Store | 用途 | 持久化 |
|-------|------|--------|
| `useAuthStore` | 认证状态 | ✅ |
| `useChildPreferencesStore` | 学习偏好/设置 | ✅ |
| `useTTSStore` | TTS 播放队列 | ❌ |
| `useCaptureStore` | 萌可捕捉动画 | ❌ |
| `useUIStore` | 全局 Loading/Toast/Modal | ❌ |

> 说明：`useOfflineStore`（离线同步队列）当前仅定义了结构、尚未接入业务，属于「路线图」项，见文末。

---

## UI 组件

### 设计系统（`components/atomic/`）
唯一设计系统，基于 class-variance-authority + Tailwind，含 Button/Input/Card/Badge/Avatar/Modal/ConfirmDialog/Select/Tabs/Tooltip/DropdownMenu/Popover/Toast/Motion（动画）等，附带 `utils.ts`（cn helper）与 `a11y.test.tsx`。

> 现状提醒：原子组件尚未全量推广进页面——多数页面仍用顶层业务组件 + 页面内自建样式。将设计系统逐步铺开是独立的后续工程（见「路线图」）。

### 业务组件
`components/*.tsx` 顶层组件承载业务视图（MokoCarousel、GrowthTree、Castle、games/ 等），按需 `next/dynamic` 懒加载游戏等重组件。

---

## TTS 系统（三层降级）

1. **Web Speech Strict** — 严格匹配 zh-CN / en-US
2. **Web Speech Loose** — 宽松匹配任意 zh/en 嗓音
3. **Edge TTS Server** — 服务端神经嗓音兜底（含熔断 + 指标）

核心：`lib/tts/`（`TTSEngine` 接口 + `engines/` 三实现 + `orchestrator.ts` 编排器），React 集成走 `useTTS` Hook。

---

## 测试策略

| 层级 | 工具 | 说明 |
|------|------|------|
| 单元/集成 | Vitest（298 用例） | 领域逻辑、算法、Store、迁移（`file::memory:` 隔离，不碰真实 DB） |
| E2E | Playwright | 关键用户流程（tests/e2e/） |
| 可访问性 | axe-core | `atomic/a11y.test.tsx` + `test-axe.mjs` |

命令：`pnpm test` / `pnpm test:coverage` / `pnpm e2e`。

---

## 代码规范

- Husky + lint-staged（pre-commit：ESLint + Prettier + TypeCheck）
- commitlint（Conventional Commits：feat/fix/refactor/perf/test/docs/chore/…）

---

## 部署

- Docker 多阶段构建（Node 22 + Python edge-tts）→ GHCR，镜像约 550MB（zstd）。
- 环境变量：`TURSO_URL` / `TURSO_AUTH_TOKEN` / `CRON_SECRET` / `NEXT_PUBLIC_APP_URL`（见 `.env.example`）。
- 单实例假设：进程内限流/写锁/会话修剪均为单节点设计，**不要多副本水平扩展**。

---

## 演进记录（本次整改）

- 数据层：移除未使用的 Kysely / Repository / DAL 层（~1900 行孤儿代码），统一裸 SQL。
- 设计系统：移除 `components/ui`，保留 `components/atomic` 作为唯一设计系统。
- 移除未使用的 React Query 依赖与示例。
- 迁移：内联 `ALTER/CREATE` 全部收敛进版本化 `migrations.ts`，`ensureSchema` 职责收口。
- 移除冗余的 `scripts/migrate.mjs`（硬编码过时 schema，且未被引用）。

---

## 路线图（规划中，未实现）

- **PWA 离线补打卡**：离线同步队列（`useOfflineStore`）尚未接入业务，需补齐「本地暂存 → 联网批量同步 → 失败重试」。
- **设计系统推广**：将 `components/atomic` 组件逐步替换页面内自建样式，收敛重复 UI。
- **多实例支持**：若未来上 Serverless/多副本，需把进程内限流/写锁/会话锁定替换为共享存储（Redis 等）。
- **Feature 减法**：对非核心模块（部分小游戏等）做取舍，把维护成本集中到「每日一练 + 城堡 + 打卡」核心闭环。

---

## 参考资源

- [Next.js App Router](https://nextjs.org/docs/app)
- [Turso / libSQL](https://turso.tech/libsql)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)