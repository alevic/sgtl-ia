-- Add payment columns to reservations table
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0;
