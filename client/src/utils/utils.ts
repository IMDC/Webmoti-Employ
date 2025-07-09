import type { UserResource } from '@clerk/types';
import { ExecutedFailure } from '@zoom/videosdk';
import { Json } from '@/types/Json';
import { AppError } from '@/useAppStore';
import { HttpError } from './HttpError';

export function getFittedSize(
  containerWidth: number,
  containerHeight: number,
  aspectRatio: number
): [number, number] {
  let height = containerHeight;
  let width = height * aspectRatio;

  if (width > containerWidth) {
    width = containerWidth;
    height = width / aspectRatio;
  }

  return [width, height];
}

function isExecutedFailure(error: unknown): error is ExecutedFailure {
  return typeof error === 'object' && error !== null && 'reason' in error && 'errorCode' in error;
}

export function handleAppError(
  error: unknown,
  setError: (e: AppError) => void,
  defaultMessage: string
) {
  if (isExecutedFailure(error)) {
    setError({ message: defaultMessage, status: error.errorCode, details: error.reason });
  } else if (error instanceof HttpError) {
    setError({ message: error.message, status: error.status, details: error.details });
  } else if (error instanceof Error) {
    setError({ message: defaultMessage, details: error.message });
  } else {
    setError({ message: defaultMessage });
  }
}

export function jsonStringifyIndented(json: Json) {
  return JSON.stringify(json, null, 2);
}

export function getUserIdentity(user: UserResource) {
  return `${user.firstName} ${user.lastName}`;
}
