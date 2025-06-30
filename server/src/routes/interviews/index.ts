import { Hono } from "hono";
import { DbContext } from "../..";
import { getAllInterviews } from "../../db/queries";
import { dbMiddleware } from "../../db/dbMiddleware";

const interviewsRoute = new Hono<DbContext>();

interviewsRoute.use("*", dbMiddleware);

interviewsRoute.get("/", async (c) => {
  const interviews = await getAllInterviews(c.var.db);
  return c.json({ interviews });
});

interviewsRoute.post("/", (c) => {
  return c.text("Hello Hono!");
});

interviewsRoute.patch("/", (c) => {
  return c.text("Hello Hono!");
});

interviewsRoute.delete("/", (c) => {
  return c.text("Hello Hono!");
});

export default interviewsRoute;
