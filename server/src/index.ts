import { Hono } from "hono";
import sessionsRoute from "./routes/sessions";
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

app.route("/sessions", sessionsRoute);
app.route("/interviews", interviewsRoute);

export default app;
