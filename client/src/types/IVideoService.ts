import ZoomVideo from '@zoom/videosdk';
import { ILocalAudioTrack } from './ILocalAudioTrack';
import { ILocalVideoTrack } from './ILocalVideoTrack';

ZoomVideo.createLocalAudioTrack().start;

export interface IVideoService {
  join: (name: string, roomName: string) => Promise<void>;
  leave: () => Promise<void>;

  getVideoDevices: () => Promise<Array<MediaDeviceInfo>>;
  getLocalVideoTrack: () => ILocalVideoTrack;
  startCamera: () => Promise<void>;
  stopCamera: () => Promise<void>;
  switchCamera: (cameraId: string) => Promise<void>;
  // Todo: https://developers.zoom.us/docs/video-sdk/web/preview/#mobile-browser-cameras
  getAudioDevices: () => Promise<Array<MediaDeviceInfo>>;
  getLocalAudioTrack: () => ILocalAudioTrack;

  // on: (
  //   event: 'participant-joined' | 'participant-left' | 'audio-changed',
  //   handler: (payload: any) => void
  // ) => void;
}
