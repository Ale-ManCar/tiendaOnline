CREATE TABLE "store_settings" (
  "id" VARCHAR(32) NOT NULL DEFAULT 'default',
  "data" JSONB NOT NULL,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "carts_user_id_key" ON "carts"("user_id");
