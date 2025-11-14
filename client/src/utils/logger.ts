/* eslint-disable no-console */

// this logger is from: https://www.meticulous.ai/blog/getting-started-with-react-logging

/** Signature of a logging function */
export interface LogFn {
  (message?: any, ...optionalParams: any[]): void
}

/** Basic logger interface */
export interface Logger {
  log: LogFn
  info: LogFn
  warn: LogFn
  error: LogFn
}

/** Log levels */
export type LogLevel = 'log' | 'info' | 'warn' | 'error'

const NO_OP: LogFn = (_message?: any, ..._optionalParams: any[]) => {}

/** Logger which outputs to the browser console */
export class ConsoleLogger implements Logger {
  readonly log: LogFn
  readonly info: LogFn
  readonly warn: LogFn
  readonly error: LogFn

  constructor(options?: { level?: LogLevel }) {
    const { level = 'log' } = options || {}

    const LEVELS: Record<LogLevel, number> = {
      log: 0,
      info: 1,
      warn: 2,
      error: 3,
    }

    const currentLevel = LEVELS[level]

    this.error = LEVELS.error >= currentLevel ? console.error.bind(console) : NO_OP
    this.warn = LEVELS.warn >= currentLevel ? console.warn.bind(console) : NO_OP
    this.info = LEVELS.info >= currentLevel ? console.info.bind(console) : NO_OP
    this.log = LEVELS.log >= currentLevel ? console.log.bind(console) : NO_OP
  }
}

const currentLevel: LogLevel = import.meta.env.PROD ? 'info' : 'log'

export const logger = new ConsoleLogger({ level: currentLevel })
