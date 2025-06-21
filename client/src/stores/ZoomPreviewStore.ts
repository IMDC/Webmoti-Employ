import ZoomVideo, { LocalVideoTrack, VideoPlayer } from '@zoom/videosdk';
import { create } from 'zustand';
import { useAppStore } from './store';

type PermissionState = 'idle' | 'acquiring' | 'granted' | 'denied';

type ZoomPreviewStore = {
  videoDevices: MediaDeviceInfo[];
  audioDevices: MediaDeviceInfo[];
  localVideoTrack: LocalVideoTrack | null;
  cameraPermission: PermissionState;

  initDevices: () => Promise<void>;
  startCamera: (element: VideoPlayer) => Promise<void>;
  stopCamera: () => void;
};

export const useZoomPreviewStore = create<ZoomPreviewStore>((set, get) => ({
  videoDevices: [],
  audioDevices: [],
  localVideoTrack: null,
  cameraPermission: 'idle',

  initDevices: async () => {
    // try catch doesn't work on this function
    const devices = await ZoomVideo.getDevices();

    const videoDevices = devices.filter((d) => d.kind === 'videoinput');
    const audioDevices = devices.filter((d) => d.kind === 'audioinput');

    // need to check for dummy devices when permission denied
    const isValidDevice = (d: MediaDeviceInfo) => d.deviceId && d.label;
    const hasPermission = [...videoDevices, ...audioDevices].some(isValidDevice);

    if (!hasPermission) {
      useAppStore.getState().setError('Could not access media devices');
      set({ cameraPermission: 'denied' });
      return;
    }

    set({ videoDevices, audioDevices, cameraPermission: 'granted' });
  },

  startCamera: async (element) => {
    const videoDevices = get().videoDevices;
    if (!videoDevices.length) {
      throw new Error('No video devices found');
    }

    const track = ZoomVideo.createLocalVideoTrack(videoDevices[0].deviceId);
    await track.start(element);
    set({ localVideoTrack: track });
  },

  stopCamera: () => {
    const { localVideoTrack } = get();
    if (localVideoTrack) {
      localVideoTrack.stop();
      set({ localVideoTrack: null });
    }
  },
}));
