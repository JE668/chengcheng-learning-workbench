# 程程学习工作台 · 全面代码审查报告（2026-10-17 第二轮）

审查日期：2026-10-17 ｜ 范围：全仓库（66k LOC src/，52 条 API 路由）
对照基线：上一轮报告（2026-10-07，代码审查报告.md）
验证方式：Lead 亲自精读核心库与安全层 + 实测健康检查 + 构建产物硬核验证；
**遵循「不在本机做重验证」工作流**——本轮代码改动只做了一次零写入 `tsc --noEmit`，
其余全部推给 GitHub Actions（CI 基线：HEAD=8a022b7 的 Build+E2E 于 10-10 全绿，
每日 Security Scan 全绿）。

---

## 〇、结论速览

1. **上轮 P0×4 / P1×7 的修复全部真实落地**（逐条验证，见第一节），质量普遍超出报告声明——
   backup 路由还额外做了列名白名单防注入、家长密码确认、事务级 `defer_foreign_keys`。
2. **工程质量持续高于同规模项目**：917 单测全绿、typecheck/lint 零输出、构建产物验证
   懒加载真实生效（41 个 dynamic 边界 0 个指向 shared chunk，修复前为 37 个）。
3. **本轮新发现集中在「修复未推广到同类路径」**：settleCastle/castSpray/harvest/
   applyPenalty 四处仍缺事务或用绝对值写回。已于本轮全部修复并推送
   （bf8e17f），修复方式与既有 buy/redeem/confirm 完全同构。
4. 唯一 open 的 dependabot 警告（postcss-selector-parser，moderate）已升级（8e62511）。

---

## 一、上轮修复复核（全部 ✅）

| 旧编号 | 内容 | 本轮验证证据 |
| --- | --- | --- |
| P0-1 | 备份导出泄露 sessions | backup/route.ts:25-47 无 sessions；password_hash 列白名单 :54-63；超预期：导入需家长密码、defer_foreign_keys 事务级、PRAGMA 列名白名单 |
| P0-2 | 全站无 CSRF | middleware.ts:59-91（Sec-Fetch-Site 优先 → Origin/Host → ALLOWED_ORIGINS 逃生门）；csrf-middleware.test.ts 10 用例直调 middleware |
| P0-3 | 迁移运行器吞错 | migrations.ts:618-626 Set 逐条判定；schema.ts:256 建表后才 runMigrations |
| P0-4 | splitChunks 抵消懒加载 | shared 分组已删；**构建产物实测**：react-loadable-manifest 41 边界 0 指向 shared；最大 chunk 431KB（pdfjs 懒加载库），488KB shared chunk 消失 |
| P1-1/2/3 | 索引 / 迁移 down / 事务原子性 | v18 迁移带真实 down；buy/redeem/confirm 均 BEGIN IMMEDIATE |
| P1-4 | approve-timeglass 日期校验 | src/lib/backfill-date.ts 唯一实现，confirm/use-item/approve-timeglass 三路由共用 |
| P1-5 | 经济接口限流 | grant 20/min、gift-item 20/min、redeem 10/min 实测在路由内 |
| P1-6 | 限流器零测试 | rate-limit-core.test.ts 27 用例 + rate-limit.test.ts |
| P1-7 | E2E 形同虚设 | ci.yml:189 e2e-gate job（needs [check, e2e] + if always() 显式判定），continue-on-error 已删，5 spec 全跑 |
| P2 时区 | 3 处 UTC/本地混用 | CheckinCalendar.tsx:40、castle/page.tsx:608/636 均走 dateStr()/addDays() |
| P2 mistakes 竞态 | SELECT-then-INSERT | mistakes/route.ts:62-96 withWriteLock + BEGIN IMMEDIATE，注释解释了为何 UNIQUE 约束不适用 |

---

## 二、本轮新发现与处置

### 已修复并推送（bf8e17f）——P1 级：经济一致性

