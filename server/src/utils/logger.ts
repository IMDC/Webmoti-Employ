/* eslint-disable no-console */

export function debugLog(envIsDev: string, ...args: unknown[]) {
  if (envIsDev)
    console.log(...args)
}

export function prodLog(...args: unknown[]) {
  console.log(...args)
}
