import { Hono } from "hono";
import { prisma } from "@/lib/db";
import { GameEventSchema, BatchEventSchema } from "@/lib/validation";
import { authMiddleware } from "@/middleware/auth";
import { idempotencyMiddleware } from "@/middleware/idempotency";
import {
  broadcastGameEvent,
  broadcastGameHeader,
  broadcastBoxScore,
} from "@/lib/supabase";
import { calculateBoxScores } from "@/lib/boxscore";

const events = new Hono();

// POST /games/:gameId/events - Ingest game events (single or batch)
events.post(
  "/:gameId/events",
  authMiddleware,
  idempotencyMiddleware,
  async (c) => {
    try {
      const body = await c.req.json();
      console.log("body", body);

      // Handle both single event and batch

      console.log("Request body:", JSON.stringify(body, null, 2));
      console.log("body.events:", body.events);
      console.log("Array.isArray(body.events):", Array.isArray(body.events));

      const eventsToProcess = Array.isArray(body.events)
        ? BatchEventSchema.parse(body).events
        : [GameEventSchema.parse(body)];

      console.log("eventsToProcess:", eventsToProcess);

      if (eventsToProcess.length === 0) {
        return c.json({ error: "No events to process" }, 400);
      }

      // Get gameId from the first event
      const gameId = eventsToProcess[0].gameId;
      console.log("gameId from eventData:", gameId);

      // Process events in transaction
      let result;
      try {
        result = await prisma.$transaction(async (tx) => {
          const createdEvents = [];

          for (const eventData of eventsToProcess) {
            console.log("eventData", eventData);
            // Create event with server timestamp
            const event = await tx.gameEvent.create({
              data: eventData,
            });
            createdEvents.push(event);
          }

          // Recalculate box scores after all events
          await calculateBoxScores(gameId, tx);

          console.log("boxscore calculated");

          // Update game scores if needed
          console.log("Calling updateGameScores with gameId:", gameId);
          const gameUpdate = await updateGameScores(gameId, tx);

          console.log("gameUpdate", gameUpdate);

          console.log("About to return from transaction, createdEvents count:", createdEvents.length);
          return { events: createdEvents, gameUpdate };
        }, {
          maxWait: 10000, // Maximum time to wait for a transaction slot (10s)
          timeout: 20000, // Maximum time the transaction can run (20s)
        });

        console.log("Transaction completed successfully");
        console.log("result", result);
      } catch (txError) {
        console.error("Transaction failed:", txError);
        throw txError;
      }

      // Broadcast events via Supabase Realtime
      for (const event of result.events) {
        await broadcastGameEvent(gameId, {
          type: "event:new",
          payload: event,
        });
      }

      // Broadcast game header update
      if (result.gameUpdate) {
        await broadcastGameHeader(gameId, {
          type: "header:update",
          payload: result.gameUpdate,
        });
      }

      // Broadcast updated box scores
      const teamBoxScores = await prisma.boxScoreTeam.findMany({
        where: { gameId },
      });

      if (teamBoxScores.length > 0) {
        await broadcastBoxScore(gameId, {
          type: "boxscore:update",
          payload: {
            teamBoxScores,
            updatedAt: new Date().toISOString(),
          },
        });
      }

      return c.json(
        {
          success: true,
          events: result.events,
          count: result.events.length,
        },
        201
      );
    } catch (error: any) {
      if (error.name === "ZodError") {
        return c.json(
          {
            error: "Validation failed",
            details: error.errors,
          },
          400
        );
      }
      if (error.code === "P2002") {
        return c.json(
          {
            error: "Duplicate event (idempotency key already used)",
          },
          409
        );
      }
      return c.json({ error: "Failed to process events" }, 500);
    }
  }
);

// GET /games/:gameId/events - Get play-by-play events
events.get("/:gameId/events", async (c) => {
  try {
    const gameId = c.req.param("gameId");
    const period = c.req.query("period");
    const limit = c.req.query("limit");

    const where: any = { gameId };
    if (period) where.period = parseInt(period);

    const events = await prisma.gameEvent.findMany({
      where,
      orderBy: [{ period: "desc" }, { clockSec: "desc" }, { tsServer: "desc" }],
      take: limit ? parseInt(limit) : undefined,
    });

    return c.json({ events });
  } catch (error) {
    return c.json({ error: "Failed to fetch events" }, 500);
  }
});

// Helper function to update game scores based on events
async function updateGameScores(gameId: string, tx: any) {
  console.log("gameId", gameId);
  const teamStats = await tx.boxScoreTeam.findMany({
    where: { gameId },
  });

  console.log("teamStats", teamStats);

  const ourTeam = teamStats.find((t: any) => t.teamSide === "US");
  const oppTeam = teamStats.find((t: any) => t.teamSide === "OPP");

  console.log("ourTeam found:", ourTeam);
  console.log("oppTeam found:", oppTeam);
  console.log("ourTeam pts:", ourTeam?.pts);
  console.log("oppTeam pts:", oppTeam?.pts);

  if (ourTeam || oppTeam) {
    console.log("ourTeam", ourTeam);
    console.log("oppTeam", oppTeam);
    console.log("gameId", gameId);
    console.log("About to update game with scores:", {
      gameId,
      ourScore: ourTeam?.pts || 0,
      oppScore: oppTeam?.pts || 0
    });
    const game = await tx.game.update({
      where: { id: gameId },
      data: {
        ourScore: ourTeam?.pts || 0,
        oppScore: oppTeam?.pts || 0,
      },
    });

    console.log("game", game);

    return {
      ourScore: game.ourScore,
      oppScore: game.oppScore,
      period: game.period,
      clockSec: game.clockSec,
      status: game.status,
    };
  }

  return null;
}

export { events };
