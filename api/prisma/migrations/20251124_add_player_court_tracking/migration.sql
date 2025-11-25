-- Add player court tracking fields
-- Step 1: Add new columns
ALTER TABLE "boxscore_players" ADD COLUMN "secondsPlayed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "boxscore_players" ADD COLUMN "onCourt" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "boxscore_players" ADD COLUMN "lastSubTime" INTEGER;

-- Step 2: Migrate existing minutes data (convert minutes to seconds)
UPDATE "boxscore_players" SET "secondsPlayed" = "minutes" * 60;

-- Step 3: Drop the old minutes column
ALTER TABLE "boxscore_players" DROP COLUMN "minutes";
