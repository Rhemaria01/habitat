-- Habitat: habits-only app (drop goals, systems, reviews, and related tables).
-- Order matters: detach habits from systems before dropping systems (no row deletion).

DROP TABLE IF EXISTS "goal_habits";
DROP TABLE IF EXISTS "goal_systems";
DROP TABLE IF EXISTS "goal_checkins";
DROP TABLE IF EXISTS "goals";

ALTER TABLE "habits" DROP CONSTRAINT IF EXISTS "habits_system_id_fkey";
ALTER TABLE "habits" DROP COLUMN IF EXISTS "system_id";

DROP TABLE IF EXISTS "systems";
DROP TABLE IF EXISTS "habit_audits";
DROP TABLE IF EXISTS "reviews";
DROP TABLE IF EXISTS "weekly_reviews";
DROP TABLE IF EXISTS "reflections";
