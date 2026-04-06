-- Add auto-detected geo fields to user profile.
ALTER TABLE "Profile"
ADD COLUMN IF NOT EXISTS "region" TEXT,
ADD COLUMN IF NOT EXISTS "continent" TEXT;