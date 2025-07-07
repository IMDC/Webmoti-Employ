import { BaseContext } from '../..';
import { zValidator } from '../../validator-wrapper';
import { generateZoomApiJwt, generateZoomVideoJwt } from './jwt';
import { Session, ZoomClient } from './ZoomClient';
import { Hono } from 'hono';
import { z } from 'zod/v4';

const sessionsRoute = new Hono<BaseContext>();

const SessionsCreateRequestQuery = z.object({
  userIdentity: z.string().max(34),
});

sessionsRoute.get('/', zValidator('query', SessionsCreateRequestQuery), async (c) => {
  const { userIdentity } = c.req.valid('query');

  const sessionName = crypto.randomUUID();

  const token = await generateZoomVideoJwt({
    zoomVideoSdkKey: c.env.ZOOM_VIDEO_SDK_KEY,
    zoomVideoSdkSecret: c.env.ZOOM_VIDEO_SDK_SECRET,
    sessionName: sessionName,
    userIdentity,
    role: 1,
  });

  return c.json({ sessionName, token });
});

const SessionsJoinRequestQuery = z.object({
  userIdentity: z.string().max(34),
});

const SessionsJoinRequestParams = z.object({
  sessionName: z.string().min(1).max(199),
});

sessionsRoute.get(
  '/:sessionName',
  zValidator('param', SessionsJoinRequestParams),
  zValidator('query', SessionsJoinRequestQuery),
  async (c) => {
    const { sessionName } = c.req.valid('param');
    const { userIdentity } = c.req.valid('query');

    const apiToken = await generateZoomApiJwt(c.env.ZOOM_API_KEY, c.env.ZOOM_API_SECRET);

    let foundSession: Session | null = null;
    try {
      const client = new ZoomClient(apiToken);
      // this array should only be one session since we search using sessionName
      const liveSessions = await client.searchLiveSessions(sessionName);
      for (const session of liveSessions) {
        if (session.session_name === sessionName) {
          foundSession = session;
          break;
        }
      }

      if (!foundSession) {
        console.error('Unable to find session');
        return c.json({ error: 'Unable to find session' }, 404);
      }
    } catch (error) {
      console.error(error);
      return c.json({ error: 'Failed to query sessions' }, 500);
    }

    const token = await generateZoomVideoJwt({
      zoomVideoSdkKey: c.env.ZOOM_VIDEO_SDK_KEY,
      zoomVideoSdkSecret: c.env.ZOOM_VIDEO_SDK_SECRET,
      sessionName,
      userIdentity,
      role: 0, // the person with role 1 is already in the session at this point
    });

    return c.json({ sessionName, token, userCount: foundSession.user_count });
  }
);

export default sessionsRoute;
