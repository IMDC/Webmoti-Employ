import ZoomVideo, { LocalAudioTrack, LocalVideoTrack, VideoPlayer } from '@zoom/videosdk';
import { create } from 'zustand';
import { useAppStore } from './store';

type ZoomPreviewStore = {
  // TODO move the devices/selected device into other store
  videoDevices: MediaDeviceInfo[];
  audioInputDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
  localVideoTrack: LocalVideoTrack | null;
  localAudioTrack: LocalAudioTrack | null;

  initDevices: () => Promise<void>;
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
  videoDevices: [],
  audioInputDevices: [],
  audioOutputDevices: [],
  localVideoTrack: null,
  localAudioTrack: null,

  initDevices: async () => {
    // try catch doesn't work on this function
    const devices = await ZoomVideo.getDevices();

    const videoDevices = devices.filter((d) => d.kind === 'videoinput');
    const audioInputDevices = devices.filter((d) => d.kind === 'audioinput');
    const audioOutputDevices = devices.filter((d) => d.kind === 'audiooutput');

    // need to check for dummy devices when permission denied
    const isValidDevice = (d: MediaDeviceInfo) => d.deviceId && d.label;
    const hasPermission = [...videoDevices, ...audioInputDevices].some(isValidDevice);

    if (!hasPermission) {
      useAppStore.getState().setError('Could not access media devices');
      useAppStore.getState().setPermissionState('denied');
      useAppStore.getState().setIsVideoOn(false);
      useAppStore.getState().setIsAudioOn(false);
      return;
    }

    set({ videoDevices, audioInputDevices, audioOutputDevices });
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

  switchCamera: async (deviceId) => {
    const localVideoTrack = get().localVideoTrack;
    localVideoTrack?.switchCamera(deviceId);
  },

  startMicrophone: async () => {
    const audioDevices = get().audioInputDevices;

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
