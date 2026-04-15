# 🗄️ OnePick 프로젝트 DB 완전 복구 가이드

> 이 가이드는 새로운 환경(맥북, 새 PC 등)에서 OnePick 프로젝트의 데이터베이스를 **처음부터 완전히 복구**하기 위한 문서입니다.
> 기준 시점: 2026년 4월 15일

---

## 📋 목차

1. [DB 구조 개요](#1-db-구조-개요)
2. [전체 모델 목록 및 테이블 명세](#2-전체-모델-목록-및-테이블-명세)
3. [Enum(열거형) 목록](#3-enum열거형-목록)
4. [새 환경에서 DB 복구 절차](#4-새-환경에서-db-복구-절차)
5. [초기 데이터(Seed) 복구](#5-초기-데이터seed-복구)
6. [SystemConfig 초기 데이터](#6-systemconfig-초기-데이터)
7. [문제 해결 (Troubleshooting)](#7-문제-해결-troubleshooting)

---

## 1. DB 구조 개요

- **ORM:** Prisma
- **DB 엔진:** PostgreSQL
- **Prisma 클라이언트 생성 경로:** `src/generated/prisma`
- **스키마 파일 위치:** `prisma/schema.prisma`
- **마이그레이션 폴더:** `prisma/migrations/`

### 마이그레이션 이력

| 마이그레이션명 | 설명 |
|---|---|
| `20260226132747_init` | 초기 테이블 생성 |
| `20260226134422_add_estimate_photo` | 견적 사진 필드 추가 |
| `20260330222604_apply_new_models` | 신규 모델 일괄 적용 (Portfolio, Review, SystemConfig 등) |

---

## 2. 전체 모델 목록 및 테이블 명세

### 📌 Category (카테고리)
**테이블명:** `categories`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Int (PK, autoincrement) | 고유 ID |
| `name` | String (unique) | 카테고리명 |
| `order` | Int (default: 0) | 정렬 순서 |
| `isActive` | Boolean (default: true) | 활성 여부 |
| `createdAt` | DateTime | 생성일 |
| `updatedAt` | DateTime | 수정일 |

**관계:** `estimates[]`, `services[]`, `users[]` (UserSpecialties 다대다)

---

### 📌 Service (서비스)
**테이블명:** `services`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Int (PK, autoincrement) | 고유 ID |
| `name` | String | 서비스명 |
| `categoryId` | Int | 소속 카테고리 ID (FK) |
| `order` | Int (default: 0) | 정렬 순서 |
| `isActive` | Boolean (default: true) | 활성 여부 |
| `createdAt` | DateTime | 생성일 |
| `updatedAt` | DateTime | 수정일 |

**유니크 제약:** `(name, categoryId)` - 같은 카테고리 내 서비스명 중복 불가

---

### 📌 User (사용자/전문가)
**테이블명:** `users`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Int (PK, autoincrement) | 고유 ID |
| `name` | String | 이름 |
| `email` | String (unique) | 이메일 |
| `role` | UserRole (default: USER) | 역할 (USER/EXPERT/BOTH/ADMIN) |
| `image` | String? | 프로필 이미지 URL |
| `emailVerified` | DateTime? | 이메일 인증일 |
| `isApproved` | Boolean (default: false) | 관리자 승인 여부 |
| `grade` | ExpertGrade? | 전문가 등급 (PRO/HELPER) |
| `career` | String? | 경력 |
| `regions` | String[] (default: []) | 활동 지역 목록 |
| `idCardUrl` | String? | 신분증 URL |
| `idCardApproved` | Boolean (default: false) | 신분증 승인 여부 |
| `businessLicenseUrls` | String[] (default: []) | 사업자등록증 URL 목록 |
| `businessLicenseApproved` | Boolean (default: false) | 사업자등록증 승인 여부 |
| `subscriptionPlan` | SubscriptionPlan (default: LITE) | 구독 플랜 (LITE/BASIC) |
| `subscriptionDate` | DateTime? | 구독 시작일 |
| `subscriptionEndDate` | DateTime? | 구독 만료일 |
| `createdAt` | DateTime | 생성일 |
| `updatedAt` | DateTime | 수정일 |

---

### 📌 Profile (전문가 프로필)
**테이블명:** `Profile`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK, uuid) | 고유 ID |
| `expertId` | Int (unique, FK → users) | 전문가 User ID |
| `introduction` | String | 자기소개 |
| `portfolioUrl` | String? | 포트폴리오 URL |
| `portfolioFiles` | String[] (default: []) | 포트폴리오 파일 URL 목록 |
| `rating` | Float (default: 0.0) | 평점 |
| `reviewCount` | Int (default: 0) | 리뷰 수 |
| `createdAt` | DateTime | 생성일 |
| `updatedAt` | DateTime | 수정일 |

---

### 📌 PortfolioCategory (포트폴리오 카테고리)
**테이블명:** `portfolio_categories`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Int (PK, autoincrement) | 고유 ID |
| `expertId` | Int (FK → users) | 전문가 ID |
| `name` | String | 카테고리명 |
| `order` | Int (default: 0) | 정렬 순서 |
| `createdAt` | DateTime | 생성일 |
| `updatedAt` | DateTime | 수정일 |

---

### 📌 Portfolio (블로그/포트폴리오)
**테이블명:** `portfolios`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Int (PK, autoincrement) | 고유 ID |
| `expertId` | Int (FK → users) | 전문가 ID |
| `categoryId` | Int? (FK → portfolio_categories) | 포트폴리오 카테고리 ID |
| `title` | String | 제목 |
| `content` | String | 내용 (HTML) |
| `thumbnailUrl` | String? | 썸네일 이미지 URL |
| `blogUrl` | String? | 외부 블로그 URL |
| `isImported` | Boolean (default: false) | 외부 블로그 가져오기 여부 |
| `seoTags` | String? | SEO 태그 (숨김 처리 중) |
| `createdAt` | DateTime | 생성일 |
| `updatedAt` | DateTime | 수정일 |

---

### 📌 Estimate (견적 요청)
**테이블명:** `estimates`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK, uuid) | 고유 ID |
| `requestNumber` | String? (unique) | 요청 번호 |
| `customerId` | Int (FK → users) | 고객 ID |
| `categoryId` | Int? (FK → categories) | 카테고리 ID |
| `status` | EstimateStatus (default: PENDING) | 진행 상태 |
| `details` | String | 요청 상세 내용 |
| `location` | String | 위치 |
| `selectedDate` | String? | 선택 날짜 |
| `serviceDate` | String? | 서비스 날짜 |
| `serviceTime` | String? | 서비스 시간 |
| `authorName` | String? | 작성자명 |
| `contact` | String? | 연락처 |
| `shareContact` | Boolean (default: false) | 연락처 공개 여부 |
| `photoUrls` | String[] | 사진 URL 목록 |
| `completionPhotoUrls` | String[] (default: []) | 완료 사진 URL 목록 |
| `isUrgent` | Boolean (default: false) | 긴급 요청 여부 |
| `isClosed` | Boolean (default: false) | 마감 여부 |
| `needsReestimate` | Boolean (default: false) | 재견적 필요 여부 |
| `designatedExpertId` | Int? | 지정 전문가 ID |
| `extendedDays` | Int (default: 0) | 연장 일수 |
| `currentStep` | Int (default: 1) | 현재 단계 |
| `createdAt` | DateTime | 생성일 |
| `updatedAt` | DateTime | 수정일 |

---

### 📌 Bid (입찰/견적 제안)
**테이블명:** `Bid`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK, uuid) | 고유 ID |
| `estimateId` | String (FK → estimates) | 견적 ID |
| `expertId` | Int (FK → users) | 전문가 ID |
| `price` | Int | 제안 금액 |
| `message` | String? | 제안 메시지 |
| `availableDate` | String? | 가능 날짜 |
| `status` | BidStatus (default: PENDING) | 입찰 상태 |
| `isEditRequested` | Boolean (default: false) | 수정 요청 여부 |
| `createdAt` | DateTime | 생성일 |
| `updatedAt` | DateTime | 수정일 |

---

### 📌 BidItem (입찰 세부 항목)
**테이블명:** `bid_items`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK, uuid) | 고유 ID |
| `bidId` | String (FK → Bid) | 입찰 ID |
| `name` | String | 항목명 |
| `content` | String | 항목 내용 |
| `period` | String | 소요 기간 |
| `amount` | Int | 금액 |

---

### 📌 Chat (채팅)
**테이블명:** `Chat`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK, uuid) | 고유 ID |
| `senderId` | Int (FK → users) | 발신자 ID |
| `receiverId` | Int (FK → users) | 수신자 ID |
| `estimateId` | String? (FK → estimates) | 연결 견적 ID |
| `message` | String | 메시지 내용 |
| `isRead` | Boolean (default: false) | 읽음 여부 |
| `createdAt` | DateTime | 생성일 |

---

### 📌 PaymentHistory (결제 내역)
**테이블명:** `payment_history`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK, uuid) | 고유 ID |
| `userId` | Int (FK → users) | 사용자 ID |
| `paymentType` | String (default: "SUBSCRIPTION") | 결제 유형 (SUBSCRIPTION / URGENT_REQUEST) |
| `amount` | Int | 결제 금액 (원) |
| `paymentDate` | DateTime (default: now) | 결제일 |
| `status` | String (default: "PAID") | 결제 상태 |
| `nextPaymentDate` | DateTime? | 다음 결제일 |
| `estimateId` | String? (FK → estimates) | 연결 견적 ID (긴급 요청 결제 시) |

---

### 📌 Bookmark (즐겨찾기)
**테이블명:** `bookmarks`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK, uuid) | 고유 ID |
| `userId` | Int (FK → users) | 사용자 ID |
| `estimateId` | String (FK → estimates) | 견적 ID |
| `createdAt` | DateTime | 생성일 |

