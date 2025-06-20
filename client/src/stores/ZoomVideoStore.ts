import ZoomVideo, { Participant } from '@zoom/videosdk';
import { create } from 'zustand';

const client = ZoomVideo.createClient();

// All zoom event listeners to keep state updated:
// TODO move this somewhere else
const updateParticipants = () => {
  useZoomVideoStore.setState({
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

type ZoomVideoStore = {
  client: typeof client;
  stream: ReturnType<typeof client.getMediaStream> | null;
  callState: 'prejoin' | 'joining' | 'joined' | 'left';

  // map userId to Participant
  participants: Map<number, Participant>;

  initialized: boolean;
  initClient: () => Promise<void>;

  join: (name: string, roomName: string) => Promise<void>;
  leave: () => Promise<void>;

  startVideo: () => Promise<void>;

  createVideoPlayer: (userId: number) => Promise<HTMLElement | null>;
  detachVideoPlayer: (userId: number) => Promise<void>;
};

export const useZoomVideoStore = create<ZoomVideoStore>((set, get) => ({
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

    await stream.startVideo();

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

  createVideoPlayer: async (userId: number) => {
    const stream = get().stream;
    if (!stream) {
      // todo set error
      return null;
    }

    const video = await stream.attachVideo(userId, 3);

    if (video instanceof HTMLElement) {
      return video;
    }
    return null;
  },

  detachVideoPlayer: async (userId: number) => {
    const stream = get().stream;
    await stream?.detachVideo(userId);
  },
}));
