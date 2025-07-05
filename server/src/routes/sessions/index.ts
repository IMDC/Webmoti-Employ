import { Hono } from "hono";
import { zValidator } from "../../validator-wrapper";
import { generateZoomJwt } from "./jwt";
import { BaseContext } from "../..";
import { z } from "zod/v4";
import { querySession } from "./querySession";

const sessionsRoute = new Hono<BaseContext>();

const StartSessionSchema = z.object({
  userIdentity: z.string().max(34),
});

sessionsRoute.get("/", zValidator("query", StartSessionSchema), async (c) => {
  const { userIdentity } = c.req.valid("query");

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

const JoinSessionSchema = z.object({
  userIdentity: z.string().max(34),
  sessionName: z.string().min(1).max(199),
});

const RouteParamSchema = z.object({
  id: z.string().min(1),
});

sessionsRoute.get(
  "/:id",
  zValidator("param", RouteParamSchema),
  zValidator("query", JoinSessionSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { userIdentity, sessionName } = c.req.valid("query");

    const adminJwt = await generateZoomJwt({
      zoomVideoSdkKey: c.env.ZOOM_VIDEO_SDK_KEY,
      zoomVideoSdkSecret: c.env.ZOOM_VIDEO_SDK_SECRET,
      sessionName,
      role: 1,
    });

    await querySession(adminJwt, id);

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
