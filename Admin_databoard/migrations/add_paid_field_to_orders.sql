-- Add paid field to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid BOOLEAN NOT NULL DEFAULT FALSE;

-- Update any existing completed orders to be marked as paid
UPDATE orders SET paid = TRUE WHERE status = 'completed'; 