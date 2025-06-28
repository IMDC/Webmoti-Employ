import { Hono } from "hono";
import zoomTokenRoute from "./routes/zoom-token";
import interviewsRoute from "./routes/interviews";

const app = new Hono();

app.route("/zoom-token", zoomTokenRoute);
app.route("/interviews", interviewsRoute);

export default app;
