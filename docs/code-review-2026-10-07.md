# 程程学习工作台 · 代码审查报告

审查日期：2026-10-07 ｜ 范围：全仓库（55k LOC src/，52 个 API 路由）

审查方式：读全部源码 + **实测验证**（跑了 tsc / vitest / next build / SQLite EXPLAIN QUERY PLAN / 真实 local.db 查询 / 两次完整构建做 A/B）。
下文每条结论都标注了验证方式，未验证的推测已明确标注。

---

## 〇、P0 修复进展（本轮已落地）

| 项                           | 状态    | 验证方式                                                                        |
| ---------------------------- | ------- | ------------------------------------------------------------------------------- |
| P0-1 备份导出移除 sessions   | ✅ 已修 | 加了 2 条回归测试；**人为把 bug 放回去确认两条都失败**，恢复后全绿              |
| P0-2 CSRF 防护               | ✅ 已修 | middleware 层实现 + 10 条测试；去掉检查后 4 条攻击用例失败，放回后全绿          |
| P0-3 迁移运行器 + 本地库     | ✅ 已修 | 3 条新回归测试（中间版本丢失可补跑、失败必上抛且不记 applied）；                |
|                              |         | **真实 local.db 已从 v13 补到 v17**，三张缺失表已建出，对应路由查询实测不再报错 |
| P0-4 splitChunks shared 分组 | ✅ 已删 | 重建后 shared chunk 不再生成，41 个懒加载边界全部指向各自 chunk                 |

---

## 〇之二、P1 修复进展（本轮已落地）

| 项                      | 状态    | 验证方式                                                                       |
| ----------------------- | ------- | ------------------------------------------------------------------------------ |
| P1-4 补打卡日期校验     | ✅ 已修 | 抽出 `src/lib/backfill-date.ts` 唯一实现，三条路由共用；                       |
|                         |         | 把校验整段去掉后实测**未来日期和 3 年前日期都返回 200 并发放积分/阳光/萌可**， |
|                         |         | 加回后分别被「不能确认今天之后」「只能补最近 30 天内」拦下                     |
| P1-5 经济写接口限流     | ✅ 已修 | grant / gift-item / redeem 三条加上；测试禁用限流后确认失败、恢复后通过        |
| P1-6 限流器核心逻辑测试 | ✅ 已补 | 11 条用例锁死 `getClientIp` 取 XFF **末跳**；把实现改回首跳后 3 条立即失败     |
| P1-7 E2E 门禁           | ✅ 已修 | 去 `continue-on-error`、跑全部 5 个 spec、新增 `e2e-gate` 汇总 job             |

**验证结果**：tsc 零错误 · **507 测试全绿**（478 → 507，新增 29）· ESLint 零警告 ·
覆盖率门槛通过（59% stmt / 52.8% branch）· `next build` 成功 · bundle 预算 3402KB/5000KB ·
鉴权门禁 / check-media / moko-collection 生成物一致性 全部通过。

新增文件：`src/lib/backfill-date.ts`（共享校验）、5 个测试文件。
改动文件另含 `castle/{confirm,use-item,approve-timeglass,grant,gift-item}/route.ts`、`redeem/route.ts`、
`.github/workflows/{ci,build}.yml`。

---

## 〇之三、P1-1/2/3 修复进展（本轮）

| 项                  | 状态    | 验证方式                                                                                                                 |
| ------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| 索引缺失            | ✅ 已修 | 新增迁移 **v18**：实测 EXPLAIN 从 `SCAN mistakes` + temp B-tree、`SCAN users` 变为两条 `SEARCH ... USING COVERING INDEX` |
| 8 条迁移缺 `down`   | ✅ 已修 | v7/v9/v10/v11/v12/v13 补真实回滚；v6/v8 **不可逆**，改为显式抛错并说明原因（删表删数据 / 已丢重复行无法还原）            |
| 事务原子性          | ✅ 已修 | `castle.buy` 与 `redeem` 的「先扣后发」补 `BEGIN IMMEDIATE`/`COMMIT`/`ROLLBACK`                                          |
| `mistakes` 去重竞态 | ✅ 已修 | 去掉锁后并发 3 次提交**实测插入 3 行重复记录**，加锁后为 1 行                                                            |

