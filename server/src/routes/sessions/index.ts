import { BaseContext } from '../..';
import { zValidator } from '../../validator-wrapper';
import { generateZoomJwt } from './jwt';
import { querySession } from './querySession';
import { Hono } from 'hono';
import { z } from 'zod/v4';

const sessionsRoute = new Hono<BaseContext>();

const CreateQuerySchema = z.object({
  userIdentity: z.string().max(34),
});

sessionsRoute.get('/', zValidator('query', CreateQuerySchema), async (c) => {
  const { userIdentity } = c.req.valid('query');

  const sessionName = crypto.randomUUID();

  const token = await generateZoomJwt({
    zoomVideoSdkKey: c.env.ZOOM_VIDEO_SDK_KEY,
    zoomVideoSdkSecret: c.env.ZOOM_VIDEO_SDK_SECRET,
    sessionName: sessionName,
    userIdentity,
    role: 1,
  });

  return c.json({ sessionName, token });
});

const JoinQuerySchema = z.object({
  userIdentity: z.string().max(34),
});

const JoinParamSchema = z.object({
  sessionName: z.string().min(1).max(199),
});

sessionsRoute.get(
  '/:id',
  zValidator('param', JoinParamSchema),
  zValidator('query', JoinQuerySchema),
  async (c) => {
    const { sessionName } = c.req.valid('param');
    const { userIdentity } = c.req.valid('query');

    const adminJwt = await generateZoomJwt({
      zoomVideoSdkKey: c.env.ZOOM_VIDEO_SDK_KEY,
      zoomVideoSdkSecret: c.env.ZOOM_VIDEO_SDK_SECRET,
      sessionName,
      role: 1,
    });

    await querySession(adminJwt, sessionName);

    const token = await generateZoomJwt({
      zoomVideoSdkKey: c.env.ZOOM_VIDEO_SDK_KEY,
      zoomVideoSdkSecret: c.env.ZOOM_VIDEO_SDK_SECRET,
      sessionName,
      userIdentity,
      role: 1,
    });

    return c.json({ sessionName, token });
  }
);

export default sessionsRoute;
