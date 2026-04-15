-- ============================================================
-- Migration: add_billing_key_table
-- Description: PG사 정기결제 연동을 위한 빌링키 테이블 신설
--              및 PaymentHistory 컬럼 추가
-- ============================================================

-- 1. PgProvider enum 타입 생성
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PgProvider') THEN
    CREATE TYPE "PgProvider" AS ENUM (
      'PORTONE',
      'TOSS',
      'KAKAO',
      'NAVER',
      'KG_INICIS',
      'NICE'
    );
  END IF;
END
$$;

-- 2. billing_keys 테이블 생성
CREATE TABLE IF NOT EXISTS "billing_keys" (
  "id"              TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"          INTEGER     NOT NULL,
  "pgProvider"      "PgProvider" NOT NULL DEFAULT 'PORTONE',
  -- PG사 발급 빌링키 토큰 (정기결제 시 사용, 실제 카드번호 아님)
  "billingKey"      TEXT        NOT NULL,
  -- PG사 고객 식별키 (토스페이먼츠 등에서 사용)
  "customerKey"     TEXT,
  -- 카드 마스킹 정보 (화면 표시용)
  "cardCompany"     TEXT,        -- 카드사명 (예: 신한, 국민, 현대)
  "cardType"        TEXT,        -- 카드 종류 (신용/체크)
  "cardBin"         TEXT,        -- 카드 BIN 앞 6자리
  "cardLast4"       TEXT,        -- 카드 끝 4자리
  "cardExpireYear"  TEXT,        -- 유효기간 년도 (YY)
  "cardExpireMonth" TEXT,        -- 유효기간 월 (MM)
  "holderName"      TEXT,        -- 카드 소유자명
  -- 상태 및 메타데이터
  "isActive"        BOOLEAN     NOT NULL DEFAULT true,   -- 현재 정기결제에 사용 중인 키
  "isDefault"       BOOLEAN     NOT NULL DEFAULT false,  -- 대표 결제 수단
  "issueSucceeded"  BOOLEAN     NOT NULL DEFAULT false,  -- 빌링키 발급 성공 여부
  "failureMessage"  TEXT,                                -- 발급 실패 메시지
  "issuedAt"        TIMESTAMPTZ,                         -- 빌링키 발급 완료 시각
  "expiredAt"       TIMESTAMPTZ,                         -- 빌링키 만료 시각
  "deletedAt"       TIMESTAMPTZ,                         -- 소프트 삭제 시각
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "billing_keys_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "billing_keys_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

-- 3. billing_keys 인덱스
CREATE INDEX IF NOT EXISTS "billing_keys_userId_isActive_idx"
  ON "billing_keys" ("userId", "isActive");

CREATE INDEX IF NOT EXISTS "billing_keys_userId_isDefault_idx"
  ON "billing_keys" ("userId", "isDefault");

-- 4. payment_history 컬럼 추가
ALTER TABLE "payment_history"
  ADD COLUMN IF NOT EXISTS "billingKeyId"    TEXT,
  ADD COLUMN IF NOT EXISTS "pgTransactionId" TEXT,
  ADD COLUMN IF NOT EXISTS "failureReason"   TEXT;

-- 5. payment_history → billing_keys 외래키
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payment_history_billingKeyId_fkey'
  ) THEN
    ALTER TABLE "payment_history"
      ADD CONSTRAINT "payment_history_billingKeyId_fkey"
      FOREIGN KEY ("billingKeyId") REFERENCES "billing_keys"("id")
      ON DELETE SET NULL;
  END IF;
END
$$;

-- 6. updatedAt 자동 갱신 트리거 (billing_keys)
CREATE OR REPLACE FUNCTION update_billing_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_billing_keys_updated_at ON "billing_keys";
CREATE TRIGGER trg_billing_keys_updated_at
  BEFORE UPDATE ON "billing_keys"
  FOR EACH ROW EXECUTE FUNCTION update_billing_keys_updated_at();
