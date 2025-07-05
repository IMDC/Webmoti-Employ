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

sessionsRoute.post("/", zValidator("json", StartSessionSchema), async (c) => {
  const data = c.req.valid("json");

  const sessionName = crypto.randomUUID();

  const jwt = await generateZoomJwt({
    zoomVideoSdkKey: c.env.ZOOM_VIDEO_SDK_KEY,
    zoomVideoSdkSecret: c.env.ZOOM_VIDEO_SDK_SECRET,
    sessionName: sessionName,
    userIdentity: data.userIdentity,
    role: 1,
  });

  return c.json({ signature: jwt });
});

const JoinSessionSchema = z.object({
  userIdentity: z.string().max(34),
  sessionName: z.string().min(1).max(199),
});

sessionsRoute.post("/:id", zValidator("json", JoinSessionSchema), async (c) => {
  const data = c.req.valid("json");

  //   const adminJwt = await generateZoomJwt({
  //     zoomVideoSdkKey: c.env.ZOOM_VIDEO_SDK_KEY,
  //     zoomVideoSdkSecret: c.env.ZOOM_VIDEO_SDK_SECRET,
  //     sessionName: data.sessionName,
  //     role: 1,
  //   });

  //   await querySession(adminJwt);

  //   const jwt = await generateZoomJwt({
  //     zoomVideoSdkKey: c.env.ZOOM_VIDEO_SDK_KEY,
  //     zoomVideoSdkSecret: c.env.ZOOM_VIDEO_SDK_SECRET,
  //     sessionName: data.sessionName,
  //     userIdentity: data.userIdentity,
  //     role: 1,
  //   });

  return c.json({ signature: "jwt" });
});

export default sessionsRoute;
