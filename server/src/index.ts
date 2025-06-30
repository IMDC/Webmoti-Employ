import { Hono } from "hono";
import zoomTokenRoute from "./routes/zoom-token";
import interviewsRoute from "./routes/interviews";
import { Kysely } from "kysely";
import { DB } from "./db/schema";

type Hyperdrive = {
  connectionString: string;
};

export type Bindings = {
  ZOOM_VIDEO_SDK_KEY: string;
  ZOOM_VIDEO_SDK_SECRET: string;
  HYPERDRIVE: Hyperdrive;
};

export type BaseContext = {
  Bindings: Bindings;
};

export type DbContext = BaseContext & {
  Variables: {
    db: Kysely<DB>;
  };
};

const app = new Hono<BaseContext>();

app.route("/zoom-token", zoomTokenRoute);
app.route("/interviews", interviewsRoute);

export default app;
