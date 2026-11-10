# 架构文档

> 本文档描述程程学习工作台的**当前真实架构**。历史上曾规划过 Kysely / Repository / DAL 分层、双设计系统、React Query 等，经评估后已统一收敛为下面的单一数据通路与单一设计系统（详见文末「演进记录」）。

---

## 概览

```
src/
├── app/                    # Next.js App Router 页面 + API 路由
│   ├── (child)/           # 孩子端页面组（home/castle/daily-practice/study/games/story/…）
│   ├── (parent)/          # 家长端页面组（dashboard/tasks/settings/…）
│   ├── api/               # 58 条 API 路由（每路由 = 一个领域动作）
│   ├── login/             # 登录页
│   └── layout.tsx          # 根布局：ensureSchema() 初始化 + ErrorBoundary + 全局壳
├── components/
│   ├── atomic/            # 旧设计系统残部（仅登录页 Button/Input 引用；新代码用 design-system）
│   ├── design-system/     # clay（黏土拟物）设计系统：ClayButton/ClayCard/ClayInput + tokens
│   └── *.tsx              # 业务组件（MokoCarousel/Castle/GrowthTree/games/…）
├── lib/                    # 领域逻辑（纯 TS，无 React）
│   ├── db-core.ts          # getDb() 单例连接 + withWriteLock 写事务互斥
│   ├── schema.ts           # ensureSchema()：建核心表 + 账号种子 + 跑迁移
│   ├── migrations.ts       # 版本化迁移（唯一迁移入口，幂等）
│   ├── auth.ts             # 会话认证（cookie + bcrypt）
│   ├── castle*.ts          # 城堡/经济/惩罚领域
│   ├── daily-practice/     # 每日一练出题（math/chinese/english 生成器）
│   ├── mastery*.ts         # 知识点掌握度画像 + 最近 30 天薄弱点推荐
│   ├── parent-report-insights.ts # 家长报告的三条解释性结论（纯函数）
│   ├── stores/             # Zustand 状态管理
│   ├── tts/                # TTS 四层降级（runtime 恢复链 + orchestrator 诊断适配）
│   └── …                   # moko/story/mistakes/sm2/media/… 领域模块
├── proxy.ts                # 路由级统一鉴权（软闸，只查 cookie 存在性）+ 全站 CSRF 防护
                             #（Next 16 把 middleware.ts 更名为 proxy.ts，2026-11-03 随 Next 16.4.4 升级迁移）
└── tasks-validation.ts     # 任务入参校验唯一出口（积分区间/标题）
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
- `mastery_daily`（v24）按 `(child_id, day, knowledge_point)` 固化首次作答证据；写入使用绝对值 upsert，
  重复交卷不会虚增样本。首页只读取最近 30 天、至少 3 次作答且掌握度低于 90 的薄弱项。

### 关键实现决策

| 决策   | 结论           | 理由                                             |
| ------ | -------------- | ------------------------------------------------ |
| ORM    | 不用（裸 SQL） | 单机 libSQL 足够；曾引入 Kysely 但未铺开，已移除 |
| 迁移   | 版本化 + 幂等  | 单一入口，避免历史 schema 漂移                   |
| 并发写 | 进程内互斥队列 | 单实例部署足够，明确标注多实例需换方案           |

---

## 认证

- 自定义 session cookie（`token` 随机 32 字节），`users.sessions` 表存储。
- bcrypt 密码哈希；`httpOnly` + `sameSite=lax` + 按反代头决定 `secure`。
- 家长/孩子双角色（`role: parent | child`）。
- 登录：IP 级限流 + 账号级连续失败锁定（内存级，单实例适用，见 `rate-limit.ts`）。
- `proxy.ts`（Next 16 前叫 `middleware.ts`）：CSRF 防护（Sec-Fetch-Site 优先 → Origin/Host，
  详见文件内注释）+ 未带 cookie 的请求页面跳登录 / API 返 401（软闸），真值仍由各路由
  `getCurrentUser()` 比对数据库决定。

---

## 状态管理（Zustand）

`lib/stores/index.ts`：

| Store             | 用途                     | 持久化 |
| ----------------- | ------------------------ | ------ |
| `useOfflineStore` | 离线写动作队列（重放）   | ✅     |
| `useUIStore`      | 全局 Loading/Toast/Modal | ❌     |

> `useAuthStore` / `useChildPreferencesStore` / `useTTSStore` / `useCaptureStore` 已删除——
> 全仓零引用，认证与偏好由服务端 session + 局部 state 承担，TTS/捕捉动画各有自己的实现。

> 说明：`useOfflineStore`（离线同步队列）**已覆盖全部高频写动作**：每日一练交卷、错题记录、错题复习、
> 收获星星币、使用道具（喷雾/时光沙漏）、商城兑换、捕捉萌可、家长补作业确认、许愿。任一动作失败即本地
> 暂存（localStorage），`OfflineSync` 组件在恢复联网后由 `flushOfflineQueue` 重放。
>
> **重放的三条纪律**（见 `lib/offline-sync.ts`）：
>
> 1. **每个动作都要有幂等键**才允许入队——`daily_checkins`/`story_progress` 的唯一约束、库存
>    `qty > 0` 原子扣减、`reviewMistake` 的 `next_review` 判定；`wishes` 原本是纯 INSERT 无幂等键，
>    已补 `client_ref` + 部分唯一索引（migrations v23）。
> 2. **失败分类用白名单**（`DISCARD_STATUSES = 400/404/409`），不再把「所有 4xx」当永久失败：
>    401（会话过期）、403（CSRF 软闸误判）、429（限流，`castle/buy` 是 10 秒 5 次，整队重放极易撞上）
>    都值得重试，一刀切丢弃会让孩子已经成功的操作凭空消失。
> 3. **无副作用护栏**：`castSpray` 在「城堡里没有任何可修理对象」时直接返回、不扣喷雾，
>    重放因此变得无害（同时修掉 `use-item` 无节流导致在线连点白扣道具的既有缺口）。

---

## UI 组件

### 设计系统（`components/design-system/`）

2026-10-18 起全站迁移到 **clay（黏土拟物）设计系统**：`ClayButton` / `ClayCard` / `ClayInput`

- `design-tokens.ts` 的黏土阴影配方与学科主题色变量，现被 50+ 页面/组件引用
  （`link-components.test.tsx` 守 RSC 链接边界、`rsc-boundary.test.ts` 守序列化 href）。

> 历史遗留：`components/atomic/`（Button/Input，仅登录页引用）是旧系统残部，
> 已被 clay 体系取代，保留仅为兼容登录页——新代码一律用 `components/design-system`。
> 历史上的 Card/Badge/Avatar/Modal 等 12 个原子组件曾因零引用删除（见交接文档 3.19/3.20）。

### 业务组件

`components/*.tsx` 顶层组件承载业务视图（MokoCarousel、GrowthTree、Castle、games/ 等），按需 `next/dynamic` 懒加载游戏等重组件。

---

## TTS 系统（四层降级）

> 2026-10-18 起「三层」扩为「四层」：新增第 0 层预生成本地 MP3，动态文本另走批量预取。

0. **预生成本地 MP3（第 0 层）** — `public/audio/` 下 2800+ 条静态内容（汉字/单词/古诗/故事全文/表扬语）
   构建期由 `scripts/gen-audio.mjs` 预生成，`audio-manifest-client.generated.ts` 清单进客户端；
   `preferStatic` 命中即零延迟本地播放，弱网/断网可用。
1. **静态 MP3 → 批量预取** — 动态文本（错题题干/台词）先查内存 LRU + localStorage 持久缓存，
   未命中走 `prefetchTtsBatch`（`/api/tts/batch`，一轮动态文本一次打包）。
2. **Web Speech Strict → Loose** — 严格匹配 zh-CN / en-US，宽松降级到任意 zh/en 嗓音。
3. **Edge TTS Server** — 服务端神经嗓音兜底（`/api/tts` + 常驻 Python worker）。

**唯一实现是 `lib/speak.ts`**（`playTts` / `playTtsWithResult`），全站 55+ 处调用。恢复链在
`lib/tts/runtime/playback.ts`（本地音频 → 严格 → 宽松 → 服务端），并按职责拆分：

- `browser-platform`（UA/语速/服务端 rate 等平台细节）、`voice-policy`（嗓音发现与严格/宽松选择）；
- `audio-cache`（内存 LRU + localStorage 持久化 + 批量预取）、`audio-player`（静态 MP3 与服务端播放）；
- `web-speech-player`：长文本切句（`splitSpeechText`）绕开 Android Chrome/Edge 长 utterance 卡死
  的平台 bug、Chrome keep-alive（每 8s pause/resume 踢醒引擎）、定时器统一登记并在朗读结束时清理。

`lib/tts/` 目录只保留**薄适配层**：`orchestrator.ts` 委托 `speak.ts` 执行朗读，仅额外提供指标统计与熔断状态，供 `/tts-diag` 诊断页使用。原先的 `lib/tts/engines/*`（第二套平行实现，缺少上面的关键处理）已删除——两套并存会导致重复维护与能力分叉。

---

## 测试策略

| 层级      | 工具                                | 说明                                                                                  |
| --------- | ----------------------------------- | ------------------------------------------------------------------------------------- |
| 单元/集成 | Vitest（1115 用例，138 个测试文件） | 领域逻辑、算法、Store、迁移（`file::memory:` 隔离，不碰真实 DB）                      |
| E2E       | Playwright                          | 关键用户流程（tests/e2e/，5 个 spec）。前置条件不满足的用例**显式 skip** 而非静默通过 |
| 可访问性  | axe-core                            | `atomic/a11y.test.tsx` + `test-axe.mjs`                                               |

命令：`pnpm test` / `pnpm test:coverage` / `pnpm e2e`。生产构建后可用
`pnpm check:perf` 检查 Next 路由级首屏 JS 预算；路由清单、客户端引用清单或引用的
chunk 任一缺失，或任一核心路由超预算，都会 fail-closed，不再只看所有 chunk 的总和。

<!-- 上面这些数字（用例数 / 测试文件数 / API 路由数 / 页面数）是会过期的。
     重新统计（2026-11-08 校准：1115 用例、138 个测试文件、58 条 API 路由、43 个页面）：
       pnpm vitest run                        # 末行即用例总数
       find src scripts -type f \( -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.test.mjs' \) | wc -l
       find src/app/api -name route.ts | wc -l
       find src/app -name page.tsx | wc -l
     改动测试或路由时顺手更新，别攒到"文档同步周"。 -->

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

- ~~**离线补打卡增强**~~：已完成（2026-10-31）——离线队列从「只重放每日一练交卷」扩展到 11 种写动作，
  并补齐幂等键 / 失败白名单 / 无副作用护栏三条纪律。
- ~~**设计系统推广**~~：已完成（2026-10-18 ~ 11-02）——全站迁移到 clay 设计系统
  （`components/design-system`），`components/atomic` 仅剩登录页残部待最终移除。
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