> `getCurrentVersion` 的 `MAX` 语义**有意保留**（只用于展示水位与定位回滚目标，不是迁移闸门），
> 已补注释说明与 `runMigrations` 的 Set 判定的区别。

### 意外收获：修出一个**每日定时变红**的时区 bug

全量测试跑到最后剩 2 条失败，且与本轮改动**无关**（在原始 HEAD 上同样失败）。
根因是 `daily-practice-reset-atomicity.test.ts` 用 **UTC** 取日期：

```ts
const today = new Date().toISOString().slice(0, 10); // UTC 日
```

而路由内部用 `dateStr()` 取**本地日**（东八区）。UTC 16:00 之后两者差一天，种下的行路由根本查不到
→ 返回 400。**即这个用例每天 UTC 16:00 起必然变红**，只是多数时候没人注意到。
已改用 `dateStr()`，并用 TZ=Asia/Shanghai / America/New_York / UTC 三种时区验证全部通过。

排查时顺手发现**两处同类用户可见 bug**（不是测试，是真会影响孩子用）：

- `src/components/CheckinCalendar.tsx:34` —— `isBrokenDay` 用它判断「这天已过去却没打满卡」→
  每天 UTC 16:00 后会把**今天误标成漏打卡**、提示去补。
- `src/app/(child)/castle/page.tsx:401/423` —— 时光沙漏默认选中「昨天」和 `<input type="date" max>`
  都用 UTC，UTC 16:00 后默认值会跳到错误的日期。

三处都已改走 `src/lib/date.ts`（该文件本就是全仓唯一的「本地日」出口）。

**验证结果**：tsc 零错误 · **514 测试全绿**（507 → 514）· ESLint 零警告 ·
覆盖率门槛通过（59.2% stmt / 53.1% branch）· `next build` 成功 ·
bundle 3406KB/5000KB · 鉴权门禁与 check-media 通过。

> **关于 E2E 门禁的一个实现细节**：`build.yml` 以 `uses:` 复用 ci.yml，而被复用的 workflow
> 对外只暴露**整体结果**（等价单个 job），所以 `build.yml` 写 `needs: [precheck, e2e]`
> 会因引用不存在的 job 直接报错。改为在 ci.yml 内部加 `e2e-gate`（`needs: [check, e2e]` +
> `if: always()` + 显式检查上游结果），precheck 因此变红，镜像不再推送。

> ⚠️ E2E 现在是**硬门禁**，首次推送可能因存量用例偶发不稳定而变红。
> 若遇到与本轮改动无关的旧失败，建议先单独跑 `pnpm e2e` 定位再决定，
> 不要直接加回 `continue-on-error`。

> ⚠️ **P0-2 上线前请确认**：CSRF 比对 `Origin` 与 `Host`。若你的反代（lucky/nginx）改写了 Host，
> 需在 `.env` 设 `ALLOWED_ORIGINS=https://你的外层域名`，否则正常写操作会被 403 拦下。
> 详见 `.env.example` 新增段落。

---

## 一、总体判断

> **一处自我更正**：本次审查中我最初判断"大数据没进客户端、懒加载做得很好"——**这是错的**。
> 用 `react-loadable-manifest.json` 实测后发现 `splitChunks` 配置完全抵消了懒加载（详见 P0-4）。
> 下文以实测为准。

这是一个**工程质量明显高于同规模项目**的代码库：

- 463 个单测全绿，`tsc --noEmit` 零错误，生产构建成功（First Load JS 103 kB）。
- 迁移机制单点收敛，注释写清了"为什么"，`addColumnIfMissing` 刻意不吞真实错误。
- 原子 SQL 用在该用的地方（条件 UPDATE + rowsAffected、ON CONFLICT、MAX(stars) upsert）。
- 会话是不透明 DB token 而非 JWT；expire 在**读取时**复检，不只在清理时。
- 无 IDOR：所有 childId 均来自 session，全仓库搜不到 body.childId。
- 全仓库 `: any` 仅 12 处，`@ts-ignore` 0 处，`console.log` 4 处。

**结论：主要风险不在"代码写得差"，而在三处"修了一半"** —— 修复没有推广到同类路径，
以及迁移运行器的容错逻辑把真实故障伪装成成功。

---

## 二、P0：建议本周修完

### P0-1 备份导出泄露**有效登录 token**（安全，一行修复）

