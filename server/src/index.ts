import { Hono } from "hono";
import sessionsRoute from "./routes/sessions";
import interviewsRoute from "./routes/interviews";
import { Kysely } from "kysely";
import { DB } from "./db/schema";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";

export type BaseContext = {
  Bindings: CloudflareBindings;
};

export type DbContext = BaseContext & {
  Variables: {
    db: Kysely<DB>;
  };
};

const app = new Hono<BaseContext>();

app.use("*", clerkMiddleware());

// all routes require authentication
app.use("*", async (c, next) => {
  const auth = getAuth(c);
  if (!auth?.userId) {
    return c.json({ message: "Unauthorized" }, 401);
  }
  return next();
});

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal Server Error" }, 500);
});

app.route("/sessions", sessionsRoute);
app.route("/interviews", interviewsRoute);

export default app;
