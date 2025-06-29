import { Hono } from "hono";
import { env } from "hono/adapter";
import { generateZoomJwt } from "./jwt";
import { zoomTokenSchema } from "./schema";

const zoomTokenRoute = new Hono();

zoomTokenRoute.post("/", async (c) => {
  const body = await c.req.json();
  const result = zoomTokenSchema.safeParse(body);

  if (!result.success) {
    return c.json({ errors: result.error.flatten() }, 400);
  }

  const input = result.data;
  const { ZOOM_VIDEO_SDK_KEY } = env<{ ZOOM_VIDEO_SDK_KEY: string }>(c);

  const jwt = await generateZoomJwt({
    ...input,
    zoomVideoSdkKey: ZOOM_VIDEO_SDK_KEY,
  });

  return c.json({ signature: jwt });
});

export default zoomTokenRoute;
