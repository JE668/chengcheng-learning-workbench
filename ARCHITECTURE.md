# 架构文档

## 概览

本文档记录了程程学习工作台的重构架构设计，旨在提高代码质量、可维护性和开发体验。

---

## 核心架构层

```
src/
├── app/                    # Next.js App Router 页面
│   ├── (child)/           # 孩子端页面组
│   ├── (parent)/          # 家长端页面组
│   └── api/               # API 路由
├── components/
│   ├── ui/                # Design System 原子组件
│   ├── games/             # 游戏组件
│   ├── study/             # 学习模块组件
│   └── parent/            # 家长端专用组件
├── lib/
│   ├── db/                # 数据库层
│   │   ├── schema.ts      # Kysely 类型定义
│   │   └── kysely.ts      # Kysely 客户端
│   ├── repos/             # Repository 层（数据访问）
│   ├── dal/               # Data Access Layer（组合查询）
│   ├── stores/            # Zustand 状态管理
│   ├── tts/               # TTS 系统
│   │   ├── engines/       # 引擎实现
│   │   ├── orchestrator.ts # 编排器
│   │   └── types.ts       # 类型定义
│   ├── design-tokens.ts   # 设计令牌
│   └── hooks/             # 自定义 Hooks
└── hooks/                 # 通用 Hooks
```

---

## 数据层架构

### 1. Kysely 类型安全 ORM
- `src/lib/db/schema.ts` - 完整的数据库 Schema 类型定义
- `src/lib/db/kysely.ts` - libSQL 适配器 + 事务工具
- 编译期捕获 SQL 错误，IDE 自动补全

### 2. Repository 模式
每个业务领域一个 Repository：
- `user.repo.ts` - 用户管理
- `castle.repo.ts` - 城堡系统
- `task.repo.ts` - 任务/兑换/愿望
- `learning.repo.ts` - 学习进度/错题/故事

### 3. DAL (Data Access Layer)
- `dal/child.ts` - 孩子端组合查询
- `dal/parent.ts` - 家长端组合查询
- 页面组件仅调用 DAL，不直接操作 Repository

---

## 状态管理

### Zustand Stores (`src/lib/stores/index.ts`)
| Store | 用途 | 持久化 |
|-------|------|--------|
| `useAuthStore` | 认证状态 | ✅ |
| `useChildPreferencesStore` | 学习偏好/设置 | ✅ |
| `useTTSStore` | TTS 播放队列 | ❌ |
| `useCaptureStore` | 萌可捕捉动画 | ❌ |
| `useOfflineStore` | 离线同步队列 | ✅ |
| `useUIStore` | 全局 Loading/Toast/Modal | ❌ |

---

## UI 组件库

### Design Tokens (`src/lib/design-tokens.ts`)
统一的设计语言：
- **颜色**: 品牌色、语义色、萌可专属色
- **间距**: 4px 基准网格
- **圆角**: 4px - 32px
- **阴影**: 标准 + 萌可特色阴影
- **字体**: 显示/正文/等宽
- **动画**: 时长/缓动/预设
- **断点**: 响应式断点
- **Z-Index**: 分层规范

### 原子组件 (`src/components/ui/`)
| 组件 | 状态 | 特性 |
|------|------|------|
| Button | ✅ | 7变体、5尺寸、加载态、图标 |
| Card | ✅ | 5变体、可悬停、组合式 |
| Input/Textarea | ✅ | 3变体、3尺寸、错误/提示、图标 |
| Badge | ✅ | 8色调、4变体、4尺寸、可关闭 |
| Avatar | ✅ | 6尺寸、3形状、状态点、组 |
| Modal | ✅ | 焦点陷阱、ESC关闭、确认对话框 |
| Select | ✅ | 搜索、键盘导航、分组 |

---

## TTS 系统重构

