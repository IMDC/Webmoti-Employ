import type { UserResource } from '@clerk/types';
import { AppError } from '@/stores/useAppStore';
import { Json } from '@/types/Json';
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

export function handleServerError(
  error: unknown,
  setError: (e: AppError) => void,
  defaultMessage: string
) {
  if (error instanceof HttpError) {
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
