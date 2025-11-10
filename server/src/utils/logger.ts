/* eslint-disable no-console */

export function debugLog(envIsDev: string, ...args: unknown[]) {
  if (envIsDev === 'true')
    console.log(...args)
}
