-- Migration: Add sessions table for database-based session management
-- This replaces localStorage-based session management to solve caching issues

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,                    -- Format: session-{table}-{timestamp}-{random}
  table_number TEXT NOT NULL,             -- A1, B2, etc.
  desk_id INTEGER REFERENCES desks(id),   -- Link to physical desk (optional)
  shop_id INTEGER REFERENCES shops(id) NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'expired', 'completed')),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_activity TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP NOT NULL,          -- Auto-expiration (4 hours default)
  metadata JSONB DEFAULT '{}'::jsonb      -- Additional session data
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_table_number ON sessions(table_number);
CREATE INDEX IF NOT EXISTS idx_sessions_shop_id ON sessions(shop_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);

-- Add desk_id to cart_items for better relationship tracking
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS desk_id INTEGER REFERENCES desks(id);

-- Create index for cart_items desk_id
CREATE INDEX IF NOT EXISTS idx_cart_items_desk_id ON cart_items(desk_id);

-- Add session tracking to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS session_id TEXT REFERENCES sessions(id);

-- Create index for orders session_id
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);

-- Function to automatically update last_activity
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE sessions 
  SET last_activity = NOW() 
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session activity on cart operations
DROP TRIGGER IF EXISTS trigger_update_session_activity_cart ON cart_items;
CREATE TRIGGER trigger_update_session_activity_cart
  AFTER INSERT OR UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

-- Trigger to update session activity on order operations
DROP TRIGGER IF EXISTS trigger_update_session_activity_orders ON orders;
CREATE TRIGGER trigger_update_session_activity_orders
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.session_id IS NOT NULL)
  EXECUTE FUNCTION update_session_activity();

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired sessions and their associated cart items
  WITH expired_sessions AS (
    DELETE FROM sessions 
    WHERE expires_at < NOW() OR status = 'expired'
    RETURNING id
  ),
  deleted_cart_items AS (
    DELETE FROM cart_items 
    WHERE session_id IN (SELECT id FROM expired_sessions)
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_count FROM expired_sessions;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job function (to be called by cron or application)
CREATE OR REPLACE FUNCTION schedule_session_cleanup()
RETURNS void AS $$
BEGIN
  PERFORM cleanup_expired_sessions();
  -- Log cleanup activity
  INSERT INTO system_logs (message, level, created_at) 
  VALUES ('Session cleanup completed', 'info', NOW())
  ON CONFLICT DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore errors if system_logs table doesn't exist
    NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO PUBLIC;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;

-- Insert sample data for testing
INSERT INTO sessions (id, table_number, shop_id, expires_at, metadata) 
VALUES 
  ('session-A1-' || EXTRACT(EPOCH FROM NOW())::bigint || '-test001', 'A1', 1, NOW() + INTERVAL '4 hours', '{"test": true}'),
  ('session-B2-' || EXTRACT(EPOCH FROM NOW())::bigint || '-test002', 'B2', 1, NOW() + INTERVAL '4 hours', '{"test": true}')
ON CONFLICT (id) DO NOTHING;

-- Verify the migration
DO $$
BEGIN
  -- Check if sessions table exists and has correct structure
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
    RAISE EXCEPTION 'Sessions table was not created successfully';
  END IF;
  
  -- Check if indexes exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sessions_table_number') THEN
    RAISE EXCEPTION 'Sessions table indexes were not created successfully';
  END IF;
  
  RAISE NOTICE 'Sessions table migration completed successfully';
END $$;
