-- Create companies table linked to organization
CREATE TABLE IF NOT EXISTS "companies" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
    "legal_name" VARCHAR(255), -- Razão Social
    "cnpj" VARCHAR(20),
    "address" TEXT,
    "phone" VARCHAR(20),
    "contact_email" VARCHAR(255),
    "website" VARCHAR(255),
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW(),
    CONSTRAINT "companies_organization_id_unique" UNIQUE ("organization_id")
);

-- Remove columns from organization table (cleanup)
ALTER TABLE "organization" DROP COLUMN IF EXISTS "cnpj";
ALTER TABLE "organization" DROP COLUMN IF EXISTS "address";
ALTER TABLE "organization" DROP COLUMN IF EXISTS "contact_email";
ALTER TABLE "organization" DROP COLUMN IF EXISTS "phone";
