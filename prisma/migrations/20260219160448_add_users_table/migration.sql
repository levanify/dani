-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "telegram_handle" TEXT NOT NULL,
    "last_openai_response_id" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_handle_key" ON "users"("telegram_handle");
