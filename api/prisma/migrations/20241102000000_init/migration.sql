-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('PLANNED', 'LIVE', 'FINAL');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('SHOT_2_MADE', 'SHOT_2_MISS', 'SHOT_3_MADE', 'SHOT_3_MISS', 'FT_MADE', 'FT_MISS', 'REB_O', 'REB_D', 'AST', 'STL', 'BLK', 'TOV', 'FOUL', 'SUB_IN', 'SUB_OUT', 'TIMEOUT', 'START_PERIOD', 'END_PERIOD');

-- CreateEnum
CREATE TYPE "TeamSide" AS ENUM ('US', 'OPP');

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "jersey" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "position" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "opponent" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "status" "GameStatus" NOT NULL DEFAULT 'PLANNED',
    "period" INTEGER NOT NULL DEFAULT 1,
    "clockSec" INTEGER NOT NULL DEFAULT 600,
    "ourScore" INTEGER NOT NULL DEFAULT 0,
    "oppScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_events" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "tsServer" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period" INTEGER NOT NULL,
    "clockSec" INTEGER NOT NULL,
    "teamSide" "TeamSide" NOT NULL,
    "playerId" TEXT,
    "type" "EventType" NOT NULL,
    "meta" JSONB,
    "ingestKey" TEXT NOT NULL,

    CONSTRAINT "game_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boxscore_players" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "pts" INTEGER NOT NULL DEFAULT 0,
    "fgm2" INTEGER NOT NULL DEFAULT 0,
    "fga2" INTEGER NOT NULL DEFAULT 0,
    "fgm3" INTEGER NOT NULL DEFAULT 0,
    "fga3" INTEGER NOT NULL DEFAULT 0,
    "ftm" INTEGER NOT NULL DEFAULT 0,
    "fta" INTEGER NOT NULL DEFAULT 0,
    "oreb" INTEGER NOT NULL DEFAULT 0,
    "dreb" INTEGER NOT NULL DEFAULT 0,
    "ast" INTEGER NOT NULL DEFAULT 0,
    "stl" INTEGER NOT NULL DEFAULT 0,
    "blk" INTEGER NOT NULL DEFAULT 0,
    "tov" INTEGER NOT NULL DEFAULT 0,
    "pf" INTEGER NOT NULL DEFAULT 0,
    "plusMinus" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "boxscore_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boxscore_teams" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "teamSide" "TeamSide" NOT NULL,
    "pts" INTEGER NOT NULL DEFAULT 0,
    "fgm2" INTEGER NOT NULL DEFAULT 0,
    "fga2" INTEGER NOT NULL DEFAULT 0,
    "fgm3" INTEGER NOT NULL DEFAULT 0,
    "fga3" INTEGER NOT NULL DEFAULT 0,
    "ftm" INTEGER NOT NULL DEFAULT 0,
    "fta" INTEGER NOT NULL DEFAULT 0,
    "oreb" INTEGER NOT NULL DEFAULT 0,
    "dreb" INTEGER NOT NULL DEFAULT 0,
    "ast" INTEGER NOT NULL DEFAULT 0,
    "stl" INTEGER NOT NULL DEFAULT 0,
    "blk" INTEGER NOT NULL DEFAULT 0,
    "tov" INTEGER NOT NULL DEFAULT 0,
    "pf" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "boxscore_teams_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_teamId_jersey_key" ON "players"("teamId", "jersey");

-- CreateIndex
CREATE UNIQUE INDEX "game_events_gameId_ingestKey_key" ON "game_events"("gameId", "ingestKey");

-- CreateIndex
CREATE INDEX "game_events_gameId_tsServer_idx" ON "game_events"("gameId", "tsServer");

-- CreateIndex
CREATE UNIQUE INDEX "boxscore_players_gameId_playerId_key" ON "boxscore_players"("gameId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "boxscore_teams_gameId_teamSide_key" ON "boxscore_teams"("gameId", "teamSide");

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_events" ADD CONSTRAINT "game_events_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;