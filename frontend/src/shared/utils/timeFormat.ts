/**
 * 时间格式化工具函数
 * 功能：提供时间相关的格式化功能
 */

/**
 * 格式化剩余时间
 * @param seconds 剩余秒数
 * @returns 格式化后的时间字符串（如：2时30分后、45秒后）
 */
export function formatRemaining(seconds: number): string {
  if (seconds <= 0) return ''
  
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  
  if (h > 0) return `${h}时${m}分后`
  if (m > 0) return `${m}分${s}秒后`
  return `${s}秒后`
}