| # | 位置 | 问题 | 处置 |
| --- | --- | --- | --- |
| 1 | castle-penalty.ts settleCastle | 最多 30 天的补结算循环无事务：崩溃（NAS 断电/docker 重启）后 last_settled_day 未推进 → 重启后**同一天二次惩罚**（捣蛋翻倍、重复藏币、重复消耗冰冻徽章） | 循环包进 BEGIN IMMEDIATE/COMMIT（settleLocked） |
| 2 | castle-penalty.ts applyPenalty | 读 star_coins → 内存计算 → **绝对值写回**：结算期间家长经 grantResource（不持锁）送币会被旧值覆盖丢失 | 改增量 UPDATE（star_coins = star_coins - ?），护盾同理 |
| 3 | castle.ts castSpray | 清捣蛋→还币→推游标→扣道具 5 步写在锁内但无事务：崩溃组合出「捣蛋清了喷雾没扣」（白嫖）或「币加了游标没推进」（重复找回） | 5 步收进事务 |
| 4 | castle.ts harvest | 加币与逐只 last_harvest_day 标记两步写无事务 + N 次 UPDATE：崩溃后同批萌可**重复收币** | 收进事务，且 N 只合并一条 IN(...) UPDATE |

> 修复刻意与仓库既有模式同构（withWriteLock 解决并发、BEGIN/COMMIT 解决崩溃），
> 未引入新抽象。#2 顺带消除了 applyPenalty 里的 `any`（getMokoName 参数）之外的坏味道。

### 已修复并推送（8e62511）——dependabot #52

postcss-selector-parser 6.1.4 → 7.1.6（二次复杂度 CPU 耗尽，moderate）。
构建期工具链传递依赖，不进运行时。pnpm-workspace.yaml 与 package.json 双源覆盖
（CI 的 pnpm 10 读 package.json，本地 pnpm 11 读 workspace yaml）。

### 遗留观察项处置进展（第三批优化，2026-10-17 同日第二批推送）

| 项 | 处置 | 提交 |
| --- | --- | --- |
| P2 · grantResource 不持锁 | ✅ 已纳入 withWriteLock（castle.ts:361） | 73e61d8 |
| P2 · daily-practice 里程碑无事务 | ✅ 锁内多步写包进 BEGIN/COMMIT | 73e61d8 |
| P2 · applyTimeGlass 非原子 | ⚠️ 尝试事务化时发现 **restoreDay→confirm 链路自带 withWriteLock+BEGIN，锁不可重入会死锁**。维持原两段式（原子扣减+补偿 UPDATE），死锁成因写入注释，SIGKILL 窗口记录为架构限制。后续若要根治，需先抽「不持锁版 confirm 内层」 | 73e61d8（注释） |
| P3 · dateStr 5 处重复实现 | ✅ 全部委托 lib/date.ts 唯一出口（lib/mistakes.ts、api/mistakes/route.ts、lib/sm2.ts），导出面保留 | 3ce0b0e |
| P3 · README 测试数字漂移 | ✅ 改「900+」+「以 CI badge 为准」 | 9356b03 |
| P3 · playwright webServer 用 pnpm dev | 未动：改生产构建会显著拉长 E2E 反馈环，收益存疑，暂记录 | — |
| P3 · tasks 表无归属字段 | 未动：产品决策（多娃任务分配），非缺陷 | — |
| P3 · 测试环境备注 | 保留：DSH 打包 node 的 codesign 问题与项目无关 | — |

### 遗留观察项（原始清单，按优先级，含未处置项）

- **P2 · grantResource 仍不持锁**（castle.ts:337）：单语句原子，但与 withWriteLock
  内多步写并发交错时仍有一瞬间读到中间态。彻底修法是统一「所有写路径要么持锁要么
  单语句」，或给 castle_state 引擎层加条件 UPDATE。本轮 #2 的增量写回已消掉最疼的
  覆盖丢失场景，剩余是理论窗口。
