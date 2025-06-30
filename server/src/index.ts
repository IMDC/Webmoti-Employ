import { Hono } from "hono";
import zoomTokenRoute from "./routes/zoom-token";
import interviewsRoute from "./routes/interviews";

export type CloudflareBindings = {
  ZOOM_VIDEO_SDK_KEY: string;
  ZOOM_VIDEO_SDK_SECRET: string;
};

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.route("/zoom-token", zoomTokenRoute);
app.route("/interviews", interviewsRoute);

export default app;
