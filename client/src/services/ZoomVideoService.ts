import ZoomVideo from '@zoom/videosdk';
import { IVideoService } from '@/types/IVideoService';

export class ZoomVideoService implements IVideoService {
  private client = ZoomVideo.createClient();
  private initPromise: Promise<void>;
  private stream;

  constructor() {
    // todo
    // ZoomVideo.checkSystemRequirements()
    // https://developers.zoom.us/docs/video-sdk/web/sessions/#preload-assets-and-check-support

    // todo (not available on firefox)
    // https://marketplacefront.zoom.us/sdk/custom/web/interfaces/InitOptions.html#leaveOnPageUnload

    this.initPromise = this.client
      .init('en-US', 'Global', { patchJsMedia: true, leaveOnPageUnload: true })
      .then((res) => {
        if (res !== '') {
          throw new Error(`Zoom init failed: ${res}`);
        }
      });
    ZoomVideo.preloadDependentAssets();
  }

  private async fetchToken(identity: string, roomName: string): Promise<string> {
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

  async join(name: string, roomName: string) {
    await this.initPromise;
    const token = await this.fetchToken(name, roomName);
    await this.client.join(roomName, token, name);

    this.stream = this.client.getMediaStream();
  }

  async leave() {
    await this.client.leave();

    // todo recreate client
    // and call this on unload
    await ZoomVideo.destroyClient();
  }
}
