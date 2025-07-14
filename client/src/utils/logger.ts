/* eslint-disable no-console */

// this logger is from: https://www.meticulous.ai/blog/getting-started-with-react-logging

/** Signature of a logging function */
export interface LogFn {
  (message?: any, ...optionalParams: any[]): void
}

/** Basic logger interface */
export interface Logger {
  log: LogFn
  warn: LogFn
  error: LogFn
}

/** Log levels */
export type LogLevel = 'log' | 'warn' | 'error'

const NO_OP: LogFn = (_message?: any, ..._optionalParams: any[]) => {}

/** Logger which outputs to the browser console */
export class ConsoleLogger implements Logger {
  readonly log: LogFn
  readonly warn: LogFn
  readonly error: LogFn

  constructor(options?: { level?: LogLevel }) {
    const { level } = options || {}

    this.error = console.error.bind(console)
    this.warn = console.warn.bind(console)
    this.log = console.log.bind(console)

    if (level === 'error') {
      this.warn = NO_OP
      this.log = NO_OP

      return
    }

    if (level === 'warn') {
      this.log = NO_OP
    }
  }
}

const currentLevel: LogLevel = import.meta.env.PROD ? 'warn' : 'log'

export const logger = new ConsoleLogger({ level: currentLevel })
