// 本文件的存在本身就是目的：Next.js 约定 instrumentation.ts 会在服务端启动时执行
// register()，@sentry/nextjs 借此完成初始化（真正的配置在 sentry.server.config.ts）。
// 因此这里不需要 import 任何东西 —— 实际初始化并不发生在这个文件里。
export function register() {
  // 实际初始化在 sentry.server.config.ts，本函数留空即可。
}
