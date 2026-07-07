-- ============================================================
--  WealthLens — Fix plaid_items table (missing columns)
--  Run in Supabase SQL Editor
-- ============================================================

-- Create the table if it somehow doesn't exist at all
CREATE TABLE IF NOT EXISTS plaid_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add every column the Plaid integration code expects, idempotently
ALTER TABLE plaid_items
  ADD COLUMN IF NOT EXISTS user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS item_id           TEXT,
  ADD COLUMN IF NOT EXISTS access_token      TEXT,
  ADD COLUMN IF NOT EXISTS institution_name  TEXT,
  ADD COLUMN IF NOT EXISTS institution_id    TEXT,
  ADD COLUMN IF NOT EXISTS status            TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS cursor            TEXT,
  ADD COLUMN IF NOT EXISTS last_synced       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS error_code        TEXT;

-- Legacy column from an earlier schema iteration — current code writes to
-- `item_id`, not `plaid_item_id`. Drop the NOT NULL so old leftover column
-- doesn't block inserts.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'plaid_items' AND column_name = 'plaid_item_id'
  ) THEN
    ALTER TABLE plaid_items ALTER COLUMN plaid_item_id DROP NOT NULL;
  END IF;
END $$;

-- item_id must be unique for the upsert's onConflict: 'item_id' to work
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'plaid_items_item_id_key'
  ) THEN
    ALTER TABLE plaid_items ADD CONSTRAINT plaid_items_item_id_key UNIQUE (item_id);
  END IF;
END $$;

-- Grant table access to Supabase's API roles.
-- Raw SQL-created tables don't automatically pick up Supabase's default grants —
-- without this, even the service_role gets "permission denied for table" since
-- RLS bypass only applies to policies, not the underlying GRANT/REVOKE layer.
GRANT SELECT, INSERT, UPDATE, DELETE ON plaid_items TO service_role;
GRANT SELECT, DELETE                ON plaid_items TO authenticated;

-- RLS (service role bypasses, users can read/delete their own items)
ALTER TABLE plaid_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own plaid items"   ON plaid_items;
DROP POLICY IF EXISTS "Users can delete own plaid items" ON plaid_items;

CREATE POLICY "Users can read own plaid items"
  ON plaid_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plaid items"
  ON plaid_items FOR DELETE
  USING (auth.uid() = user_id);

-- Force PostgREST to pick up the new columns immediately
NOTIFY pgrst, 'reload schema';

-- ── Verification ─────────────────────────────────────────────
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'plaid_items' ORDER BY ordinal_position;
