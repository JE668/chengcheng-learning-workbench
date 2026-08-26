export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复bug
        'docs',     // 文档更新
        'style',    // 代码格式（不影响功能）
        'refactor', // 重构（非新增功能、非修复bug）
        'perf',     // 性能优化
        'test',     // 测试相关
        'chore',    // 构建过程或辅助工具的变动
        'revert',   // 回滚
        'build',    // 构建系统变更
        'ci',       // CI配置变更
      ],
    ],
    'subject-case': [2, 'always', ['sentence-case', 'lower-case']],
    'subject-empty': [2, 'never'],
    'header-max-length': [2, 'always', 100],
  },
};