import ZoomVideo, { LocalVideoTrack, VideoPlayer } from '@zoom/videosdk';
import { create } from 'zustand';

type ZoomPreviewStore = {
  getVideoDevices: () => Promise<Array<MediaDeviceInfo>>;
  getLocalVideoTrack: () => Promise<LocalVideoTrack>;
  startCamera: (element: VideoPlayer | HTMLVideoElement | HTMLCanvasElement) => Promise<void>;
  stopCamera: () => Promise<void>;
  //   switchCamera: (cameraId: string) => Promise<void>;
  //   getAudioDevices: () => Promise<Array<MediaDeviceInfo>>;
  //   getLocalAudioTrack: () => LocalAudioTrack;
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
}));
