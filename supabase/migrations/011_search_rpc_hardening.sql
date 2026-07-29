-- match_item_chunks is SECURITY DEFINER; /api/search authenticates and
-- rate-limits, so the anon grant was an unthrottled compute path — revoke it.
revoke execute on function match_item_chunks(text, float, int) from anon;

-- get_live_verdict_counts has no callers since sidebar status derivation moved
-- to deriveProductStatus in src/lib/utils/lifecycle.ts (2026-07-29).
drop function if exists get_live_verdict_counts(uuid);

-- Functions get EXECUTE for PUBLIC by default, so revoking anon alone left a
-- path open. Revoke PUBLIC; authenticated + service_role keep explicit grants.
revoke execute on function match_item_chunks(text, float, int) from public;