`src/app/api/backup/route.ts:19` 的 `EXPORT_TABLES` 含 `sessions`，而导出走 `SELECT *`（:135）。
`sessions` 表结构是 token/user_id/created_at —— 导出的明文 JSON 里是**当前全部有效会话凭据**。

讽刺的是：`79ac3b3` 那个"不导出 password_hash"的提交，只对 `users` 表加了列白名单（:129），
其余表一律 `SELECT *`。而**导入侧（:65）明确排除了 sessions** —— 作者知道 token 危险，只是漏了导出侧。

**修复**：从 `EXPORT_TABLES` 删除 `'sessions'`。

> 实测确认：`local.db` 中 sessions 有 3 行。

### P0-2 全站无 CSRF 防护

`src/lib/auth.ts:92,104` cookie 为 `sameSite: 'lax'`；全仓库搜 `csrf|sec-fetch-site|Origin` 校验 = **零命中**；
`next.config.mjs` 也没设 CORS。

`lax` 允许跨站顶层 GET，但**跨站 POST 表单不发预检**，且 lax 下 POST 会带 cookie。
整个 API 是 POST/PATCH/DELETE —— 构造一个指向 `/api/castle/grant` 的跨站表单即可借家长 session 造币。

**修复**：加 `assertSameOrigin(req)`（校验 `Origin` 或 `Sec-Fetch-Site`），在所有非 GET handler 调用。

### P0-3 本地库卡在迁移 v13，三张表根本没建（已实测）

`SELECT MAX(version) FROM schema_migrations` = **13**，但代码里已有 v17。
实测缺失：`algorithm_progress`、`algorithm_mistakes`、`push_subscriptions`
—— 而 `api/algorithm-progress`、`api/algorithm-mistakes`、`api/push/*` 都在查它们，**这些路由现在就会 500**。

根因是 `src/lib/migrations.ts:536-553`：`no such table` 被吞掉后，**版本仍然记为 applied**，永不重试。
该容错本是为全新库设计（`runMigrations` 跑在建表之前，`schema.ts:256` vs `34-219`），
但它同时吞掉了**表名拼错**这类真 bug。

**修复**：把 `runMigrations()` 移到 `ensureSchema()` 建表**之后**，然后删掉 `no such table` 分支，
让所有失败都真实抛出、可重试。

---

## 三、P1：迁移运行器的三个结构性缺陷

这三条同源，**"容错"变成了"静默损坏"**：

| #    | 位置                    | 问题                                                                                                                                            |
| ---- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-1 | `migrations.ts:530`     | 用 `MAX(version)` 判定已应用。删掉 v2/v3 两行后，max 仍是 17，**v2/v3 永不重跑**。一行记录损坏即永久禁用其下所有迁移。                          |
| P1-2 | `migrations.ts:536-553` | 表名写错 → 静默跳过 + 记 applied，无日志无告警。                                                                                                |
| P1-3 | `migrations.ts:594-613` | 17 条里 8 条（v6-v13）无 `down`。`rollbackLast` 取 max 处那��� —— 实测在当前库上直接抛 "Migration has no down function"，**回滚助手是死代码**。 |

**修复**：改用 `Set` 逐条判 `!applied.has(m.version)`；每条迁移补 `down`（无回滚语义就给带说明的显式抛错）。

---

## 四、P1：修复未推广到同类路径

### P1-4 `approve-timeglass` 缺日期校验，可无限刷分

`src/app/api/castle/approve-timeglass/route.ts:43-46` 用正则从申请文案抠出 `MM月DD日`，
**直接盖上当前年份**，既不校验"不能是未来"，也不限 30 天回溯。

对照：同目录的 `castle/confirm/route.ts:31-45` 和 `castle/use-item/route.ts:23-37`
**都**做了 格式 → 非未来 → `MAX_BACKFILL_DAYS=30` 三重校验，注释里还写清了被利用的后果。
第三个兄弟路由被漏掉了，而它调用的是同一个 `restoreDay`。

孩子可通过 `request-timeglass` 完全控制这段文案 → 补打卡 → 拿分/阳光/萌可，
且 `last_settled_day` 游标被回拨（`castle.ts:517`）。

**修复**：抽出共享 guard，三个路由统一调用。**根因是三个近乎重复的路由各自复制校验逻辑。**

