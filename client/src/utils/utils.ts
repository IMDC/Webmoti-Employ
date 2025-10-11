import type { ExecutedFailure } from '@zoom/videosdk'
import type { AppError } from '@/useAppStore'
import { notifications } from '@mantine/notifications'
import { HttpError } from './HttpError'
import { logger } from './logger'

const LOCAL_BEARER_TOKEN_KEY = 'bearer_token'

export function isExecutedFailure(error: unknown): error is ExecutedFailure {
  return typeof error === 'object' && error !== null && 'reason' in error && 'errorCode' in error
}

export function handleAppError(
  error: unknown,
  setError: (e: AppError) => void,
  defaultMessage: string,
) {
  logger.log(defaultMessage)
  if (isExecutedFailure(error)) {
    setError({ message: defaultMessage, status: error.errorCode, details: error.reason })
  }
  else if (error instanceof HttpError) {
    setError({ message: error.message, status: error.status, details: error.details })
  }
  else if (error instanceof Error) {
    setError({ message: defaultMessage, details: error.message })
  }
  else {
    setError({ message: defaultMessage })
  }
}

export function showErrorNotification(title: string, message: string) {
  notifications.show({
    title,
    message,
    color: 'red',
    autoClose: false,
  })
}

export function errorNotification(title: string, error: unknown) {
  logger.error(title, error)

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

  showErrorNotification(fullTitle, message || '')
}

export function jsonStringifyIndented(json: unknown) {
  return JSON.stringify(json, null, 2)
}

export function formatAppError(error: AppError): string {
  const { status, message, details } = error

  const lines = []

  if (status !== undefined) {
    lines.push(`Status: ${status}`)
  }

  if (message && message.length > 0) {
    lines.push(`Message: ${message}`)
  }

  if (details !== undefined) {
    const detailsText = typeof details === 'string' ? details : jsonStringifyIndented(details)

    if (detailsText.length > 0) {
      lines.push(`Details: ${detailsText}`)
    }
  }

  return lines.join('\n')
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
}

export function getLocalBearerToken() {
  return localStorage.getItem(LOCAL_BEARER_TOKEN_KEY)
}

export function setLocalBearerToken(bearerToken: string) {
  localStorage.setItem(LOCAL_BEARER_TOKEN_KEY, encodeURIComponent(bearerToken))
}
