import { Hono } from "hono";

const interviewsRoute = new Hono();

interviewsRoute.get("/", (c) => {
  return c.text("Hello Hono!");
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
