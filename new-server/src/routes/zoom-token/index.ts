import { Hono } from "hono";

const zoomTokenRoute = new Hono();

zoomTokenRoute.post("/", (c) => {
  return c.text("Hello Hono!");
});

export default zoomTokenRoute;