**유니크 제약:** `(userId, estimateId)`

---

### 📌 FavoriteExpert (선호 전문가)
**테이블명:** `favorite_experts`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK, uuid) | 고유 ID |
| `userId` | Int (FK → users) | 사용자 ID |
| `expertId` | Int (FK → users) | 전문가 ID |
| `createdAt` | DateTime | 생성일 |

**유니크 제약:** `(userId, expertId)`

---

### 📌 Review (리뷰)
**테이블명:** `reviews`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK, uuid) | 고유 ID |
| `estimateId` | String (unique, FK → estimates) | 견적 ID (1:1 리뷰) |
| `expertId` | Int (FK → users) | 전문가 ID |
| `customerId` | Int (FK → users) | 고객 ID |
| `rating` | Float (default: 5.0) | 별점 |
| `content` | String | 리뷰 내용 |
| `photoUrls` | String[] (default: []) | 리뷰 사진 목록 |
| `createdAt` | DateTime | 생성일 |
| `updatedAt` | DateTime | 수정일 |

---

### 📌 Schedule (전문가 스케줄)
**테이블명:** `schedules`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK, uuid) | 고유 ID |
| `expertId` | Int (FK → users) | 전문가 ID |
| `date` | String | 일자 (YYYY-MM-DD 형식) |
| `title` | String | 일정 제목 |
| `content` | String? | 일정 내용 |
| `amount` | Int? (default: 0) | 금액 |
| `isHoliday` | Boolean (default: false) | 휴무일 여부 |
| `createdAt` | DateTime | 생성일 |
| `updatedAt` | DateTime | 수정일 |

