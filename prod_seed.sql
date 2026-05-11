-- Snapshot of alert_rules at the worker cutover.
-- Captured 2026-05-11. Reference only — these rows already exist
-- in production; do NOT re-run unless rebuilding from scratch.
-- If you re-run into a fresh DB, the ON CONFLICT clause keeps it idempotent.

INSERT INTO alert_rules (id, name, enabled, conditions, channel, webhook_url, created_at) VALUES (
  '10c89c42-d31f-49f3-a4b3-d843a1d6f2fb',
  'TEST RULE 1',
  true,
  '{"markets": ["ufc"], "min_score": 4, "categories": ["countertrend"]}'::jsonb,
  'discord',
  NULL,
  '2026-05-10T19:55:13.415400+00:00'::timestamptz
) ON CONFLICT (id) DO NOTHING;

