import { z } from 'zod/v4';

const Session = z.object({
  id: z.string(),
  session_name: z.string(),
  start_time: z.coerce.date(),
  // end_time will always be '' since we search for live sessions only
  end_time: z.literal(''),
  user_count: z.number(),
});

export type Session = z.infer<typeof Session>;

const SessionsGetRequest = z.object({
  sessions: z.array(Session),
});

export class ZoomClient {
  private readonly base = 'https://api.zoom.us/v2/videosdk';
  constructor(private jwt: string) {}

  private async request(path: string, params?: URLSearchParams): Promise<unknown> {
    const url = `${this.base}${path}${params ? `?${params.toString()}` : ''}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.jwt}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Zoom API error: ${res.status} ${err}`);
    }

    return res.json();
  }

  async searchLiveSessions(sessionName: string) {
    const today = new Date().toISOString().slice(0, 10);
    const params = new URLSearchParams({
      type: 'live',
      from: today,
      to: today,
      session_name: sessionName,
    });
    const data = await this.request('/sessions', params);
    const parsed = SessionsGetRequest.safeParse(data);
    if (!parsed.success) {
      throw new Error(z.prettifyError(parsed.error));
    }

    return parsed.data.sessions;
  }
}