### P1-5 经济写操作无限流

全仓库只有 **10/52** 个路由用了 `rateLimit`。遗漏的包括：

- `castle/grant` —— 无限制（单次上限 100，但可循环刷）
- `castle/gift-item` —— **既无限流也无上限**：`qty = qty + 1`（:27），可无限造时光沙漏
- `redeem` POST —— 无限制

对照 `castle/buy/route.ts:10`（5 次/10 秒）和 `children/route.ts:43` 都已刻意堵过。

---

## 五、P2：性能与数据一致性

- **`mistakes` 全表扫描**（实测 EXPLAIN）：`SCAN mistakes` + `USE TEMP B-TREE FOR ORDER BY`。
  现有索引 `idx_mistakes_child_due` 未覆盖 ORDER BY 的 `id` 兜底位。这是每次错题复习都跑的查询。
  补 `idx_mistakes_due_order(child_id, resolved, next_review, id)`。
- **`users(parent_id)` 无索引**（实测 `SCAN users`）—— 家长每次请求都查孩子列表。
- **`api/mistakes` 的 SELECT-then-INSERT**（:47-61）无事务无唯一约束 → 双击/重试产生重复错题行。
  同类问题项目里已经修过（`progress-store.ts:82`、`castle.ts:73`），只是没推广到这条路径。
- **`withWriteLock` 不等于事务**：`redeem:55-64`、`castle.buy:171` 在锁内做了多次写却无 `BEGIN/COMMIT`
  （对比 `castle.ts:84` 是有 BEGIN IMMEDIATE 的）。容器重启恰好落在中间 = 扣了币没发货。
- **`backup/route.ts:211` 的 `PRAGMA foreign_keys = OFF` 是连接级的**（实测），libSQL 本地单连接下全进程共享，
  恢复窗口内的读请求不受 `withWriteLock` 保护。且恢复外键的两个 `.catch(() => {})`（:268,:275）会静默失败。
- **所有外键都是 `NO ACTION`**（实测 `DELETE FROM users` 被拒）→ 孩子账号一旦有数据就永远删不掉，
  且 `api/children` 只有新增、没有删除路由。
- **cron settle 逐个孩子串行**（`cron/settle:20-27`），每个孩子还遍历所有未结算日，
  长期持有全局写锁；后随那次 SELECT 是纯浪费（`settleCastle` 已持有该行）。
- **`getCastleState` 每次渲染做 9 次查询 + 2 次写**（`castle.ts:565-606`），历史查询无 LIMIT。

---

## 六、P2：工程卫生（低风险高收益）

