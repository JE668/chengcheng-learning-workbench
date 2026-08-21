/**
 * 经济系统常量集中地。
 *
 * 之前这些数值散落在 moko.ts（PROSPERITY_BONUS 等）、castle.ts（buy 里硬编码 5/10）、
 * daily-practice.ts（MILESTONE_DAYS），改价/调平衡要到处找。统一收口到这里，
 * 所有相关模块从本文件导入，行为不变。
 */


/** 单科打卡奖励的阳光能量 */
export const SUN_PER_SUBJECT = 1;
/** 集齐三科额外繁荣度 */
export const PROSPERITY_BONUS = 5;
/** 成为好朋友后每日可收获的星星币 */
export const STAR_PER_FRIEND = 5;
/** 护盾兑换所需连续打卡天数 */
export const SHIELD_STREAK_REQ = 3;
/** 捕捉券：每日一练每确认一科发放 1 张（线索提示用，实际发放在 castle.confirm） */
export const TICKET_PER_SUBJECT = 1;

/** 每日一练每确认一科打卡发的积分（三科全对共 30） */
export const POINTS_PER_CHECKIN = 10;
/** 捕捉一只剧情萌可发的积分 */
export const POINTS_PER_CAPTURE = 10;

/** 魔法商店（阳光能量消费）购买价 */
export const COST_SPRAY = 5;
export const COST_SHIELD = 10;
export const COST_FREEZE = 8;

/** 时光沙漏（星星币购买，使用后可补打卡一天） */
export const COST_TIMEGLASS = 15;

/** 连续一练「额外萌可」里程碑（天数）。见 daily-practice.ts 设计说明。 */
export const MILESTONE_DAYS = [2, 3, 4, 5, 6, 7, 10, 14, 21, 30, 45, 60, 90];

/** 便于校验「某 key 是否属于可购买的星星币商城皮肤」等。 */
export const STAR_SHOP_SKINS = ['skin_star', 'skin_candy'];