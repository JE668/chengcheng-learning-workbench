# API 安全核查清单（鉴权 / 越权）

> 生成时间：2026-07-31
> 范围：`src/app/api/**` 全部 21 条路由
> 核查方式：逐文件阅读路由实现，确认「是否登录」与「是否按归属收敛」。

## 结论

- ✅ 全部 21 条路由都调用了 `getCurrentUser()`，无裸奔（未登录即可改数据的）接口。
- ✅ 所有**孩子端**接口都按 `child_id = user.id` 查询/写入，孩子之间天然隔离，**无横向越权**。
- 🔧 发现并修复 2 处**纵向越权**（家长凭客户端传入的 `id` 操作任意记录）：
  1. `tasks/[id]` PATCH/DELETE —— 已加 `created_by = user.id` 归属校验。
  2. `redeem` PATCH —— 已改为 `WHERE id = ? AND child_id = ?`（child 取自 `resolveChildId(user)`，非客户端传入）。
- ⚠️ 家长操作孩子数据的「当前孩子」恒取 `getChildId()`（第一个孩子）。单孩子无碍；**多娃扩展（任务 #143）时需改为「选中的孩子」**，统一入口即 `auth.ts` 的 `resolveChildId()`。

## 逐路由明细

| 路由 | 方法 | 鉴权 | 归属收敛 | 备注 |
|---|---|---|---|---|
| `/api/auth/login` | POST | 公开（登录本身） | — | 校验密码哈希 |
| `/api/auth/logout` | POST | 公开 | — | 清 session |
| `/api/tasks` | GET | ✅ | 孩子看全部任务；家长看全部 | 任务全局，非按孩子 |
| `/api/tasks` | POST | ✅ 仅 parent | 写入 `created_by=user.id` | |
| `/api/tasks/[id]` | PATCH | ✅ 仅 parent | 🔧 `created_by=user.id` | 已修复 |
| `/api/tasks/[id]` | DELETE | ✅ 仅 parent | 🔧 `created_by=user.id` | 已修复 |
| `/api/tasks/[id]/complete` | POST | ✅ 仅 child | `child_id=user.id` | 唯一约束防重复领 |
| `/api/tasks/game-complete` | POST | ✅ 仅 child | `child_id=user.id` | |
| `/api/mistakes` | GET | ✅ | `child_id=user.id` | |
| `/api/mistakes` | POST | ✅ 仅 child | `child_id=user.id` | 落错题 |
| `/api/mistakes/review` | POST | ✅ 仅 child | `WHERE id=? AND child_id=?` | 已按归属查 |
| `/api/redeem` | GET | ✅ | 孩子看自己；家长看全部 | 家长分支多娃时需收敛到选中孩子 |
| `/api/redeem` | POST | ✅ 仅 child | `child_id=user.id` | |
| `/api/redeem` | PATCH | ✅ 仅 parent | 🔧 `child_id=resolveChildId` | 已修复 |
| `/api/castle/state` | GET | ✅ | `child_id = 角色解析` | |
| `/api/castle/badges` | GET | ✅ | `child_id = 角色解析` | |
| `/api/castle/diary` | GET | ✅ | `child_id = 角色解析` | |
| `/api/castle/buy` | POST | ✅ 仅 child | `child_id=user.id` | |
| `/api/castle/checkin` | POST | ✅ 仅 child | `child_id=user.id` | |
| `/api/castle/harvest` | POST | ✅ 仅 child | `child_id=user.id` | |
| `/api/castle/skin` | POST | ✅ | `child_id = 角色解析` | |
| `/api/castle/use-item` | POST | ✅ 仅 child | `child_id=user.id` | |
| `/api/castle/confirm` | POST | ✅ 仅 parent | `child_id=getChildId()` | |
| `/api/story/progress` | GET | ✅ | `child_id=user.id` | |
| `/api/story/capture` | POST | ✅ 仅 child | `child_id=user.id` | `chapterId` 经白名单校验 |
| `/api/child/cert-pref` | GET/POST | ✅ | `user.id` | |
| `/api/child/password` | POST | ✅ | `user.id` | |
| `/api/cron/settle` | POST | 🔑 `CRON_SECRET` | `child_id=getChildId()` | 非 session，由 Vercel Cron 带密钥调用 |

## 后续建议（多娃前必做）

1. 把所有家长分支的 `getChildId()` 统一替换为 `resolveChildId(user)`，并在会话里记录「选中的孩子」。
2. 新增路由时，首行统一走 `requireParent()/requireChild()` + 客户端传入的 `id` 必须回查归属。
3. 若想进一步收紧，可把 `requireParent/requireChild` 包成中间件，未通过直接 401/403。