---

### 📌 Certification (자격증/인증)
**테이블명:** `certifications`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK, uuid) | 고유 ID |
| `userId` | Int (FK → users) | 사용자 ID |
| `name` | String | 자격증명 |
| `fileUrl` | String? | 자격증 파일 URL |
| `isApproved` | Boolean (default: false) | 승인 여부 |
| `createdAt` | DateTime | 생성일 |

---

### 📌 Inquiry (문의)
**테이블명:** `inquiries`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK, uuid) | 고유 ID |
| `userId` | Int (FK → users) | 문의자 ID |
| `target` | String (default: "USER") | 대상 (USER/EXPERT) |
| `type` | String | 문의 유형 |
| `title` | String | 제목 |
| `content` | String | 내용 |
| `answer` | String? | 답변 |
| `status` | InquiryStatus (default: PENDING) | 상태 |
| `createdAt` | DateTime | 생성일 |
| `updatedAt` | DateTime | 수정일 |

---

### 📌 Report (신고)
**테이블명:** `reports`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK, uuid) | 고유 ID |
| `userId` | Int (FK → users) | 신고자 ID |
| `targetId` | String? | 신고 대상 ID |
| `reason` | String | 신고 사유 |
| `details` | String | 상세 내용 |
| `createdAt` | DateTime | 생성일 |

---

### 📌 Notice (공지사항)
**테이블명:** `notices`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Int (PK, autoincrement) | 고유 ID |
| `title` | String | 제목 |
| `content` | String | 내용 |
| `important` | Boolean (default: false) | 중요 공지 여부 |
| `createdAt` | DateTime | 생성일 |
| `updatedAt` | DateTime | 수정일 |