- **P2 · daily-practice 里程碑多步写无事务**（daily-practice/index.ts:373-423）：
  锁内已防并发双发，但崩溃在「+10 币」与「streak_rewarded=1」之间会双倍发币。
  与本轮四处同构，修法相同（包 BEGIN/COMMIT），留待下一轮批量处理。
- **P2 · applyTimeGlass 扣道具与补打卡非原子**（castle.ts:401-438）：异常路径有
  补偿 ✅，SIGKILL/断电窗口无补偿 → 沙漏丢失。窗口极小。
- **P3 · dateStr 5 处重复实现**：api/mistakes/route.ts:6、sm2.ts:131-146、
  mistakes.ts:24/150（backup.ts:47 带时间戳用途不同可豁免）。行为均正确，
  但 date.ts 注释自称「全仓唯一出口」——复制正是当年时区 bug 反复的根源。
- **P3 · playwright webServer 用 `pnpm dev`**：E2E 门禁跑在开发服务器上，
  生产 standalone 行为另有 next build 的 precheck 兜底，但门禁代表性可以更强。
- **P3 · tasks 表无归属字段**（schema.ts:53-62）：多娃家庭任何孩子可领任何任务的分。
  单娃家庭无感；要支持需加 assigned_to + 迁移 + 路由过滤，属产品决策。
- **P3 · 测试环境备注**：本机 node 为 DSH 打包版（Team ID + hardened runtime），
  rollup darwin-arm64 原生库需 ad-hoc 重签 node 才能加载——是环境问题不是项目问题，
  记录在此避免下位审查者重复踩坑。

---

## 三、审查过且明确没问题的（避免误改）

- **login 路由**：IP 限流 + 账号锁定 + DUMMY_HASH 防时序枚举 + ensureDbReady 冷启动
  （login/route.ts:19-79），教科书级。
- **serve-media.ts:156-159**：路径穿越防护（resolve + 前缀校验 + decode try/catch）。
- **auth.ts**：32 字节随机 token、读取时复检过期、httpOnly+lax、secure 三态配置
  （历史 bug 的注释与修复俱在）。
- **db-core.ts withWriteLock**：Promise 队列互斥，异常不卡队列。
- **rate-limit.ts**：XFF 末跳（防伪造头绕过）、容量上限 + 淘汰、账号锁定、测试 reset。
- **story.ts buildAutoQuiz**：确定性种子出题，shuffleQuiz 防固定答案位。
- **tasks/[id]/complete**：NaN/Infinity 防护 + 原子防重放（WHERE NOT EXISTS）。
- **progress-store.ts**：全部单语句原子 upsert。
- **castle.restoreDay**：游标只进不退（B7 历史修复），注释完整。
- **getCastleState**：9 查询已并行（Promise.all），历史查询 LIMIT 30。
- **sm2.ts**：标准 SM-2 变体，T00:00:00 本地解析正确。

## 四、测试质量抽查

- csrf-middleware.test.ts：直调 middleware、最小 mock 面、真实攻击形态
  （evil.com 表单 / text/plain 简单请求）。
- 测试文件名即回归清单：idor / cron-authz / economy-guards / backfill-date /
  backup-credentials / castle-confirm-validation / castle-freeze 全覆盖。
- 917 用例 / 116 文件 / 4.18s；E2E 36 用例 5 浏览器工程，CI 重试 2 次。

## 五、建议的下一轮工作

1. daily-practice 里程碑 + applyTimeGlass 的事务补齐（与本轮 #1-4 同构，半小时的活）。
2. dateStr 重复实现的收口（5 处 → 全走 lib/date.ts，纯机械替换）。
3. README「工程卫生」段落更新：917 测试数已与 :119 的旧数字再次脱节
   （上轮报告就提过数字漂移，写 README 时建议改为「以 CI badge 为准」避免每次手动同步）。
4. grantResource 纳入统一写锁（或文档化「单语句写路径」豁免清单）。
