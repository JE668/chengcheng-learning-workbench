/**
 * 统一日志工具
 * - 按环境控制输出级别
 * - 生产环境仅输出 warn/error
 * - 开发环境输出所有级别
 * - 支持结构化日志（对象、错误对象）
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    // 生产环境默认只输出 warn/error，开发环境输出所有
    this.minLevel = this.isDevelopment ? 'debug' : 'warn';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    let formatted = `${prefix} ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      formatted += ` ${JSON.stringify(context)}`;
    }
    
    if (error) {
      formatted += ` | Error: ${error.message}`;
      if (error.stack && this.isDevelopment) {
        formatted += `\n${error.stack}`;
      }
    }
    
    return formatted;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) return;
    
    const formatted = this.formatMessage(level, message, context, error);
    
    // 使用对应的 console 方法，便于浏览器 DevTools 过滤
    switch (level) {
      case 'debug':
        console.debug(formatted);
        break;
      case 'info':
        console.info(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.log('warn', message, context, error);
  }

  error(message: string, context?: Record<string, unknown>, error?: Error): void {
    this.log('error', message, context, error);
  }

  // 设置最小日志级别（运行时动态调整）
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  // 创建子 logger，自动带上 context
  child(context: Record<string, unknown>): Logger {
    const childLogger = new Logger();
    childLogger.minLevel = this.minLevel;
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level, message, ctx, error) => {
      originalLog(level, message, { ...context, ...ctx }, error);
    };
    return childLogger;
  }
}

// 单例导出
export const logger = new Logger();

// 便捷导出
export const { debug, info, warn, error } = logger;

// 兼容旧 console.* 调用的迁移助手
export const consoleShim = {
  log: (...args: unknown[]) => logger.info(args.map(String).join(' ')),
  info: (...args: unknown[]) => logger.info(args.map(String).join(' ')),
  warn: (...args: unknown[]) => {
    const error = args.find(a => a instanceof Error);
    const rest = args.filter(a => !(a instanceof Error));
    logger.warn(rest.map(String).join(' '), undefined, error);
  },
  error: (...args: unknown[]) => {
    const error = args.find(a => a instanceof Error);
    const rest = args.filter(a => !(a instanceof Error));
    logger.error(rest.map(String).join(' '), undefined, error);
  },
  debug: (...args: unknown[]) => logger.debug(args.map(String).join(' ')),
};