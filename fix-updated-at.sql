-- Fix NULL updatedAt values in member table
UPDATE member SET "updatedAt" = COALESCE("updatedAt", "createdAt", NOW()) WHERE "updatedAt" IS NULL;

-- Fix NULL updatedAt values in other tables if needed
UPDATE trips SET "updatedAt" = COALESCE("updatedAt", "createdAt", NOW()) WHERE "updatedAt" IS NULL;
UPDATE clients SET "updatedAt" = COALESCE("updatedAt", "createdAt", NOW()) WHERE "updatedAt" IS NULL;
UPDATE driver SET "updated_at" = COALESCE("updated_at", "created_at", NOW()) WHERE "updated_at" IS NULL;
UPDATE vehicle SET "updatedAt" = COALESCE("updatedAt", "createdAt", NOW()) WHERE "updatedAt" IS NULL;
