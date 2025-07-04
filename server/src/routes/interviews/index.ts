import { Hono } from "hono";
import { DbContext } from "../..";
import {
  createInterview,
  deleteInterview,
  getAllInterviews,
} from "./db-queries";
import { dbMiddleware } from "../../db/dbMiddleware";
import { interviewDeleteSchema, interviewPostSchema } from "./schema";
import { zValidator } from "../../validator-wrapper";

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

    await createInterview(
      c.var.db,
      data.creatorId,
      data.startTime,
      data.endTime,
      data.invites
    );

    return c.json({ message: "Interview created" }, 201);
  }
);

interviewsRoute.delete(
  "/:id",
  zValidator("param", interviewDeleteSchema),
  async (c) => {
    const { id } = c.req.valid("param");

    await deleteInterview(c.var.db, id);

    return c.body(null, 204);
  }
);

// interviewsRoute.patch("/", (c) => {
//   return c.text("Hello Hono!");
// });

export default interviewsRoute;
