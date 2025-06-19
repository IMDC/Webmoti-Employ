import ZoomVideo from '@zoom/videosdk';
import { create } from 'zustand';

const client = ZoomVideo.createClient();

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
  videoState: 'prejoin' | 'joining' | 'joined' | 'left';

  initialized: boolean;
  initClient: () => Promise<void>;

  join: (name: string, roomName: string) => Promise<void>;
  leave: () => Promise<void>;
};

export const useZoomVideoStore = create<ZoomVideoStore>((set, get) => ({
  client,
  videoState: 'prejoin',

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
    const token = await fetchToken(name, roomName);
    await client.join(roomName, token, name);

    // this.stream = this.client.getMediaStream();
  },
  leave: async () => {
    await client.leave();
    await ZoomVideo.destroyClient();
  },
}));
