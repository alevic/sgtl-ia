ALTER TABLE transaction ADD COLUMN IF NOT EXISTS maintenance_id UUID REFERENCES maintenance(id);
ALTER TABLE transaction ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES reservations(id);
