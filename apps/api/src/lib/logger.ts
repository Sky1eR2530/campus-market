export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
}

let threshold = LEVEL_WEIGHT.info

export function setLogLevel(level: LogLevel): void {
  threshold = LEVEL_WEIGHT[level]
}

type Meta = Record<string, unknown>

/**
 * 极简结构化日志：一行一条，包含时间、级别、消息和结构化字段。
 * 不引入日志库——这个规模的项目用不上，等真的需要按级别分流或接入
 * 日志采集时再替换实现即可，调用方不受影响。
 */
function write(level: LogLevel, message: string, meta?: Meta): void {
  if (LEVEL_WEIGHT[level] < threshold) return

  const timestamp = new Date().toISOString()
  const suffix = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''
  const line = `${timestamp} ${level.toUpperCase().padEnd(5)} ${message}${suffix}`

  if (level === 'error' || level === 'warn') {
    console.error(line)
  } else {
    console.log(line)
  }
}

export const logger = {
  debug: (message: string, meta?: Meta): void => write('debug', message, meta),
  info: (message: string, meta?: Meta): void => write('info', message, meta),
  warn: (message: string, meta?: Meta): void => write('warn', message, meta),
  error: (message: string, meta?: Meta): void => write('error', message, meta)
}
