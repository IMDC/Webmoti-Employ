import { Hono } from "hono";
import zoomTokenRoute from "./routes/zoom-token";
import interviewsRoute from "./routes/interviews";
import { Kysely } from "kysely";
import { DB } from "./db/schema";

export type BaseContext = {
  Bindings: CloudflareBindings;
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
