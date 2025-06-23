import ZoomVideo, { LocalAudioTrack, LocalVideoTrack, VideoPlayer } from '@zoom/videosdk';
import { create } from 'zustand';
import { useAppStore } from './useAppStore';
import { useDeviceStore } from './useDeviceStore';

type ZoomPreviewStore = {
  localVideoTrack: LocalVideoTrack | null;
  localAudioTrack: LocalAudioTrack | null;

  startCamera: (element: VideoPlayer) => Promise<void>;
  stopCamera: () => Promise<void>;
  switchCamera: (cameraId: string) => Promise<void>;

  startMicrophone: () => Promise<void>;
  stopMicrophone: () => Promise<void>;
  unmuteMicrophone: () => Promise<void>;
  muteMicrophone: () => Promise<void>;
  toggleMuteMicrophone: () => Promise<void>;
  switchMicrophone: (microphoneId: string) => Promise<void>;
};

export const useZoomPreviewStore = create<ZoomPreviewStore>((set, get) => ({
  localVideoTrack: null,
  localAudioTrack: null,

  startCamera: async (element) => {
    const videoDevices = useDeviceStore.getState().videoDevices;
    if (!videoDevices.length) {
      throw new Error('No video devices found');
    }

    const track = ZoomVideo.createLocalVideoTrack(videoDevices[0].deviceId);
    await track.start(element);
    set({ localVideoTrack: track });
  },

  stopCamera: async () => {
    const localVideoTrack = get().localVideoTrack;
    if (localVideoTrack) {
      await localVideoTrack.stop();
      set({ localVideoTrack: null });
    }
  },

  switchCamera: async (deviceId) => {
    const localVideoTrack = get().localVideoTrack;
    localVideoTrack?.switchCamera(deviceId);
  },

  startMicrophone: async () => {
    const audioDevices = useDeviceStore.getState().audioInputDevices;

    if (!audioDevices.length) {
      throw new Error('No audio devices found');
    }

    const track = ZoomVideo.createLocalAudioTrack(audioDevices[0].deviceId);
    await track.start();
    await track?.unmute();

    set({ localAudioTrack: track });
  },

  stopMicrophone: async () => {
    const localAudioTrack = get().localAudioTrack;
    if (localAudioTrack) {
      await localAudioTrack.stop();
      set({ localAudioTrack: null });
    }
  },

  unmuteMicrophone: async () => {
    const localAudioTrack = get().localAudioTrack;
    await localAudioTrack?.unmute();
  },

  muteMicrophone: async () => {
    const localAudioTrack = get().localAudioTrack;
    await localAudioTrack?.mute();
  },
  toggleMuteMicrophone: async () => {
    const localAudioTrack = get().localAudioTrack;
    const isAudioOn = useAppStore.getState().isAudioOn;
    if (isAudioOn) {
      await localAudioTrack?.mute();
    } else {
      await localAudioTrack?.unmute();
    }
    useAppStore.getState().toggleIsAudioOn();
  },
  switchMicrophone: async (microphoneId) => {
    const localAudioTrack = get().localAudioTrack;
    await localAudioTrack?.stop();

    const newLocalAudioTrack = ZoomVideo.createLocalAudioTrack(microphoneId);
    await newLocalAudioTrack.start();
    newLocalAudioTrack.unmute();
    set({ localAudioTrack: newLocalAudioTrack });
  },
}));
