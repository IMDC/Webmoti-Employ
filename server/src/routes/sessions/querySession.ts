import { z } from "zod/v4";

const ZOOM_API_BASE = "https://api.zoom.us/v2/videosdk";

async function zoomApi<T>(path: string, jwt: string): Promise<T> {
  const res = await fetch(`${ZOOM_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoom API error: ${res.status} ${err}`);
  }

  return res.json() as Promise<T>;
}

const ZoomSessionSchema = z.object({
  id: z.string(),
  session_name: z.string(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date().nullable(), // may be null if live
});

const GetSessionsSchema = z.object({
  sessions: z.array(ZoomSessionSchema),
});

async function getSessions(jwt: string) {
  const raw = await zoomApi("/sessions", jwt);
  const parsed = GetSessionsSchema.parse(raw);
  return parsed.sessions;
}

export async function querySession(jwt: string, id: string) {
  try {
    const sessions = await getSessions(jwt);

    if (sessions.length === 0) {
      console.log("No active or past sessions found.");
      return;
    }

    for (const session of sessions) {
      console.log(`Session: ${session.session_name}`);
      console.log(`  ID: ${session.id}`);
      console.log(`  Started: ${session.start_time.toISOString()}`);
      console.log(
        `  Ended: ${session.end_time?.toISOString() ?? "Still active"}`
      );
      console.log("---");
    }
  } catch (err) {
    console.error("Failed to query sessions:", err);
  }
}
