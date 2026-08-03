// 测试用环境变量：必须在任何 lib 模块（db-core 在 import 时读取 TURSO_URL）加载前设置好。
// 用内存库，保证每个测试进程隔离、不污染真实 local.db。
Object.assign(process.env, {
  TURSO_URL: 'file::memory:',
  NODE_ENV: 'test',
});
