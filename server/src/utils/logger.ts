/* eslint-disable no-console */

export function debugLog(envIsDev: string, ...args: any[]) {
  if (envIsDev === 'true')
    console.log(...args)
}
