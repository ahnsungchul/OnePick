-- ============================================================
-- Migration: add_annual_subscription_support
-- Description: Basic 연간 플랜(12개월 / 110,000원) 지원
--   · users 테이블에 subscriptionBillingCycle 컬럼 추가
--   · payment_history 테이블에 planName, billingCycle, billingMonths 컬럼 추가
--   · system_configs 에 연간 요금 기본값 시드
-- ============================================================

-- 1. users.subscriptionBillingCycle
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "subscriptionBillingCycle" TEXT NOT NULL DEFAULT 'MONTHLY';

-- 2. payment_history 확장
ALTER TABLE "payment_history"
  ADD COLUMN IF NOT EXISTS "planName"      TEXT,
  ADD COLUMN IF NOT EXISTS "billingCycle"  TEXT NOT NULL DEFAULT 'MONTHLY',
  ADD COLUMN IF NOT EXISTS "billingMonths" INTEGER NOT NULL DEFAULT 1;

-- 3. 기존 구독 결제 내역의 planName 보정 (최초 1회)
UPDATE "payment_history"
   SET "planName" = 'BASIC_MONTHLY'
 WHERE "paymentType" = 'SUBSCRIPTION'
   AND "planName" IS NULL;

-- 4. system_configs 에 Basic 연간 플랜 기본값 시드
INSERT INTO "system_configs" ("key", "value", "description", "updatedAt")
VALUES
  ('BASIC_SUBSCRIPTION_FEE',         '11000',  'Basic 월간 플랜 1개월 결제 금액(원)',                       now()),
  ('BASIC_ANNUAL_SUBSCRIPTION_FEE',  '110000', 'Basic 연간 플랜 12개월 일괄 결제 금액(원)',                  now()),
  ('BASIC_ANNUAL_SUBSCRIPTION_MONTHS','12',    'Basic 연간 플랜 이용 개월 수',                              now())
ON CONFLICT ("key") DO UPDATE
  SET "description" = EXCLUDED."description",
      "updatedAt"   = now();
