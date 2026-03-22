-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('CUSTOMER', 'EXPERT');

-- CreateEnum
CREATE TYPE "EstimateStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EmergencyStatus" AS ENUM ('ACTIVE', 'ASSIGNED', 'RESOLVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "user_type" "UserType" NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(20),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "estimates" (
    "estimate_id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "expert_id" INTEGER,
    "service_type" VARCHAR(100) NOT NULL,
    "details" TEXT,
    "price" DECIMAL(10,2),
    "status" "EstimateStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estimates_pkey" PRIMARY KEY ("estimate_id")
);

-- CreateTable
CREATE TABLE "emergency_requests" (
    "request_id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "EmergencyStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emergency_requests_pkey" PRIMARY KEY ("request_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_emergency_status_created" ON "emergency_requests"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_emergency_location" ON "emergency_requests"("location");

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_expert_id_fkey" FOREIGN KEY ("expert_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_requests" ADD CONSTRAINT "emergency_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
