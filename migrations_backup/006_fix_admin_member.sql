-- Ensure Org exists
INSERT INTO organization (id, name, slug, created_at)
SELECT gen_random_uuid(), 'JJê Turismo', 'jje-turismo', NOW()
WHERE NOT EXISTS (SELECT 1 FROM organization WHERE slug = 'jje-turismo');

-- Link Admin to Org
INSERT INTO member (id, "organizationId", "userId", role, "createdAt")
SELECT 
    gen_random_uuid(),
    (SELECT id FROM organization WHERE slug = 'jje-turismo'),
    (SELECT id FROM "user" WHERE email = 'admin@sgtl.com'),
    'admin',
    NOW()
WHERE EXISTS (SELECT 1 FROM "user" WHERE email = 'admin@sgtl.com')
AND NOT EXISTS (
    SELECT 1 FROM member 
    WHERE "userId" = (SELECT id FROM "user" WHERE email = 'admin@sgtl.com')
    AND "organizationId" = (SELECT id FROM organization WHERE slug = 'jje-turismo')
);
