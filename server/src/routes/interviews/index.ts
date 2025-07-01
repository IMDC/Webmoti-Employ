import { Hono } from "hono";
import { DbContext } from "../..";
import { createInterview, getAllInterviews } from "../../db/queries";
import { dbMiddleware } from "../../db/dbMiddleware";
import { zValidator } from "@hono/zod-validator";
import { interviewPostSchema } from "./schema";

const interviewsRoute = new Hono<DbContext>();

interviewsRoute.use("*", dbMiddleware);

interviewsRoute.get("/", async (c) => {
  const interviews = await getAllInterviews(c.var.db);
  return c.json({ interviews });
});

interviewsRoute.post(
  "/",
  zValidator("json", interviewPostSchema),
  async (c) => {
    const data = c.req.valid("json");

    try {
      await createInterview(
        c.var.db,
        data.creatorId,
        data.startTime,
        data.endTime,
        data.invites
      );
    } catch (error) {
      return c.json({ error: "Error creating interview" }, 500);
    }

    return c.text("Hello Hono!");
  }
);

interviewsRoute.delete("/", (c) => {
  return c.text("Hello Hono!");
});

// interviewsRoute.patch("/", (c) => {
//   return c.text("Hello Hono!");
// });

export default interviewsRoute;
