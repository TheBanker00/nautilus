-- ============================================================
--  WealthLens — Grant service_role access for Plaid sync tables
--  Run in Supabase SQL Editor
--
--  Same root cause as plaid_items: tables created via raw SQL
--  don't automatically pick up Supabase's default API-role grants,
--  so the service_role client gets "permission denied for table"
--  even though RLS would otherwise allow it.
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON accounts          TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON transactions       TO service_role;
GRANT SELECT                         ON account_taxonomy   TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON accounts          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON transactions       TO authenticated;
GRANT SELECT                         ON account_taxonomy   TO authenticated;

NOTIFY pgrst, 'reload schema';
