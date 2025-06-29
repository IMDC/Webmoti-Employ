import { Hono } from "hono";
import { generateZoomJwt } from "./jwt";
import { zoomTokenSchema } from "./schema";
import { CloudflareBindings } from "../..";

const zoomTokenRoute = new Hono<{ Bindings: CloudflareBindings }>();

zoomTokenRoute.post("/", async (c) => {
  const body = await c.req.json();
  const result = zoomTokenSchema.safeParse(body);

  if (!result.success) {
    return c.json({ errors: result.error.flatten() }, 400);
  }

  const input = result.data;

  const jwt = await generateZoomJwt({
    ...input,
    zoomVideoSdkKey: c.env.ZOOM_VIDEO_SDK_KEY,
  });

  return c.json({ signature: jwt });
});

export default zoomTokenRoute;