---

### 📌 FAQ (자주 묻는 질문)
**테이블명:** `faqs`

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | Int (PK, autoincrement) | 고유 ID |
| `target` | String (default: "USER") | 대상 (USER/EXPERT) |
| `category` | String | 질문 분류 |
| `question` | String | 질문 |
| `answer` | String | 답변 |
| `createdAt` | DateTime | 생성일 |
| `updatedAt` | DateTime | 수정일 |

---

### 📌 SystemConfig (시스템 설정)
**테이블명:** `system_configs`

| 필드 | 타입 | 설명 |
|------|------|------|
| `key` | String (PK) | 설정 키 |
| `value` | String | 설정 값 |
| `description` | String? | 설명 |
| `updatedAt` | DateTime | 수정일 |

> 관리자 페이지(`/admin/system-config`)에서 UI로 수정 가능. 결제 금액 등 동적 설정값 저장.

---

### 📌 Account, Session, VerificationToken (NextAuth 인증)

| 테이블명 | 설명 |
|---|---|
| `accounts` | OAuth 소셜 계정 연동 정보 |
| `sessions` | 로그인 세션 관리 |
| `verification_tokens` | 이메일 인증 토큰 |

> NextAuth.js 라이브러리가 자동으로 사용하는 테이블입니다. 직접 수정하지 마세요.

---

## 3. Enum(열거형) 목록

```prisma
enum UserRole {
  USER    // 일반 사용자
  EXPERT  // 전문가
  BOTH    // 사용자 + 전문가 겸용
  ADMIN   // 관리자
}

enum ExpertGrade {
  PRO     // 프로
  HELPER  // 헬퍼
}

enum EstimateStatus {
  DRAFT       // 임시저장
  PENDING     // 대기중
  BIDDING     // 입찰중
  SELECTED    // 전문가 선택됨
  IN_PROGRESS // 진행중
  COMPLETED   // 완료
  CANCELLED   // 취소
  INSPECTION  // 검수중
}

enum BidStatus {
  PENDING   // 대기중
  ACCEPTED  // 수락됨
  REJECTED  // 거절됨
}

enum InquiryStatus {
  PENDING   // 답변 대기
  ANSWERED  // 답변 완료
}

enum SubscriptionPlan {
  LITE   // 라이트 플랜
  BASIC  // 베이직 플랜
}
```

---

## 4. 새 환경에서 DB 복구 절차

### Step 1: 사전 준비

```bash
# 프로젝트 루트에 .env 파일 생성
# 아래 내용을 .env 파일에 작성
DATABASE_URL="postgresql://유저명:비밀번호@호스트:포트/데이터베이스명"

# 예시 (로컬 PostgreSQL인 경우)
DATABASE_URL="postgresql://postgres:mypassword@localhost:5432/onepick"

# 예시 (AWS RDS / Supabase 등 클라우드 DB인 경우)
DATABASE_URL="postgresql://어드민계정:비밀번호@rds-endpoint.amazonaws.com:5432/onepick"
```

> [!IMPORTANT]
> `.env` 파일은 Git에 포함되지 않으므로 항상 직접 생성해야 합니다!

---

### Step 2: 패키지 설치

```bash
npm install
```

---

### Step 3: DB 스키마 적용

> **방법 A** - 기존 마이그레이션 기록으로 적용 (권장 🌟)

```bash
npx prisma migrate deploy
```

> **방법 B** - 스키마 강제 동기화 (데이터가 없는 완전 새 DB인 경우)

```bash
npx prisma db push
```

> [!TIP]
> - `migrate deploy`: 기존 마이그레이션 파일을 순서대로 실행합니다. **프로덕션 환경** 또는 기존 데이터가 있을 때 권장.
> - `db push`: 현재 `schema.prisma` 파일을 DB에 그대로 밀어넣습니다. **완전 새 환경** 또는 테스트용으로 빠르게 설정할 때 사용.

---

### Step 4: Prisma 클라이언트 생성

```bash
npx prisma generate
```

> `migrate deploy` 또는 `db push` 실행 시 자동으로 수행되지만, 수동으로 실행해야 하는 경우에 사용합니다.

---

### Step 5: 초기 데이터(Seed) 삽입

```bash
npx ts-node prisma/seed-categories.ts
```

> [!NOTE]
> `ts-node`가 없으면 먼저 설치: `npm install -D ts-node`

