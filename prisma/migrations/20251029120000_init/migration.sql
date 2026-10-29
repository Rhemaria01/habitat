-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "habit_kind" AS ENUM ('build', 'quit');

-- CreateEnum
CREATE TYPE "habit_behavior_type" AS ENUM ('build', 'reduce', 'avoid');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "week_start" SMALLINT NOT NULL DEFAULT 1,
    "identity_note" TEXT,
    "onboarding" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "systems" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "purpose" TEXT,
    "cadence" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "working_well" TEXT NOT NULL DEFAULT '',
    "causing_friction" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_systems" (
    "goal_id" UUID NOT NULL,
    "system_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_systems_pkey" PRIMARY KEY ("goal_id","system_id")
);

-- CreateTable
CREATE TABLE "goal_checkins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "goal_id" UUID NOT NULL,
    "checkin_date" DATE NOT NULL,
    "value" DECIMAL,
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "kind" "habit_kind" NOT NULL,
    "behavior_type" "habit_behavior_type" NOT NULL DEFAULT 'build',
    "description" TEXT,
    "system_id" UUID,
    "category" TEXT,
    "personal_reason" TEXT,
    "start_date" DATE NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#7C9A82',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TIMESTAMPTZ(6),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "stack_after" TEXT,
    "two_minute_version" TEXT,
    "minimum_version" TEXT,
    "standard_version" TEXT,
    "stretch_version" TEXT,
    "estimated_duration_minutes" INTEGER,
    "identity_proof" TEXT,
    "source_key" TEXT,
    "cue_type" TEXT,
    "cue_time" TEXT,
    "cue_place" TEXT,
    "cue_event" TEXT,
    "anchor_habit_id" UUID,
    "cue_notes" TEXT,
    "motivation_meaning" TEXT,
    "motivation_appeal" TEXT,
    "motivation_pairing" TEXT,
    "motivation_social" TEXT,
    "friction_obstacle" TEXT,
    "friction_environment" TEXT,
    "friction_increase" TEXT,
    "commitment_mechanism" TEXT,
    "reward_feedback" TEXT,
    "reward_personal" TEXT,
    "recovery_plan" TEXT,
    "recovery_reminder" BOOLEAN NOT NULL DEFAULT true,
    "schedule_kind" TEXT NOT NULL DEFAULT 'daily',
    "schedule_weekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "schedule_days_per_week" SMALLINT,
    "schedule_custom_days" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "schedule_end_date" DATE,
    "time_window" TEXT,
    "planned_time" TEXT,
    "tracking_type" TEXT NOT NULL DEFAULT 'binary',
    "tracking_unit" TEXT,
    "is_priority" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "habit_id" UUID NOT NULL,
    "log_date" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "numeric_value" DECIMAL,
    "completion_level" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "identity_statement" TEXT,
    "why" TEXT,
    "description" TEXT,
    "outcome_definition" TEXT,
    "metric_type" TEXT,
    "metric_unit" TEXT,
    "baseline_value" DECIMAL,
    "target_value" DECIMAL,
    "current_value" DECIMAL,
    "metric_direction" TEXT NOT NULL DEFAULT 'increase',
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" SMALLINT NOT NULL DEFAULT 0,
    "start_date" DATE,
    "color" TEXT NOT NULL DEFAULT '#A78BFA',
    "target_date" DATE,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal_habits" (
    "goal_id" UUID NOT NULL,
    "habit_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_habits_pkey" PRIMARY KEY ("goal_id","habit_id")
);

