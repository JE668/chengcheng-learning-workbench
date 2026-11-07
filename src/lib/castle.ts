/**
 * 城堡领域公共入口。
 *
 * 内部按职责拆分，调用方继续只依赖 `@/lib/castle`：
 *   - castle-core：城堡/萌可基础读写、成长与连胜
 *   - castle-penalty：逐日结算与惩罚阶梯
 *   - castle-rewards：打卡确认和发奖事务
 *   - castle-shop：商城购买、护盾兑换和皮肤
 *   - castle-items：喷雾、资源赠送、时光沙漏及收获
 *   - castle-state：页面聚合状态与勋章
 *
 * 角色鉴权、父子账号边界与日期校验仍留在 API 路由层，避免业务模块
 * 在缺少请求上下文时重复或绕过 HTTP 边界检查。
 */

export { getGrowthDiary, getMokoProgress, logGrowthEvent, STAGE_LABEL } from './castle-core';
export type { BadgeItem, CastleStateView, MokoStage } from './castle-types';

export { confirm } from './castle-rewards';
export { buy, setSkin } from './castle-shop';
export { applyTimeGlass, castSpray, grantResource, harvest, restoreDay } from './castle-items';
export { getBadges, getCastleState } from './castle-state';
