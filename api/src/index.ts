import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import * as Sentry from "@sentry/node";

// Import routes
import { teams } from "./routes/teams";
import { games } from "./routes/games";
import { events } from "./routes/events";
import { boxscore } from "./routes/boxscore";
import { isSupabaseConfigured } from "./lib/supabase";

// Initialize Sentry
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

// Mount routes
app.route("/teams", teams);
app.route("/games", games);
app.route("/games", events);
app.route("/games", boxscore);

// Root endpoint
app.get("/", (c) => {
  return c.json({
    message: "Basketball Stats API",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      teams: "/teams/:teamId",
      players: "/teams/:teamId/players",
      games: "/games",
      events: "/games/:gameId/events",
      boxscore: "/games/:gameId/boxscore",
    },
  });
});

const port = parseInt(process.env.PORT || "3002");

console.log(`🏀 Basketball Stats API running on port ${port}`);
console.log(`📡 Supabase realtime: ${isSupabaseConfigured ? '✅ Configured' : '⚠️  Not configured (development mode)'}`);
console.log(`🔐 Authentication: ${isSupabaseConfigured ? '✅ Enabled' : '🔓 Disabled (development mode)'}`);

serve({
  fetch: app.fetch,
  port,
});
