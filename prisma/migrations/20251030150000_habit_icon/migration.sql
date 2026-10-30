-- Add optional icon key for habit cards and forms
ALTER TABLE "habits" ADD COLUMN IF NOT EXISTS "icon" TEXT;
