ALTER TABLE "User"
ADD COLUMN "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false;

-- Existing users have already used the app; avoid forcing onboarding retroactively.
UPDATE "User"
SET
    "hasCompletedOnboarding" = true;