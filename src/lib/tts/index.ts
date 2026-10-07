/**
 * TTS 系统统一导出。
 *
 * 本目录曾包含一套与 `lib/speak.ts` 并行的三层降级实现（engines/ 三个引擎
 * + orchestrator 编排器）。两套并存导致重复维护与能力分叉（详见
 * orchestrator.ts 顶部说明），现已合并：
 *
 *   - **lib/speak.ts 是唯一的降级实现**（生产路径，55+ 文件在用），
 *     保留了长文本切分、keep-alive、服务端音频缓存等关键处理；
 *   - **orchestrator.ts 退化为薄适配层**，只为诊断页提供指标/熔断视图，
 *     内部委托 speak.ts，不再自建一套降级链。
 *
 * 因此原先的 engines/ 目录与 migration-guide.md 已删除（后者描述的迁移从未落地：
 * 指南里的 useTTS hook 至今没有实现，实际演进方向与指南相反）。
 */
export * from './types';
export * from './orchestrator';
