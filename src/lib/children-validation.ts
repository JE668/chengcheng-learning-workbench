/**
 * 创建孩子账号的入参校验（lib/children-validation.ts）。
 *
 * 单独成模块，与 lib/tasks-validation.ts 同理：安全口径一旦在路由里内联，
 * 日后改一处忘一处就会出现不一致。
 */

/** 密码长度区间：下限保证不是弱口令，上限防超长输入拖垮 bcrypt（纯 JS 实现）。 */
export const MIN_CHILD_PASSWORD = 6;
export const MAX_CHILD_PASSWORD = 72; // bcrypt 只取前 72 字节，超过无意义
export const DEFAULT_CHILD_PASSWORD = '123456';

/** 用户名：字母/数字/下划线/中文，1~20 字符。 */
export const USERNAME_PATTERN = /^[A-Za-z0-9_一-龥]{1,20}$/;

/** 昵称：允许更多字符（含 emoji、空格），但限长并禁止控制字符。 */
export const MAX_DISPLAY_NAME = 20;

/**
 * 校验并规范化用户名。
 * 原本只做 trim + 非空校验，emoji、控制字符、超长串都能写进库，
 * 而这些值会出现在登录表单与**证书打印页**上。
 */
export function parseUsername(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const v = raw.trim();
  if (!USERNAME_PATTERN.test(v)) return null;
  return v;
}

/** 校验并规范化昵称；含控制字符或超长返回 null。 */
export function parseDisplayName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const v = raw.trim();
  if (!v || v.length > MAX_DISPLAY_NAME) return null;
  // 控制字符（换行、制表符等）会让证书打印排版错乱
  if (/[\u0000-\u001f\u007f]/.test(v)) return null;
  return v;
}

/** 校验密码；不合法返回 null。空密码返回默认口令（由调用方显式决定是否启用）。 */
export function parsePassword(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  if (!raw) return DEFAULT_CHILD_PASSWORD;
  if (raw.length < MIN_CHILD_PASSWORD || raw.length > MAX_CHILD_PASSWORD) return null;
  return raw;
}
