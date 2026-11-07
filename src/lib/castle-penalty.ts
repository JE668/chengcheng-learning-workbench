/**
 * 城堡结算兼容入口。
 *
 * 新代码可分别依赖 castle-settlement（逐日结算）与 castle-penalty-rule
 * （单日惩罚规则）；保留本文件避免既有路由和回归测试的导入路径变化。
 */
export { applyPenalty } from './castle-penalty-rule';
export { settleCastle } from './castle-settlement';
