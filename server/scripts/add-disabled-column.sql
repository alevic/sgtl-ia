-- Add disabled column to seat table
ALTER TABLE seat ADD COLUMN IF NOT EXISTS disabled BOOLEAN DEFAULT FALSE;