| 项                                     | 现状                                                                       | 建议                                                                          |
| -------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `pnpm typecheck` / `verify` / `format` | **均无脚本**                                                               | 补上。pre-commit 里的 `tsc` 和 CI 重复了三次                                  |
| `Suspense` 边界                        | 全仓库 **0 处**                                                            | 配合 `loading.tsx` 用起来，路由切换体验会明显改善                             |
| zod                                    | 是依赖，但**只在一个文件用到**，且是校验 LLM **输出**，输入侧 0 使用       | 至少给 `ai/generate` 的 7 个字段加 schema                                     |
| `ai/generate:80-84`                    | 把 provider 的 `error.message` 直接回给客户端，而 apiKey 正在作用域内      | 照 `parent/reset:116`、`backup:277` 的写法：服务端记日志，返回通用文案        |
| `tts-edge/route.ts:31`                 | 硬编码 token 兜底 `                                                        |                                                                               | '6A5AA1...'\`，`tts-debug:49` 重复 | 公开仓库里属于不该有的样子，照 `.env.example:69` 的 VAPID 做法删掉 |
| `children-validation.ts:44`            | 空密码 `parsePassword` 返回 `'123456'` → `{password:""}` 静默建弱口令账号  | 拒绝空值                                                                      |
| 6 处路由用裸 `req.json()`              | `castle/grant`、`gift-item`、`approve-timeglass`、`push/*3`、`ai/generate` | 换现成的 `safeJson`（`safe-json.ts:23` 就是为此写的），否则畸形 body 直接 500 |

---

## 六之二、前端性能：懒加载被自己抵消了（实测 A/B）

### P0-4 `splitChunks` 的 shared 分组抵消了全部懒加载 ⚠️ 最大的性能问题

`src/lib/study-modules.ts:9-21` 用 `next/dynamic` 懒加载了全部 70+ 学习模块，
注释写得很明确："每个模块独立 chunk，首屏只载当前模块"。**但它没生效。**

`next.config.mjs:52-61` 的 shared 分组会把**被 ≥3 个 chunk 引用的 src 模块**抽回一个公共 chunk：

```js
shared: {
  name: 'shared',
  test: /[\\/]src[\\/](lib|components)[\\/]/,
  minChunks: 3,          // ← 每个学习模块都 import 了 @/lib/study-data
  priority: 10,
}
```

`study-modules.ts` 把 70+ 模块注册在同一个注册表里，每个模块文件都被 3+ 个 chunk 引用，
于是全部被重新提回 eager chunk。**实测验证**（`react-loadable-manifest.json`）：

- 41 个 `dynamic()` 边界中，**37 个指向 shared chunk** —— 指向 eager 载荷的懒加载不叫懒加载
- 该 shared chunk **488 KB（gzip 后 127 KB）**，被 **42/105 条路由**首屏加载，包括 `/layout`、`/(child)/layout`
- 抽查内容确认：`col_01_` 出现 47 次、`col_02_` 76 次、`爱心萌可` 36 次 —— 萌可全量数据确实在里面
- `story/page.tsx:9` 为了拿一个 `img` 字段导入 62 KB 的 `by-name.ts`，
  而作者**已经生成好了** 13 KB 的精简子集 `moko-imgs.ts`，且同一文件第 7 行**已经在用它** —— 优化做了又被自己撤销

**A/B 实测（我改配置跑了两次完整构建对比）**：

|                            | 改前      | 去掉 shared 分组后      |
| -------------------------- | --------- | ----------------------- |
| shared chunk               | 488 KB    | **不存在**              |
| 指向 shared 的懒加载边界   | 37 / 41   | **0 / 41**              |
| `/layout` eager JS         | 906 KB    | **419 KB**              |
| `/(child)/algorithm`       | 916 KB    | **429 KB**              |
| 全站 105 条路由 eager 总计 | 59,298 KB | **43,139 KB（-27.3%）** |

**修复**：删掉 `next.config.mjs:52-61` 的 shared 分组（vendors 也建议把 minChunks 调高，
只保留 algorithm 分组）。若当初是为解决"爱心萌可出现在 15 个 chunk"的重复问题，
正确解法是**从源头治**——客户端改导入具体子模块而非 barrel，而不是抵消懒加载。

> 我的 `next.config.mjs` 已还原到原状（`git diff` 为空），上面只是验证，未留下改动。

**配套建议**：

- `ChineseModules.tsx`(618L) / `EnglishModules.tsx`(535L) / `ChineseNew.tsx`(527L)
  每个文件塞了 4-5 个**不相关**却分别懒加载注册的模块，webpack 按文件为单位 —— 懒加载 `CharacterQuizModule`
  仍会解析同文件的 `CharacterModule`+���PoemModule`+`TraceModule`。拆成一模块一文件后懒加载才真正有意义。
- `story/page.tsx:9` 去掉 `mokoCollectionByName`，改由 capture 接口返回 `emoji`/`line`。
- `(child)/record` 和 `(parent)/dashboard` 的 RSC 是 8 次**串行** await，同项目 `home/page.tsx:24` 已示范
  `Promise.all` 写法，对齐即可（record 页预计 8 RTT → 2）。

---

## 六之三、测试与 CI（低风险高收益）

- **E2E 形同虚设**（实测）：`ci.yml:184` 有 `continue-on-error: true`，且 `ci.yml:277` 只点名 3 个 spec，
  `learning.spec.ts` + `parent.spec.ts` 共 11 个用例**永不执行**；`build.yml:36` 只 `needs: precheck`，
  E2E 全红照样推镜像到 GHCR。删掉 `continue-on-error`、跑全部 5 个 spec、build job 加 `needs: [precheck, e2e]`。
- **限流器核心逻辑零测试**：`rate-limit.ts:95-99` 刻意取 XFF **最后一跳**（注释写明"取第一跳等于把限流 key 交给攻击者"）——
  这是一个**真实修过的安全漏洞**，但 `rateLimit()` 和 `getClientIp()` 全仓 grep **零用例**。补 3 个用例即可锁死回归。
- **40/52 条 API 路由无 handler 测试**，而 `vitest.config.ts:41` 把 `src/app/**` 整体排除出覆盖率，
  注释却称"路由层靠针对性测试直接调用导出的 handler 来保障"——实际只覆盖 23%。要么补 include，要么改注释别误导。
- **README 三处数字互相矛盾且全部过时**：`:119` 写"381 个用例 / 38 个测试文件"（实际 463/46）、`:190` 写"315 个用例"、
  `:191` 写"`pnpm seed` **重置数据库**"——**实测 scripts/seed.mjs 里 DROP/DELETE 命中数为 0**，
  它只补缺表缺账号，**绝不重置**。照 README 行事的人会误以为数据被清空。
- **Dockerfile:22 与配置自相矛盾**：容器构建里跑 `pnpm lint && npx tsc`，
  而 `next.config.mjs:20-21` 又开了 `ignoreDuringBuilds` / `ignoreBuildErrors`；且 CI 的 check job 已跑过两次。删掉即可。
- **`next lint` 已废弃**（实测会打印弃用告警，Next 16 将移除），eslint 8.57.1 也已停止维护。
- **Prettier 在 CI 零校验**（`grep prettier ci.yml` = 0 命中），只有 lint-staged 管暂存文件。
- **`security.yml` 注释已过时**：还在大段解释"Next.js **14.x** 的 8 个 high advisory"，
  但项目早已是 15.5.24，`check-audit.mjs` 的豁免表也已清空。删掉这段噪音。
- **4 个 zustand store 是死代码**：`src/lib/stores/index.ts` 251 行里 `useAuthStore`/`useChildPreferencesStore`/
  `useTTSStore`/`useCaptureStore` **零引用**，真实状态散落在 8 个文件各自的 localStorage 里。

---

---

## 七、明确**不是**问题的（避免误改）

- **WAL 文件被提交** —— 否。三个文件均未被 git 跟踪，`.gitignore:11,13,14` 正确覆盖，`PRAGMA integrity_check` = ok。
- **媒体服务路径穿越** —— 否。`serve-media.ts:159` 的 `path.resolve` + 前缀校验正确。
- **密码哈希泄露** —— 已修（唯一残留是 P0-1 的 sessions）。
- **IDOR** —— 无。`children/[id]/select:17` 等处均重新校验归属。
- **构建失败** —— 假警报。那是残留的 `.next` 目录；`rm -rf .next` 后构建成功（First Load 103 kB）。
- ~~**大数据包进客户端** —— 基本已解决~~ —— **这条我最初判断错了，见 P0-4：懒加载被 `splitChunks` 完全抵消。**
- **外部学习模块切换成 React 19** —— CI 里那条"Next 14 漏洞"豁免注释是过时的，项目已在 Next 15.5.24，
  建议重跑一次 `pnpm audit` 清理豁免清单。

---

## 八、建议执行顺序

1. ~~**P0-1/2/3/4**~~ → ✅ **本轮完成**（见第〇节）
2. ~~**P1-4/5/6/7**~~ → ✅ **本轮完成**（见第〇之二节）
3. ~~**P1-1/2/3**（索引 / 迁移回滚 / 事务原子性 / mistakes 去重）~~ → ✅ **本轮完成**（见第〇之三节）
   附带修掉 3 处 UTC/本地时区混用（1 处测试 + 2 处用户可见）
4. **下一步可选**：拆分 ChineseModules/EnglishModules/ChineseNew（懒加载才能真正生效）、
   记录页与家长看板的串行 await 改 Promise.all、去掉 story 页多余的 mokoCollectionByName
5. **仍未处理**：备份 `PRAGMA foreign_keys=OFF` 改事务级、40/52 路由无 handler 测试、
   README 三处错误数字、Dockerfile 重复 lint/tsc、4 个死 zustand store、`next lint` 迁移
6. **顺带**：补 `typecheck`/`verify`/`format` 脚本、加 Suspense、清掉硬编码 token 与裸 `req.json()`、
   修正 README 三处错误数字（尤其"seed 重置数据库"）、删 Dockerfile 里重复的 lint/tsc、删 4 个死 store
