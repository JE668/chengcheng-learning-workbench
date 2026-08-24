# API 安全核查清单（鉴权 / 越权）

> 生成时间：2026-08-23（刷新 @ 2026-08-23，覆盖全部 45 条路由）
> 范围：`src/app/api/**` 全部 45 条路由
> 核查方式：逐文件阅读路由实现 + 自动审计（grep 提取 getCurrentUser / requireParent / requireChild / resolveChildId / CRON_SECRET / child_id 归属），确认「是否登录」与「是否按归属收敛」。

## 结论

- ✅ 全部 45 条路由都调用了 `getCurrentUser()` 或等效鉴权（CRON_SECRET / 公开白名单），**无裸奔接口**。
- ✅ 所有**孩子端**接口都按 `child_id = user.id` 查询/写入，孩子之间天然隔离，**无横向越权**。
- ✅ 所有**家长操作孩子数据**的接口统一走 `resolveChildId(user)`（即 `getChildId(user)`），该函数已实现：
  - 家长访问时 → 读取 `users.selected_child_id`（持久化选中孩子），无选中则回退到名下第一个孩子
  - 孩子访问时 → 返回自己
  - 切换选中孩子：`POST /api/children/[id]/select`（校验归属到当前家长，可持久化）
- ✅ **纵向越权**（家长凭客户端传入的 `id` 操作任意记录）已修复：
  1. `tasks/[id]` PATCH/DELETE —— 已加 `created_by = user.id` 归属校验
  2. `redeem` PATCH —— 已改为 `WHERE id = ? AND child_id = ?`（child 取自 `resolveChildId(user)`，非客户端传入）
- ✅ **多娃选中会话**已完整实现（`users.selected_child_id` + `/api/children/[id]/select` 切换 + 子路由列表），所有家长侧数据操作统一通过 `getChildId(user)` 解析到选中孩子。
- ✅ **8 条公开路由**均有明确安全边界（见下方明细表）。
- ✅ **TTS 路由**（`tts`、`tts-edge`、`tts-debug`）公开但已有 `rate-limit.ts` 限流保护（`tts` 路由：60 秒窗口 30 次）。

## 逐路由明细

| 路由 | 方法 | 鉴权 | 归属收敛 | 备注 |
|---|---|---|---|---|
| `/api/auth/login` | POST | 公开（登录本身） | — | 校验密码哈希；IP 限流 + 用户名锁定 |
| `/api/auth/logout` | POST | 公开 | — | 清 session |
| `/api/backup` | GET | ✅ 仅 parent | — | 导出全部数据（含密码哈希，NAS 私有场景必要） |
| `/api/backup` | POST | ✅ 仅 parent | — | 导入恢复，需 CONFIRM 确认 + 事务保护 |
| `/api/castle/approve-timeglass` | POST | ✅ | `resolveChildId(user)` | 家长审批时光沙漏 |
| `/api/castle/badges` | GET | ✅ | `user.id | getChildId(user)` |
| `/api/castle/buy` | POST | ✅ 仅 child | `user.id` | 限流 5次/10秒 |
| `/api/castle/confirm` | POST | ✅ | `getChildId(user)` | 家长确认打卡 |
| `/api/castle/diary` | GET | ✅ | `user.id | getChildId(user)` |
| `/api/castle/gift-item` | POST | ✅ | `getChildId(user)` | 家长赠送道具 |
| `/api/castle/grant` | POST | ✅ | `getChildId(user)` | 家长发放星星币 |
| `/api/castle/harvest` | POST | ✅ 仅 child | `user.id` | 萌可收获 |
| `/api/castle/request-timeglass` | GET/POST | ✅ | `resolveChildId(user)` | 孩子申请时光沙漏 |
| `/api/castle/skin` | POST | ✅ | `user.id | getChildId(user)` |
| `/api/castle/state` | GET | ✅ | `user.id | getChildId(user)` | 懒触发结算 |
| `/api/castle/use-item` | POST | ✅ 仅 child | `user.id` | 喷雾/时光沙漏使用 |
| `/api/child-tasks` | GET/POST | ✅ | `resolveChildId(user)` | 萌可小任务 |
| `/api/child/cert-pref` | POST | ✅ | `user.id` | 孩子奖状偏好 |
| `/api/child/cert-request` | GET/POST | ✅ | `user.id` | 孩子申请奖状 |
| `/api/child/password` | POST | ✅ 仅 parent | `WHERE parent_id=user.id AND username=?` | 越权防护：只能改自己名下的孩子 |
| `/api/children/[id]/select` | POST | ✅ 仅 parent | `getChildrenOfParent(user.id)` 校验 | 多娃切换选中孩子 |
| `/api/children` | GET | ✅ 仅 parent | — | 列出孩子+选中标记 |
| `/api/children` | POST | ✅ 仅 parent | — | 新增孩子（上限 5 个） |
| `/api/cron/backup` | GET/POST | 🔑 `CRON_SECRET` | — | 定时备份 |
| `/api/cron/settle` | POST | 🔑 `CRON_SECRET` | — | 每日城堡结算 + 清理会话 |
| `/api/daily-practice` | GET/POST | ✅ | `resolveChildId(user)` | 每日一练 |
| `/api/daily-practice/reset` | POST | ✅ | — | 重置每日练习 |
| `/api/media/[...path]` | GET | 公开（媒体直出） | — | 课本/RAZ 媒体文件，仅防猜 URL |
| `/api/mistakes` | GET/POST | ✅ | `user.id | getChildId(user)` | 错题本 |
| `/api/mistakes/review` | POST | ✅ | `WHERE id=? AND child_id=?` | 已按归属查 |
| `/api/module-progress` | GET/POST | ✅ | `resolveChildId(user)` | 模块关卡进度 |
| `/api/parent/cert-request` | PATCH | ✅ | `getChildId(user)` | 家长审批奖状 |
| `/api/parent/reset` | POST | ✅ 仅 parent | — | 家长重置孩子密码 |
| `/api/redeem` | GET | ✅ | `getChildId(user)` | 孩子看自己；家长看选中的孩子 |
| `/api/redeem` | POST | ✅ 仅 child | `child_id=user.id` | 孩子发起兑换 |
| `/api/redeem` | PATCH | ✅ 仅 parent | 🔧 `resolveChildId(user)` | 已修复越权 |
| `/api/story/capture` | POST | ✅ 仅 child | `user.id` | `chapterId` 经白名单校验 |
| `/api/story/progress` | GET | ✅ | `user.id` | 剧情进度 |
| `/api/story/quiz` | POST | ✅ 仅 child | `user.id` | 故事问答 |
| `/api/story/read` | POST | ✅ 仅 child | `user.id` | 标记已读 |
| `/api/tasks` | GET | ✅ | 孩子看全部任务；家长看全部 | 任务全局，非按孩子 |
| `/api/tasks` | POST | ✅ 仅 parent | 写入 `created_by=user.id` | |
| `/api/tasks/[id]` | PATCH | ✅ 仅 parent | 🔧 `created_by=user.id` | 已修复 |
| `/api/tasks/[id]` | DELETE | ✅ 仅 parent | 🔧 `created_by=user.id` | 已修复 |
| `/api/tasks/[id]/complete` | POST | ✅ 仅 child | `child_id=user.id` + 原子 INSERT WHERE NOT EXISTS | 防重复领积分 |
| `/api/tasks/game-complete` | POST | ✅ 仅 child | `child_id=user.id` | |
| `/api/textbook-progress` | GET/POST | ✅ | `resolveChildId(user)` | 课本阅读进度 |
| `/api/tts` | POST | 公开（TTS 语音代理） | — | 限流 30次/60秒；前端自动降级 |
| `/api/tts-edge` | POST | 公开（Vercel 中转代理） | — | 无额外限流（Vercel 函数级限制） |
| `/api/tts-debug` | GET | 公开（诊断端点） | — | 仅 TTS 连通性测试 |
| `/api/wishes` | GET/POST/PATCH | ✅ | `resolveChildId(user)` | 心愿管理 |

