import ZoomVideo, { LocalAudioTrack, LocalVideoTrack, VideoPlayer } from '@zoom/videosdk';
import { create } from 'zustand';
import { useDeviceStore } from '../features/interview/zoom/useDeviceStore';
import { useAppStore } from './useAppStore';

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
    const selectedVideoDevice = useDeviceStore.getState().selectedVideoDevice;
    if (!selectedVideoDevice) {
      throw new Error('No video device found');
    }

    const track = ZoomVideo.createLocalVideoTrack(selectedVideoDevice);
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
    useDeviceStore.setState({ selectedVideoDevice: deviceId });
  },

  startMicrophone: async () => {
    const selectedAudioInputDevice = useDeviceStore.getState().selectedAudioInputDevice;
    if (!selectedAudioInputDevice) {
      throw new Error('No audio device found');
    }

    const track = ZoomVideo.createLocalAudioTrack(selectedAudioInputDevice);
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
    useDeviceStore.setState({ selectedAudioInputDevice: microphoneId });
  },
}));
