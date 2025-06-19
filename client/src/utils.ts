import { useAppStore } from './stores/store';

export async function requestLocalMedia(
  constraints: MediaStreamConstraints = { video: true, audio: true }
): Promise<MediaStream | null> {
  const setError = useAppStore.getState().setError;
  const setIsMediaDenied = useAppStore.getState().setIsMediaDenied;

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    setIsMediaDenied(false);
    return stream;
  } catch {
    setError('Could not access camera or microphone');
    setIsMediaDenied(true);
    return null;
  }
}

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