-- CreateTable
CREATE TABLE "routines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schedule_kind" TEXT NOT NULL DEFAULT 'daily',
    "schedule_weekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "schedule_custom_days" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "time_window" TEXT,
    "planned_time" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_steps" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "routine_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "habit_id" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "duration_minutes" INTEGER,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routine_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_step_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "routine_step_id" UUID NOT NULL,
    "log_date" DATE NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routine_step_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habit_audits" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "behavior" TEXT NOT NULL,
    "classification" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "review_type" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "responses" JSONB NOT NULL DEFAULT '{}',
    "adjustment_note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_slots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slot_key" TEXT NOT NULL,
    "day_type" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "do_text" TEXT NOT NULL DEFAULT '',
    "dont_text" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routine_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_slot_checks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slot_key" TEXT NOT NULL,
    "slot_date" DATE NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routine_slot_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "routine_habit_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slot_key" TEXT NOT NULL,
    "habit_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routine_habit_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "week_start_date" DATE NOT NULL,
    "moved_closer" BOOLEAN NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reflections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reflect_date" DATE NOT NULL,
    "went_well" TEXT NOT NULL DEFAULT '',
    "distracted" TEXT NOT NULL DEFAULT '',
    "improve_tomorrow" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reflections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "goal_checkins_goal_date_idx" ON "goal_checkins"("goal_id", "checkin_date");

-- CreateIndex
CREATE UNIQUE INDEX "goal_checkins_goal_id_checkin_date_key" ON "goal_checkins"("goal_id", "checkin_date");

-- CreateIndex
CREATE INDEX "habit_logs_habit_date_idx" ON "habit_logs"("habit_id", "log_date");

-- CreateIndex
CREATE UNIQUE INDEX "habit_logs_habit_id_log_date_key" ON "habit_logs"("habit_id", "log_date");

-- CreateIndex
CREATE INDEX "routine_steps_routine_order_idx" ON "routine_steps"("routine_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "routine_step_logs_routine_step_id_log_date_key" ON "routine_step_logs"("routine_step_id", "log_date");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_review_type_period_start_key" ON "reviews"("review_type", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "routine_slots_slot_key_key" ON "routine_slots"("slot_key");

-- CreateIndex
CREATE INDEX "routine_slots_day_order_idx" ON "routine_slots"("day_type", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "routine_slot_checks_slot_key_slot_date_key" ON "routine_slot_checks"("slot_key", "slot_date");

-- CreateIndex
CREATE UNIQUE INDEX "routine_habit_links_slot_key_habit_id_key" ON "routine_habit_links"("slot_key", "habit_id");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_reviews_week_start_date_key" ON "weekly_reviews"("week_start_date");

-- CreateIndex
CREATE UNIQUE INDEX "reflections_reflect_date_key" ON "reflections"("reflect_date");

-- AddForeignKey
ALTER TABLE "goal_systems" ADD CONSTRAINT "goal_systems_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_systems" ADD CONSTRAINT "goal_systems_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_checkins" ADD CONSTRAINT "goal_checkins_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habits" ADD CONSTRAINT "habits_anchor_habit_id_fkey" FOREIGN KEY ("anchor_habit_id") REFERENCES "habits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_habits" ADD CONSTRAINT "goal_habits_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal_habits" ADD CONSTRAINT "goal_habits_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_steps" ADD CONSTRAINT "routine_steps_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_steps" ADD CONSTRAINT "routine_steps_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_step_logs" ADD CONSTRAINT "routine_step_logs_routine_step_id_fkey" FOREIGN KEY ("routine_step_id") REFERENCES "routine_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_habit_links" ADD CONSTRAINT "routine_habit_links_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- updated_at triggers (app also sets updated_at; triggers keep SQL updates honest)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON "profiles" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER systems_updated_at BEFORE UPDATE ON "systems" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER habits_updated_at BEFORE UPDATE ON "habits" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER habit_logs_updated_at BEFORE UPDATE ON "habit_logs" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER goals_updated_at BEFORE UPDATE ON "goals" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER routines_updated_at BEFORE UPDATE ON "routines" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER routine_steps_updated_at BEFORE UPDATE ON "routine_steps" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER routine_slots_updated_at BEFORE UPDATE ON "routine_slots" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER habit_audits_updated_at BEFORE UPDATE ON "habit_audits" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON "reviews" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER reflections_updated_at BEFORE UPDATE ON "reflections" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Bootstrap a single profile row when the database is empty
INSERT INTO "profiles" ("id")
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM "profiles");
