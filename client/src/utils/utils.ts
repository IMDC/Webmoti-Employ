import type { ExecutedFailure } from '@zoom/videosdk'
import { notifications } from '@mantine/notifications'
import { DateTime } from 'luxon'
import { HttpError } from './HttpError'
import { logger } from './logger'

const LOCAL_BEARER_TOKEN_KEY = 'bearer_token'
const LOCAL_BEARER_TOKEN_EXPIRY_KEY = 'bearer_token_expiry'

export function isExecutedFailure(error: unknown): error is ExecutedFailure {
  return typeof error === 'object' && error !== null && 'reason' in error && 'errorCode' in error
}

export function showErrorNotification(title: string, message?: string) {
  notifications.show({
    title,
    message,
    color: 'red',
    autoClose: false,
  })
}

export function notifyError(title: string, error?: unknown) {
  if (error !== undefined) {
    logger.error(title, error)
  }

  let message: string | undefined
  let code: string | number | undefined

  if (typeof error === 'string') {
    message = error
  }
  else if (isExecutedFailure(error)) {
    message = error.reason ?? undefined
    code = error.errorCode
  }
  else if (error instanceof HttpError) {
    message = error.message || undefined
    code = error.status
  }
  else if (error instanceof Error) {
    message = error.message || undefined
  }

  const fullTitle = code ? `${title} (${code})` : title

  showErrorNotification(fullTitle, message)
}

export function jsonStringifyIndented(json: unknown) {
  return JSON.stringify(json, null, 2)
}

export function getInterviewLink(sessionId: string) {
  return `${window.location.origin}/interview/${sessionId}`
}

export function getHighlightColor(isColorblindModeOn: boolean) {
  return isColorblindModeOn ? 'black' : 'red'
}

export function isElectron() {
  return 'electron' in window
}

export function getFirstName(name: string) {
  return name.split(' ')[0]
}

export function clearUrlParam(param: string) {
  const url = new URL(window.location.href)
  if (url.searchParams.has(param)) {
    url.searchParams.delete(param)
    window.history.replaceState({}, document.title, url.toString())
  }
}

export function removeLocalBearerToken() {
  localStorage.removeItem(LOCAL_BEARER_TOKEN_KEY)
  localStorage.removeItem(LOCAL_BEARER_TOKEN_EXPIRY_KEY)
}

export function getLocalBearerToken() {
  const storedExpiry = localStorage.getItem(LOCAL_BEARER_TOKEN_EXPIRY_KEY)
  if (!storedExpiry) {
    return null
  }

  // if token is expired, clear it
  if (DateTime.now().toUTC() > DateTime.fromISO(storedExpiry).toUTC()) {
    removeLocalBearerToken()
    return null
  }

  return localStorage.getItem(LOCAL_BEARER_TOKEN_KEY)
}

export function setLocalBearerToken(bearerToken: string) {
  localStorage.setItem(LOCAL_BEARER_TOKEN_KEY, encodeURIComponent(bearerToken))
  // better-auth defaults to 7 day expiry
  // if changing this on server, make sure to change this as well
  localStorage.setItem(LOCAL_BEARER_TOKEN_EXPIRY_KEY, DateTime.now().plus({ days: 7 }).toISO())
}

export function getUrlAuthToken() {
  // get the better-auth token from the url parameters.
  // it will be set there after signing in.
  const url = new URL(window.location.href)
  const authToken = url.searchParams.get('authToken')
  return authToken
}
