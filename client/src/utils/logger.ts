/* eslint-disable no-console */
type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

const levels: Record<LogLevel, number> = {
  silent: 5,
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

let currentLevel: LogLevel = import.meta.env.PROD ? 'warn' : 'debug';

function shouldLog(level: LogLevel) {
  return levels[level] <= levels[currentLevel];
}

export const logger = {
  setLevel(level: LogLevel) {
    currentLevel = level;
  },

  error(message?: any, ...optionalParams: any[]) {
    if (shouldLog('error')) {
      console.error(message, ...optionalParams);
    }
  },

  warn(message?: any, ...optionalParams: any[]) {
    if (shouldLog('warn')) {
      console.warn(message, ...optionalParams);
    }
  },

  info(message?: any, ...optionalParams: any[]) {
    if (shouldLog('info')) {
      console.info(message, ...optionalParams);
    }
  },

  debug(message?: any, ...optionalParams: any[]) {
    if (shouldLog('debug')) {
      console.debug(message, ...optionalParams);
    }
  },
};
