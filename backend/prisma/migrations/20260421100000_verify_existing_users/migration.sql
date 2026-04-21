-- Mark all pre-existing users as verified so they are not locked out
UPDATE "User" SET "isVerified" = true WHERE "isVerified" = false;
