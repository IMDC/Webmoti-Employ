import ZoomVideo, { Participant, VideoClient, VideoPlayer, VideoQuality } from '@zoom/videosdk';
import { createStore, StoreApi } from 'zustand';
import { useAppStore } from '@/useAppStore';
import { logger } from '@/utils/logger';
import { handleAppError } from '@/utils/utils';
import { DeviceStore } from './createDeviceStore';

export type ZoomSessionStore = {
  client: typeof VideoClient;
  stream: ReturnType<typeof VideoClient.getMediaStream> | null;
  callState: 'prejoin' | 'joining' | 'joined' | 'left';

  participants: Map<number, Participant>;

  initialized: boolean;
  initClient: () => Promise<void>;

  join: (name: string, roomName: string, token: string) => Promise<void>;
  leave: () => Promise<void>;

  startVideo: () => Promise<void>;
  stopVideo: () => Promise<void>;
  switchCamera: (deviceId: string) => Promise<void>;

  attachVideoPlayer: (userId: number, element: VideoPlayer) => Promise<void>;
  detachVideoPlayer: (userId: number) => Promise<void>;

  startAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
  muteAudio: () => Promise<void>;
  unmuteAudio: () => Promise<void>;
  switchMicrophone: (deviceId: string) => Promise<void>;

  cleanup: () => Promise<void>;
};

export function createZoomSessionStore(deviceStore: StoreApi<DeviceStore>) {
  const client = ZoomVideo.createClient();

  const zoomSessionStore = createStore<ZoomSessionStore>((set, get) => {
    const stream = () => {
      const s = get().stream;
      if (!s) {
        throw new Error('Stream not initialized');
      }
      return s;
    };

    return {
      client,
      stream: null,
      callState: 'prejoin',
      participants: new Map(),

      initialized: false,
      initClient: async () => {
        logger.log('Initializing zoom client...');

        await client.init('en-US', 'Global', {
          patchJsMedia: true,
          leaveOnPageUnload: true,
        });

        ZoomVideo.preloadDependentAssets();
        set({ initialized: true });
      },

      join: async (name, roomName, token) => {
        set({ callState: 'joining' });

        try {
          await client.join(roomName, token, name);

          const stream = client.getMediaStream();
          try {
            if (useAppStore.getState().permissionState === 'granted') {
              await stream.startVideo();
              await stream.startAudio();
            }
          } catch (error: unknown) {
            handleAppError(error, useAppStore.getState().setError, 'Failed to start media');
          }

          set({ stream, callState: 'joined' });
          updateParticipants();
        } catch (error: unknown) {
          set({ callState: 'prejoin', stream: null });
          handleAppError(error, useAppStore.getState().setError, 'Failed to join Zoom session');
        }
      },
      leave: async () => {
        set({
          callState: 'left',
          stream: null,
          participants: new Map(),
        });

        await client.leave();
      },

      startVideo: async () => {
        await stream().startVideo();
      },

      stopVideo: async () => {
        await stream().stopVideo();
      },
      switchCamera: async (deviceId) => {
        await stream().switchCamera(deviceId);
        deviceStore.setState({ selectedVideoDevice: deviceId });
      },

      attachVideoPlayer: async (userId: number, element: VideoPlayer) => {
        // need to detach first to ensure it works properly (this matters in strict mode)
        await stream().detachVideo(userId);

        logger.log('Attaching video player...');
        await stream().attachVideo(userId, VideoQuality.Video_720P, element);
      },

      detachVideoPlayer: async (userId: number) => {
        await stream().detachVideo(userId);
      },

      startAudio: async () => {
        await stream().startAudio();
      },
      stopAudio: async () => {
        // this will stop the user from both sharing and hearing audio
        await stream().stopAudio();
      },
      muteAudio: async () => {
        await stream().muteAudio();
      },
      unmuteAudio: async () => {
        await stream().unmuteAudio();
      },
      switchMicrophone: async (deviceId) => {
        stream().switchMicrophone(deviceId);
        deviceStore.setState({ selectedAudioInputDevice: deviceId });
      },

      cleanup: async () => {
        client.off('user-added', updateParticipants);
        client.off('user-removed', updateParticipants);
        client.off('user-updated', updateParticipants);
        await ZoomVideo.destroyClient();
      },
    };
  });

  // --------------------------------------------------
  // All zoom event listeners to keep state updated:
  // --------------------------------------------------

  const updateParticipants = () => {
    zoomSessionStore.setState({
      participants: new Map(client.getAllUser().map((user) => [user.userId, user])),
    });
  };
  // todo change this to show notification about user join/leave
  client.on('user-added', updateParticipants);
  client.on('user-removed', updateParticipants);
  client.on('user-updated', updateParticipants);

  // TODO
  // client.on('device-change', );
  // client.on('device-permission-change', );
  // client.on('active-media-failed', );
  // client.on('active-media-failed', );
  // others... https://developers.zoom.us/docs/video-sdk/web/handle-events/

  return zoomSessionStore;
}
