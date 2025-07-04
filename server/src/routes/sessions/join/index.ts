import { Hono } from "hono";
import { BaseContext } from "../../..";
import { generateZoomJwt } from "../jwt";
import { zValidator } from "@hono/zod-validator";
import { querySession } from "./querySession";
import { z } from "zod/v4";

const joinSessionRoute = new Hono<BaseContext>();

const JoinSessionSchema = z.object({
  userIdentity: z.string().max(34),
  sessionName: z.string().min(1).max(199),
});

joinSessionRoute.post("/", zValidator("json", JoinSessionSchema), async (c) => {
  const data = c.req.valid("json");

  const adminJwt = await generateZoomJwt({
    zoomVideoSdkKey: c.env.ZOOM_VIDEO_SDK_KEY,
    zoomVideoSdkSecret: c.env.ZOOM_VIDEO_SDK_SECRET,
    sessionName: data.sessionName,
    role: 1,
  });

  await querySession(adminJwt);

  const jwt = await generateZoomJwt({
    zoomVideoSdkKey: c.env.ZOOM_VIDEO_SDK_KEY,
    zoomVideoSdkSecret: c.env.ZOOM_VIDEO_SDK_SECRET,
    sessionName: data.sessionName,
    userIdentity: data.userIdentity,
    role: 1,
  });

  return c.json({ signature: jwt });
});

export default joinSessionRoute;
