import ZoomVideo, { Participant, VideoClient, VideoPlayer } from '@zoom/videosdk';
import { create } from 'zustand';
import { useAppStore } from '@/stores/useAppStore';
import { useDeviceStore } from '@/stores/useDeviceStore';

export type ZoomSessionStore = {
  client: typeof VideoClient;
  stream: ReturnType<typeof VideoClient.getMediaStream> | null;
  callState: 'prejoin' | 'joining' | 'joined' | 'left';

  // map userId to Participant
  participants: Map<number, Participant>;

  initialized: boolean;
  initClient: () => Promise<void>;

  join: (name: string, roomName: string) => Promise<void>;
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
};

async function fetchToken(identity: string, roomName: string) {
  const body = { sessionName: roomName, role: 1, userIdentity: identity };
  const res = await fetch(`/api/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const { signature } = await res.json();
  return signature;
}

export function createZoomSessionStore() {
  const client = ZoomVideo.createClient();

  // ---------------------------------------------------------------------------
  // This store will be returned and used as value in ZoomSessionContextProvider
  // ---------------------------------------------------------------------------

  const zoomSessionStore = create<ZoomSessionStore>((set, get) => ({
    client,
    stream: null,
    callState: 'prejoin',
    participants: new Map(),

    initialized: false,
    initClient: async () => {
      await client.init('en-US', 'Global', {
        patchJsMedia: true,
        leaveOnPageUnload: true,
      });

      ZoomVideo.preloadDependentAssets();
      set({ initialized: true });
    },

    join: async (name, roomName) => {
      set({ callState: 'joining' });

      const token = await fetchToken(name, roomName);
      await client.join(roomName, token, name);

      const stream = client.getMediaStream();

      if (useAppStore.getState().permissionState === 'granted') {
        await stream.startVideo();
        await stream.startAudio();
      }

      set({ stream, callState: 'joined' });

      updateParticipants();
    },
    leave: async () => {
      set({
        callState: 'left',
        stream: null,
        participants: new Map(),
      });

      await client.leave();
      await ZoomVideo.destroyClient();
    },

    startVideo: async () => {
      const stream = get().stream!;
      await stream.startVideo();
    },

    stopVideo: async () => {
      const stream = get().stream!;
      await stream.stopVideo();
    },
    switchCamera: async (deviceId) => {
      const stream = get().stream!;
      await stream.switchCamera(deviceId);
      useDeviceStore.setState({ selectedVideoDevice: deviceId });
    },

    attachVideoPlayer: async (userId: number, element: VideoPlayer) => {
      const stream = get().stream;
      if (!stream) {
        // todo set error
        console.error('error no stream');
        return;
      }

      console.log('attaching video player');

      await stream.attachVideo(userId, 3, element);
    },

    detachVideoPlayer: async (userId: number) => {
      const stream = get().stream;
      await stream?.detachVideo(userId);
    },

    startAudio: async () => {
      const stream = get().stream!;
      await stream.startAudio();
    },
    stopAudio: async () => {
      // this will stop the user from both sharing and hearing audio
      const stream = get().stream!;
      await stream.stopAudio();
    },
    muteAudio: async () => {
      const stream = get().stream!;
      await stream.muteAudio();
    },
    unmuteAudio: async () => {
      const stream = get().stream!;
      await stream.unmuteAudio();
    },
    switchMicrophone: async (deviceId) => {
      const stream = get().stream!;
      stream.switchMicrophone(deviceId);
      useDeviceStore.setState({ selectedAudioInputDevice: deviceId });
    },
  }));

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
