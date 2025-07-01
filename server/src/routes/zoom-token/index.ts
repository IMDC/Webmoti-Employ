import { Hono } from "hono";
import { generateZoomJwt } from "./jwt";
import { zoomTokenSchema } from "./schema";
import { BaseContext } from "../..";
import { zValidator } from "@hono/zod-validator";

const zoomTokenRoute = new Hono<BaseContext>();

zoomTokenRoute.post("/", zValidator("json", zoomTokenSchema), async (c) => {
  const data = c.req.valid("json");

  const jwt = await generateZoomJwt({
    ...data,
    zoomVideoSdkKey: c.env.ZOOM_VIDEO_SDK_KEY,
    zoomVideoSdkSecret: c.env.ZOOM_VIDEO_SDK_SECRET,
  });

  return c.json({ signature: jwt });
});

export default zoomTokenRoute;
