import { Hono } from "hono";
import { DbContext } from "../..";
import {
  createInterview,
  deleteInterview,
  getAllInterviews,
} from "../../db/queries";
import { dbMiddleware } from "../../db/dbMiddleware";
import { zValidator } from "@hono/zod-validator";
import { interviewDeleteSchema, interviewPostSchema } from "./schema";

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
      console.error("Error creating interview: ", error);
      return c.json({ error: "Error creating interview" }, 500);
    }

    return c.text("Hello Hono!");
  }
);

interviewsRoute.delete(
  "/:id",
  zValidator("param", interviewDeleteSchema),
  async (c) => {
    const { id } = c.req.valid("param");

    try {
      await deleteInterview(c.var.db, id);
    } catch (error) {
      console.error("Error deleting interview: ", error);
      return c.json({ error: "Error deleting interview" }, 500);
    }

    return c.text("Hello Hono!");
  }
);

// interviewsRoute.patch("/", (c) => {
//   return c.text("Hello Hono!");
// });

export default interviewsRoute;
