export interface IVideoService {
  join: (name: string, roomName: string) => Promise<void>;
  leave: () => Promise<void>;

  // on: (
  //   event: 'participant-joined' | 'participant-left' | 'audio-changed',
  //   handler: (payload: any) => void
  // ) => void;
}