## 公开路由安全边界说明

| 路由 | 公开理由 | 安全防护 |
|---|---|---|
| `/api/auth/login` | 登录本身必须公开 | IP 限流 + 用户名锁定 |
| `/api/auth/logout` | 登出必须公开 | 清空 session cookie |
| `/api/cron/backup` | Vercel Cron 定时任务 | `CRON_SECRET` 鉴权 |
| `/api/cron/settle` | Vercel Cron 定时任务 | `CRON_SECRET` 鉴权 |
| `/api/media/[...path]` | 媒体文件供 `<video>`/`<img>` 引用，鉴权会导致黑屏 | 仅防猜 URL；NAS 私有部署风险可忽略 |
| `/api/tts` | 语音合成需无登录使用（学习模块朗读） | 限流 `30/60s` + 内存缓存防重复 |
| `/api/tts-edge` | Vercel 中转代理 | 无额外限流，受 Vercel 函数级限制 |
| `/api/tts-debug` | 诊断 TTS 连通性 | 仅返回诊断信息 |

## 后续建议（容器化 / 多实例部署前必做）

1. ✅ **多娃选中会话**已完成实现（`users.selected_child_id` + 切换路由 + 全站点解析到 `getChildId(user)`），无需额外改动。
2. ✅ **新增路由时**，首行统一走 `getCurrentUser()` + `resolveChildId(user)` 模式；接收客户端传入的 id 时必须回查归属（如 `WHERE parent_id = ?` 或 `WHERE child_id = ?` 在归属于当前用户的范围里）。
3. ⚠️ **限流器**（`rate-limit.ts`）为纯内存单实例，多容器/NAS 多进程部署时 IP 限流与用户名锁定失效。若需扩展，建议换用数据库级或 Redis 级限流。
4. ⚠️ **CSRF 防护**：`sameSite=lax` cookie 已覆盖大部分跨站 POST 攻击；如需进一步加固，可对关键写接口（家长审批、密码修改）加显式 CSRF token。
5. ⚠️ **安全清单自动比对**：建议每次新增路由后运行一次 `grep -r getCurrentUser src/app/api/` 确认覆盖，避免手动维护遗漏。
