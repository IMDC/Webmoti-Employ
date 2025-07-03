import { Hono } from "hono";
import startSessionRoute from "./start";
import joinSessionRoute from "./join";

const sessionsRoute = new Hono();

sessionsRoute.route("/start", startSessionRoute);
sessionsRoute.route("/join", joinSessionRoute);

export default sessionsRoute;