### 三层降级策略
1. **Web Speech Strict** - 严格匹配 zh-CN/en-US
2. **Web Speech Loose** - 宽松匹配任意 zh/en 嗓音
3. **Edge TTS Server** - 服务端神经嗓音兜底

### 核心组件
- `TTSEngine` 接口 - 统一引擎契约
- `TTSOrchestrator` - 编排器 + 熔断器 + 指标收集
- `useTTS` Hook - React 集成 + 队列管理

---

## 测试策略

### 测试金字塔
| 层级 | 工具 | 覆盖目标 |
|------|------|----------|
| Unit | Vitest | 纯函数、算法、Store、Utils |
| Component | Vitest + RTL | UI 组件、交互逻辑 |
| Integration | Vitest + MSW | API、DAL、Repository |
| E2E | Playwright | 关键用户流程 |
| Visual | Playwright | 关键页面像素对比 |

### 运行命令
```bash
pnpm test           # 单元测试
pnpm test:ui        # Vitest UI
pnpm test:coverage  # 覆盖率报告
pnpm e2e            # E2E 测试
pnpm e2e:ui         # Playwright UI
```

---

## Storybook

### 启动
```bash
pnpm storybook      # 开发模式
pnpm build-storybook # 静态构建
```

### 组件分类
- **UI/** - Design System 原子组件
- **Games/** - 游戏组件
- **Study/** - 学习模块
- **Forms/** - 表单组合

---

## 代码规范

### Git Hooks (Husky)
- **pre-commit**: lint-staged (ESLint + Prettier + TypeCheck)
- **commit-msg**: commitlint (Conventional Commits)

### 提交规范
```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式
refactor: 重构
perf: 性能优化
test: 测试相关
chore: 构建/工具
revert: 回滚
build: 构建系统
ci: CI 配置
```

---

## 环境变量验证

使用 `@t3-oss/env-nextjs` + Zod：
- 构建时验证必填变量
- 类型安全的环境变量访问
- 客户端/服务端变量分离

---

## 性能优化

### Bundle 分析
```bash
pnpm analyze  # 生成 bundle 分析报告
```

### 关键指标预算
| 指标 | 目标 |
|------|------|
| LCP | < 2.5s |
| CLS | < 0.1 |
| INP | < 200ms |
| Bundle (gz) | < 150KB |

### 优化手段
- 动态导入游戏组件 (`next/dynamic`)
- 代码分包策略 (webpack splitChunks)
- 图片优化 (next/image)
- 字体预加载
- 服务端组件优先

---

## 部署

### Docker 多阶段构建
- 构建阶段: Node 22 + npm ci + build
- 运行阶段: Node 22 + Python + edge-tts
- 镜像大小 ~550MB (zstd 压缩)

### 环境变量
```env
TURSO_URL=libsql://xxx.turso.io
TURSO_AUTH_TOKEN=xxx
CRON_SECRET=xxx
NEXT_PUBLIC_APP_URL=https://xxx.com
```

---

## 迁移指南

### 从旧代码迁移
1. 页面组件 → 调用 DAL 而非直接 SQL
2. 组件类名 → 使用 UI 组件库
3. localStorage → 迁移到对应 Store
4. TTS 调用 → 使用 `useTTS` Hook
5. 手写 SQL → 使用 Repository

---

## 目录结构约定

```
src/
├── app/                    # 路由页面 (Server Components 优先)
├── components/
│   ├── ui/                # 通用原子组件
│   ├── [domain]/          # 业务组件
├── lib/
│   ├── db/                # 数据库核心
│   ├── repos/             # Repository (单表/领域操作)
│   ├── dal/               # DAL (多表组合查询)
│   ├── stores/            # 客户端状态
│   ├── [feature]/         # 领域逻辑
├── hooks/                 # 通用 Hooks
├── types/                 # 共享类型
└── styles/                # 全局样式
```

---

## 参考资源

- [Next.js App Router](https://nextjs.org/docs/app)
- [Kysely](https://kysely.dev/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Storybook](https://storybook.js.org/)