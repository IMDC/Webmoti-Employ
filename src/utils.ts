import { useAppStore } from './store';

export async function requestLocalMedia(): Promise<MediaStream | null> {
  const setError = useAppStore.getState().setError;
  const setIsMediaDenied = useAppStore.getState().setIsMediaDenied;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setIsMediaDenied(false);
    return stream;
  } catch {
    setError('Could not access camera or microphone');
    setIsMediaDenied(true);
    return null;
  }
}
