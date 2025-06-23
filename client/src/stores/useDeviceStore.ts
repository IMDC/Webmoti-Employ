import ZoomVideo from '@zoom/videosdk';
import { create } from 'zustand';
import { useAppStore } from './useAppStore';

type DeviceStore = {
  videoDevices: MediaDeviceInfo[];
  audioInputDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];

  initDevices: () => Promise<void>;
};

export const useDeviceStore = create<DeviceStore>((set) => ({
  videoDevices: [],
  audioInputDevices: [],
  audioOutputDevices: [],

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
}));
