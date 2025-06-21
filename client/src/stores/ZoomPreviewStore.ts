import ZoomVideo, { LocalVideoTrack, VideoPlayer } from '@zoom/videosdk';
import { create } from 'zustand';

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
    try {
      const devices = await ZoomVideo.getDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      const audioDevices = devices.filter((d) => d.kind === 'audioinput');

      set({ videoDevices, audioDevices, cameraPermission: 'granted' });
    } catch (err) {
      // TODO set error here
      set({ cameraPermission: 'denied' });
    }
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