---

### Step 6: 개발 서버 실행 및 확인

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 후 정상 동작 확인.

```bash
# Prisma Studio (DB 데이터 GUI 확인)
npx prisma studio
```

---

## 5. 초기 데이터(Seed) 복구

`prisma/seed-categories.ts` 파일을 실행하면 아래의 카테고리와 서비스가 자동으로 삽입됩니다.

| 카테고리 | 서비스 목록 |
|---|---|
| 도배/장판 | 도배 시공, 장판 시공, 마루 시공, 타일 시공, 페인트 시공, 부분 보수 |
| 욕실/주방 | 욕실 리모델링, 싱크대 교체, 수전/배관 수리, 환풍기/후드 설치, 줄눈 시공 |
| 전기/조명 | 조명 설치/수리, 스위치/콘센트 교체, 누전 수리, 차단기 교체 |
| 청소/이사 | 이사청소, 입주청소, 거주청소, 원룸이사, 가정이사, 용달/화물 |
| 가전/에어컨 | 에어컨 수리/설치, 에어컨 분해청소, 냉장고 수리, 세탁기 수리/청소, TV 설치 |
| 자동차 수리 | 외형 복원/도색, 경정비, 세차/광택, 블랙박스/내비게이션 장착 |
| 베이비/펫시터 | 베이비시터, 등하원 도우미, 펫시터, 반려견 산책, 가사 도우미 |
| 과외/레슨 | 영어/외국어, 수학/과학, 보컬/악기, 피트니스/요가, 프로그래밍/IT |
| 디자인/IT | 로고 디자인, 웹/앱 개발, 영상 편집, 번역/통역, 마케팅/기획 |
| 기타 서비스 | 심부름/대행, 결혼식 하객 대행, 반려동물 장례, 법률/세무 상담, 기타 |

---

## 6. SystemConfig 초기 데이터

`system_configs` 테이블에는 동적 결제 금액 설정이 저장됩니다.
새 DB를 만들 때 아래 SQL 또는 관리자 페이지(`/admin/system-config`)에서 직접 입력하세요.

```sql
INSERT INTO system_configs (key, value, description, "updatedAt") VALUES
  ('urgent_request_fee', '5000', '긴급 요청 수수료 (원)', NOW()),
  ('subscription_basic_price', '29000', '베이직 구독 월 금액 (원)', NOW());
```

또는 Prisma Studio에서 직접 `system_configs` 테이블에 위 데이터를 추가할 수 있습니다.

---

## 7. 문제 해결 (Troubleshooting)

### ❌ "The table does not exist" 오류
DB에 테이블이 없는 상태입니다. **Step 3**의 `npx prisma migrate deploy` 또는 `npx prisma db push`를 실행하세요.

### ❌ "P1001: Can't reach database server" 오류
`.env` 파일의 `DATABASE_URL`이 잘못되었거나 DB 서버가 꺼져 있습니다.
- 로컬 PostgreSQL 사용 시: PostgreSQL 서비스가 실행 중인지 확인
- AWS/클라우드 DB 사용 시: 보안 그룹(Security Group) 또는 방화벽에서 접속 IP 허용 여부 확인

### ❌ "Prisma Client is not generated" 오류
`npx prisma generate`를 실행하세요.

### ❌ 마이그레이션 충돌 오류
아래 명령어로 마이그레이션 상태를 확인하세요:
```bash
npx prisma migrate status
```
충돌이 있을 경우:
```bash
# 주의: 데이터가 모두 삭제됩니다. 개발 환경에서만 사용!
npx prisma migrate reset
```

### ❌ "seed-categories.ts" 실행 오류
```bash
# ts-node 설치 후 재시도
npm install -D ts-node
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-categories.ts
```

---

## 📎 관련 파일 경로 요약

| 파일 | 경로 |
|---|---|
| Prisma 스키마 | `prisma/schema.prisma` |
| 마이그레이션 | `prisma/migrations/` |
| 카테고리 시드 | `prisma/seed-categories.ts` |
| Prisma 클라이언트 | `src/generated/prisma/` |
| Prisma 인스턴스 | `src/lib/prisma.ts` |
| 관리자 시스템 설정 페이지 | `src/app/(admin)/system-config/page.tsx` |
| 환경 변수 | `.env` (Git 미포함, 직접 생성 필요) |

---

*최종 업데이트: 2026-04-15*
