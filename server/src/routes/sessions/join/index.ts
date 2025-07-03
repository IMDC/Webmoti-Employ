import { Hono } from "hono";
import { BaseContext } from "../../..";
import { generateZoomJwt } from "../jwt";
import { zValidator } from "@hono/zod-validator";
import { JoinSessionSchema } from "./schema";
import { querySession } from "./querySession";

const joinSessionRoute = new Hono<BaseContext>();

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
