import { AppContext } from '../..';
import { requireDb, useDb } from '../../middleware/useDb';
import { requireUserEmail, useUserEmail } from '../../middleware/useUserEmail';
import { zValidator } from '../../validator-wrapper';
import { getInterviews } from '../interviews/db-queries';
import { generateZoomApiJwt, generateZoomVideoJwt } from './jwt';
import { ZoomClient } from './ZoomClient';
import { Hono } from 'hono';
import { z } from 'zod/v4';

const sessionsRoute = new Hono<AppContext>();

const SessionsCreateRequestQuery = z.object({
  userIdentity: z.string().max(34),
});

sessionsRoute.get('/', zValidator('query', SessionsCreateRequestQuery), async (c) => {
  const { userIdentity } = c.req.valid('query');

  const sessionId = crypto.randomUUID();

  const token = await generateZoomVideoJwt({
    zoomVideoSdkKey: c.env.ZOOM_VIDEO_SDK_KEY,
    zoomVideoSdkSecret: c.env.ZOOM_VIDEO_SDK_SECRET,
    sessionName: sessionId,
    sessionKey: sessionId,
    userIdentity,
    role: 1,
  });

  return c.json({ sessionId: sessionId, token });
});

const SessionsJoinRequestQuery = z.object({
  userIdentity: z.string().max(34),
});

const SessionsJoinRequestParams = z.object({
  sessionId: z.uuidv4(),
});

sessionsRoute.get(
  '/:sessionId',
  useDb,
  useUserEmail,
  zValidator('param', SessionsJoinRequestParams),
  zValidator('query', SessionsJoinRequestQuery),
  async (c) => {
    const { sessionId } = c.req.valid('param');
    const { userIdentity } = c.req.valid('query');

    const db = requireDb(c);
    const userEmail = requireUserEmail(c);

    async function returnJoinToken() {
      const token = await generateZoomVideoJwt({
        zoomVideoSdkKey: c.env.ZOOM_VIDEO_SDK_KEY,
        zoomVideoSdkSecret: c.env.ZOOM_VIDEO_SDK_SECRET,
        sessionName: sessionId,
        sessionKey: sessionId,
        userIdentity,
        role: 0, // the person with role 1 is already in the session at this point
      });

      return c.json({ sessionId, token });
    }

    // ----------------------------------------------------
    // First check if this session is a scheduled session
    // ----------------------------------------------------

    const foundScheduledInterviews = await getInterviews(
      db,
      c.var.clerkUserId,
      userEmail,
      sessionId,
      true
    );

    if (foundScheduledInterviews.length > 0) {
      return returnJoinToken();
    }

    // TODO fix bug here!!!

    // ----------------------------------------------------
    // If not scheduled, check if live
    // ----------------------------------------------------

    const apiToken = await generateZoomApiJwt(c.env.ZOOM_API_KEY, c.env.ZOOM_API_SECRET);

    try {
      const client = new ZoomClient(apiToken);
      // this array should only be one session since we search using sessionId
      const liveSessions = await client.searchLiveSessions(sessionId);
      const isLive = liveSessions.some(
        (s) => s.session_name === sessionId && s.session_key === sessionId
      );
      if (isLive) {
        return returnJoinToken();
      }
    } catch (error) {
      console.error('Zoom live session check failed:', error);
      return c.json({ error: 'Failed to query sessions' }, 500);
    }

    return c.json({ error: 'Unable to find session' }, 404);
  }
);

export default sessionsRoute;
