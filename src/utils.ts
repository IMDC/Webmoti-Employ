import { useAppStore } from './store';

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
