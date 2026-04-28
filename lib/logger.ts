/**
 * Structured Logger for Velocity Platform
 * 
 * Outputs JSON in production for easy parsing by log aggregators.
 * Pretty-prints in development for readability.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  path?: string
  statusCode?: number
  duration?: number
  error?: string
  stack?: string
  meta?: Record<string, unknown>
}

const IS_PROD = process.env.NODE_ENV === 'production'

function formatEntry(entry: LogEntry): string {
  if (IS_PROD) {
    return JSON.stringify(entry)
  }
  // Dev: human-readable
  const parts = [
    `[${entry.level.toUpperCase()}]`,
    entry.timestamp,
    entry.message,
  ]
  if (entry.path) parts.push(`path=${entry.path}`)
  if (entry.statusCode) parts.push(`status=${entry.statusCode}`)
  if (entry.duration != null) parts.push(`${entry.duration}ms`)
  if (entry.error) parts.push(`err="${entry.error}"`)
  return parts.join(' | ')
}

function log(level: LogLevel, message: string, meta?: Partial<Omit<LogEntry, 'level' | 'message' | 'timestamp'>>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }

  const formatted = formatEntry(entry)

  switch (level) {
    case 'error':
      console.error(formatted)
      break
    case 'warn':
      console.warn(formatted)
      break
    case 'debug':
      if (!IS_PROD) console.debug(formatted)
      break
    default:
      console.log(formatted)
  }
}

export const logger = {
  info: (message: string, meta?: Partial<Omit<LogEntry, 'level' | 'message' | 'timestamp'>>) =>
    log('info', message, meta),
  warn: (message: string, meta?: Partial<Omit<LogEntry, 'level' | 'message' | 'timestamp'>>) =>
    log('warn', message, meta),
  error: (message: string, meta?: Partial<Omit<LogEntry, 'level' | 'message' | 'timestamp'>>) =>
    log('error', message, meta),
  debug: (message: string, meta?: Partial<Omit<LogEntry, 'level' | 'message' | 'timestamp'>>) =>
    log('debug', message, meta),
}
