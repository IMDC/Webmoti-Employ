import type { UserResource } from '@clerk/types'
import type { ExecutedFailure } from '@zoom/videosdk'
import type { AppError } from '@/useAppStore'
import { HttpError } from './HttpError'

export function getFittedSize(
  containerWidth: number,
  containerHeight: number,
  aspectRatio: number,
): [number, number] {
  let height = containerHeight
  let width = height * aspectRatio

  if (width > containerWidth) {
    width = containerWidth
    height = width / aspectRatio
  }

  return [width, height]
}

function isExecutedFailure(error: unknown): error is ExecutedFailure {
  return typeof error === 'object' && error !== null && 'reason' in error && 'errorCode' in error
}

export function handleAppError(
  error: unknown,
  setError: (e: AppError) => void,
  defaultMessage: string,
) {
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

export function jsonStringifyIndented(json: unknown) {
  return JSON.stringify(json, null, 2)
}

export function getUserIdentity(user: UserResource) {
  return `${user.firstName} ${user.lastName}`
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
