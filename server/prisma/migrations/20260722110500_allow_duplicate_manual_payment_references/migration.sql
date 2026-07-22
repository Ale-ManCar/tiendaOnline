DROP INDEX IF EXISTS "payments_provider_reference_key";

CREATE INDEX IF NOT EXISTS "payments_provider_reference_idx" ON "payments"("provider_reference");
