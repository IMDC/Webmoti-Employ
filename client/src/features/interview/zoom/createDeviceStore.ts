import ZoomVideo from '@zoom/videosdk';
import { createStore } from 'zustand';
import { useAppStore } from '../../../useAppStore';

export type DeviceStore = {
  videoDevices: MediaDeviceInfo[];
  audioInputDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];

  selectedVideoDevice: string | null;
  selectedAudioInputDevice: string | null;
  selectedAudioOutputDevice: string | null;

  initDevices: () => Promise<void>;
};

export function createDeviceStore() {
  return createStore<DeviceStore>((set) => ({
    videoDevices: [],
    audioInputDevices: [],
    audioOutputDevices: [],

    selectedVideoDevice: null,
    selectedAudioInputDevice: null,
    selectedAudioOutputDevice: null,

    initDevices: async () => {
      const appState = useAppStore.getState();
      if (appState.permissionState === 'acquiring' || appState.permissionState === 'granted') {
        return;
      }
      appState.setPermissionState('acquiring');

      // try catch doesn't work on this function
      const devices = await ZoomVideo.getDevices();

      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      const audioInputDevices = devices.filter((d) => d.kind === 'audioinput');
      const audioOutputDevices = devices.filter((d) => d.kind === 'audiooutput');

      // need to check for dummy devices when permission denied
      const isValidDevice = (d: MediaDeviceInfo) => d.deviceId && d.label;
      const hasPermission = [...videoDevices, ...audioInputDevices].some(isValidDevice);

      if (!hasPermission) {
        appState.setError({ message: 'Could not access media devices' });
        appState.setPermissionState('denied');
        appState.setIsVideoOn(false);
        appState.setIsAudioOn(false);
        return;
      }

      set({
        videoDevices,
        audioInputDevices,
        audioOutputDevices,
        selectedVideoDevice: videoDevices[0]?.deviceId ?? null,
        selectedAudioInputDevice: audioInputDevices[0]?.deviceId ?? null,
        selectedAudioOutputDevice: audioOutputDevices[0]?.deviceId ?? null,
      });
      appState.setPermissionState('granted');
    },
  }));
}
