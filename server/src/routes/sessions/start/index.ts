import { Hono } from "hono";
import { BaseContext } from "../../..";
import { zValidator } from "@hono/zod-validator";
import { StartSessionSchema } from "./schema";
import { generateZoomJwt } from "../jwt";

const startSessionRoute = new Hono<BaseContext>();

startSessionRoute.post(
  "/",
  zValidator("json", StartSessionSchema),
  async (c) => {
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
  }
);

export default startSessionRoute;
