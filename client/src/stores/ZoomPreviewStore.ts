import ZoomVideo, { LocalAudioTrack, LocalVideoTrack, VideoPlayer } from '@zoom/videosdk';
import { create } from 'zustand';
import { useAppStore } from './store';

type ZoomPreviewStore = {
  videoDevices: MediaDeviceInfo[];
  audioDevices: MediaDeviceInfo[];
  localVideoTrack: LocalVideoTrack | null;
  localAudioTrack: LocalAudioTrack | null;

  initDevices: () => Promise<void>;
  startCamera: (element: VideoPlayer) => Promise<void>;
  stopCamera: () => Promise<void>;

  startMicrophone: () => Promise<void>;
  stopMicrophone: () => Promise<void>;
  unmuteMicrophone: () => Promise<void>;
  muteMicrophone: () => Promise<void>;
  toggleMuteMicrophone: () => Promise<void>;
};

export const useZoomPreviewStore = create<ZoomPreviewStore>((set, get) => ({
  videoDevices: [],
  audioDevices: [],
  localVideoTrack: null,
  localAudioTrack: null,

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
      useAppStore.getState().setPermissionState('denied');
      useAppStore.getState().setIsVideoOn(false);
      useAppStore.getState().setIsAudioOn(false);
      return;
    }

    set({ videoDevices, audioDevices });
    useAppStore.getState().setPermissionState('granted');
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

  stopCamera: async () => {
    const localVideoTrack = get().localVideoTrack;
    if (localVideoTrack) {
      await localVideoTrack.stop();
      set({ localVideoTrack: null });
    }
  },

  startMicrophone: async () => {
    const audioDevices = get().audioDevices;

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
}));
