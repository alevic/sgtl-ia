CREATE TABLE IF NOT EXISTS member (
    id TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_member_user_org ON member("userId", "organizationId");

CREATE TABLE IF NOT EXISTS invitation (
    id TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT,
    status TEXT NOT NULL,
    "expiresAt" TIMESTAMP NOT NULL,
    "inviterId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP
);
