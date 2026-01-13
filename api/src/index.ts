import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import * as Sentry from "@sentry/node";
import actions from "./routes/actions";
import games from "./routes/games";
import teams from "./routes/teams";
import substitutions from "./routes/substitutions";

// Initialize Sentry (optional)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
  });
}

const app = new Hono();

// Middleware
app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use("*", logger());
app.use("*", prettyJSON());

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Root endpoint
app.get("/", (c) => {
  return c.json({
    message: "Basketball Stats API",
    version: "1.0.0",
  });
});

// Mount routes
app.route("/api/actions", actions);
app.route("/api/games", games);
app.route("/api/teams", teams);
app.route("/api/substitutions", substitutions);

const port = parseInt(process.env.PORT || "3002");

console.log(`🚀 API running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
