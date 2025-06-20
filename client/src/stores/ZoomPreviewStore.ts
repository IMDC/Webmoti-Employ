import ZoomVideo, { LocalAudioTrack, LocalVideoTrack, VideoPlayer } from '@zoom/videosdk';
import { create } from 'zustand';

type ZoomPreviewStore = {
  getVideoDevices: () => Promise<Array<MediaDeviceInfo>>;
  getLocalVideoTrack: () => Promise<LocalVideoTrack>;
  startCamera: (element: VideoPlayer | HTMLVideoElement | HTMLCanvasElement) => Promise<void>;
  stopCamera: () => Promise<void>;
  //   switchCamera: (cameraId: string) => Promise<void>;
  getAudioDevices: () => Promise<Array<MediaDeviceInfo>>;
  getLocalAudioTrack: () => Promise<LocalAudioTrack>;
  unmuteMicrophone: () => Promise<void>;
};

export const useZoomPreviewStore = create<ZoomPreviewStore>((set, get) => ({
  getVideoDevices: async () => {
    const devices = await ZoomVideo.getDevices();
    const videoDevices = devices.filter((device) => {
      return device.kind === 'videoinput';
    });
    return videoDevices;
  },
  getLocalVideoTrack: async () => {
    const videoDevices = await get().getVideoDevices();
    return ZoomVideo.createLocalVideoTrack(videoDevices[0].deviceId);
  },
  startCamera: async (element) => {
    const localVideoTrack = await get().getLocalVideoTrack();
    localVideoTrack.start(element);
  },
  stopCamera: async () => {
    const localVideoTrack = await get().getLocalVideoTrack();
    await localVideoTrack.stop();
  },

  getAudioDevices: async () => {
    const devices = await ZoomVideo.getDevices();
    const audioDevices = devices.filter((device) => {
      return device.kind === 'audioinput';
    });
    return audioDevices;
  },
  getLocalAudioTrack: async () => {
    const audioDevices = await get().getAudioDevices();
    const localAudioTrack = ZoomVideo.createLocalAudioTrack(audioDevices[0].deviceId);
    await localAudioTrack.start();
    return localAudioTrack;
  },
  unmuteMicrophone: async () => {
    const localAudioTrack = await get().getLocalAudioTrack();
    await localAudioTrack.unmute();
  },
}));
