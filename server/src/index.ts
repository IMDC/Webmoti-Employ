import { Hono } from "hono";
import zoomTokenRoute from "./routes/zoom-token";
import interviewsRoute from "./routes/interviews";

export type Env = {
  ZOOM_VIDEO_SDK_KEY: string;
  ZOOM_VIDEO_SDK_SECRET: string;
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Env }>();

app.route("/zoom-token", zoomTokenRoute);
app.route("/interviews", interviewsRoute);

export default app;
