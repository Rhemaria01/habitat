-- Habitat uses Prisma server-side only (postgres role). Enable RLS so PostgREST
-- anon/authenticated roles cannot read/write via the Supabase Data API.
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."systems" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."goal_systems" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."goal_checkins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."habits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."habit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."goal_habits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."routines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."routine_steps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."routine_step_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."habit_audits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."routine_slots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."routine_slot_checks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."routine_habit_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."weekly_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."reflections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
