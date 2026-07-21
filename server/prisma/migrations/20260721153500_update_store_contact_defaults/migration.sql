UPDATE "store_settings"
SET "data" = jsonb_set(
  jsonb_set("data"::jsonb, '{supportEmail}', '"alemancar0511@gmail.com"', true),
  '{supportPhone}',
  '"0968822603"',
  true
)
WHERE "id" = 'default';
