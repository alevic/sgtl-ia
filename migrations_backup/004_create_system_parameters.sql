CREATE TABLE IF NOT EXISTS system_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, key)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_parameters_org ON system_parameters(organization_id);
