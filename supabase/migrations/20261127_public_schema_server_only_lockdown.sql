-- ============================================================================
-- Public schema server-only lockdown
-- ============================================================================
-- Purpose:
--   1. Enable RLS on every current public table.
--   2. Remove direct PostgREST/table/sequence/function privileges from anon,
--      authenticated, and PUBLIC.
--   3. Preserve server-side application access through the server-only
--      Supabase secret key (service_role) and DATABASE_URI (postgres).
--   4. Prevent newly created public objects from silently restoring access.
--
-- IMPORTANT:
--   This intentionally disables direct anon/authenticated access to *all*
--   objects in the public schema. The application must use its server-side
--   Supabase secret key or trusted DATABASE_URI connection for these data
--   operations. Do not apply until the corresponding preview smoke tests pass.
--
-- RLS is enabled without per-user policies in this migration. This is
-- deliberate because the current app uses a trusted server-side data layer,
-- not Supabase Auth user-scoped table access. service_role bypasses RLS;
-- postgres owns/bypasses RLS. Add narrowly scoped policies only if direct
-- browser access is introduced later.

-- Remove public API access at the schema boundary.
REVOKE ALL ON SCHEMA public FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Enable RLS for every current table in public.
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', 'public', table_record.tablename);
  END LOOP;
END
$$;

-- Remove any direct privileges that might remain on existing objects.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- Preserve full server-side API access for the Vercel secret-key client.
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Default privileges are intentionally not changed here because the connected
-- migration role is not authorized to alter defaults owned by postgres or
-- supabase_admin. Configure future-object defaults separately as the owning
-- database role after this migration, if required.

-- Post-migration validation queries (run separately):
-- SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity;
-- SELECT count(*) FROM information_schema.role_table_grants
--   WHERE table_schema = 'public' AND grantee IN ('anon','authenticated');
-- SELECT has_schema_privilege('anon','public','USAGE'),
--        has_schema_privilege('authenticated','public','USAGE'),
--        has_schema_privilege('service_role','public','USAGE');
