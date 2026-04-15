# 🍎 맥북 포맷 후 OnePick 개발 환경 완전 구축 가이드

> **대상:** 맥북을 포맷하고 Git에서 최신 코드를 받아 로컬에서 AWS 서비스(S3, RDS/PostgreSQL, Redis)와 함께 개발 환경을 다시 구축하는 경우  
> **기준 시점:** 2026년 4월 15일  
> **프로젝트:** OnePick (Next.js 14 + Prisma + PostgreSQL + AWS S3 + Redis)

---

## 📋 전체 설치 순서 한눈에 보기

```
1. Homebrew 설치
2. Git 설치 및 설정
3. Node.js 설치 (nvm 권장)
4. PostgreSQL 설치 (로컬 DB)
5. Redis 설치 (로컬)
6. LocalStack 설치 (AWS S3 로컬 에뮬레이터)
7. Git에서 소스 코드 클론
8. npm 패키지 설치
9. .env 파일 설정
10. DB 마이그레이션 실행
11. 초기 데이터(Seed) 입력
12. 개발 서버 실행 및 최종 확인
```

---

## Step 1. Homebrew 설치

macOS의 패키지 관리자입니다. 이후 모든 도구 설치에 필요합니다.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

설치 후 터미널을 재시작하거나, 아래 명령어로 PATH를 적용하세요.

```bash
# Apple Silicon(M1/M2/M3) 맥북인 경우
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Intel 맥북인 경우
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/usr/local/bin/brew shellenv)"
```

설치 확인:
```bash
brew --version
```

---

## Step 2. Git 설치 및 설정

```bash
brew install git
```

Git 사용자 정보 설정:
```bash
git config --global user.name "이름"
git config --global user.email "이메일@example.com"
```

GitHub SSH 키 등록 (기존에 사용하던 SSH 키가 있다면 복원, 없으면 새로 생성):
```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "이메일@example.com"

# 퍼블릭 키 확인 (이 내용을 GitHub > Settings > SSH Keys에 등록)
cat ~/.ssh/id_ed25519.pub
```

---

## Step 3. Node.js 설치 (nvm 권장)

버전 관리가 쉬운 nvm(Node Version Manager)으로 설치합니다.

```bash
# nvm 설치
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# 터미널 재시작 후 nvm 활성화
source ~/.zshrc

# Node.js LTS 버전 설치 (프로젝트 사용 버전: v20.x)
nvm install 20
nvm use 20
nvm alias default 20
```

설치 확인:
```bash
node --version   # v20.x.x
npm --version    # 10.x.x
```

---

## Step 4. PostgreSQL 설치 (로컬 DB)

> [!NOTE]
> 로컬 개발 환경에서 AWS RDS 대신 로컬 PostgreSQL을 사용합니다.  
> 실제 AWS RDS에 연결하려면 이 단계를 건너뛰고 Step 9의 DATABASE_URL에 RDS 엔드포인트를 입력하세요.

```bash
brew install postgresql@17
```

서비스 시작 및 자동 실행 등록:
```bash
brew services start postgresql@17
```

PATH 등록 (Apple Silicon):
```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile
```

데이터베이스 및 사용자 생성:
```bash
# psql 접속 (기본 postgres 유저로)
psql postgres

# psql 안에서 실행:
CREATE DATABASE onepick;
CREATE USER onepick_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE onepick TO onepick_user;
\q
```

설치 확인:
```bash
psql --version
psql -U onepick_user -d onepick -c "SELECT 1;"
```

---

## Step 5. Redis 설치 (로컬)

프로젝트에서 실시간 알림 발행(Pub/Sub)에 Redis를 사용합니다.

```bash
brew install redis
```

서비스 시작 및 자동 실행 등록:
```bash
brew services start redis
```

설치 확인:
```bash
redis-cli ping
# 응답: PONG
```

---

## Step 6. LocalStack 설치 (AWS S3 로컬 에뮬레이터)

> [!NOTE]
> LocalStack은 실제 AWS 서비스(S3 등)를 로컬에서 에뮬레이션하는 도구입니다.  
> 실제 AWS S3를 사용한다면 이 단계를 건너뛰고 Step 9에서 실제 AWS 키를 .env에 입력하세요.

### 방법 A: Docker로 LocalStack 실행 (권장 🌟)

```bash
# Docker Desktop 설치 (https://www.docker.com/products/docker-desktop/)
# 설치 후 Docker 실행

# LocalStack 컨테이너 실행
docker run --rm -d \
  -p 4566:4566 \
  -p 4510-4559:4510-4559 \
  --name localstack \
  localstack/localstack
```

### 방법 B: pip으로 LocalStack 설치

```bash
pip3 install localstack
localstack start
```

### S3 버킷 생성 (LocalStack 실행 후)

```bash
# AWS CLI 설치
brew install awscli

# LocalStack용 더미 자격증명 설정
aws configure set aws_access_key_id test
aws configure set aws_secret_access_key test
aws configure set default.region ap-northeast-2

# s3 버킷 생성 (버킷명은 실제 사용하는 이름으로)
aws --endpoint-url=http://localhost:4566 s3 mb s3://onepick-bucket

# 생성 확인
aws --endpoint-url=http://localhost:4566 s3 ls
```

---

## Step 7. Git에서 소스 코드 클론

```bash
# 원하는 경로로 이동 (예: ~/Git2)
mkdir -p ~/Git2
cd ~/Git2

# GitHub에서 프로젝트 클론
git clone git@github.com:계정명/OnePick.git
# 또는 HTTPS로:
git clone https://github.com/계정명/OnePick.git

# 프로젝트 폴더로 이동
cd OnePick

# 최신 소스 확인
git status
git log --oneline -5
```

---

## Step 8. npm 패키지 설치

```bash
npm install
```

> [!TIP]
> `package.json`의 `postinstall` 스크립트에 `prisma generate`가 등록되어 있어  
> `npm install` 완료 시 Prisma 클라이언트가 자동으로 생성됩니다.

---

## Step 9. .env 파일 설정 ⭐ (가장 중요!)

프로젝트 루트(`~/Git2/OnePick/`)에 `.env` 파일을 생성합니다.

```bash
touch .env
open -a TextEdit .env  # 텍스트에디터로 열기
# 또는
nano .env
```

`.env` 파일 내용:

```env
# =====================================================================
# OnePick 환경 변수 설정
# =====================================================================

# ---------------------------------------------------------------
# 1. 데이터베이스 (PostgreSQL)
# ---------------------------------------------------------------
# [로컬 PostgreSQL 사용 시]
DATABASE_URL="postgresql://onepick_user:your_password@localhost:5432/onepick"

# [AWS RDS 사용 시] - 아래 주석 해제 후 실제 값 입력
# DATABASE_URL="postgresql://어드민계정:비밀번호@rds-endpoint.ap-northeast-2.rds.amazonaws.com:5432/onepick"

# ---------------------------------------------------------------
# 2. AWS S3 (파일 업로드)
# ---------------------------------------------------------------
# [LocalStack 로컬 에뮬레이터 사용 시]
AWS_S3_ENDPOINT="http://localhost:4566"
AWS_REGION="ap-northeast-2"
AWS_ACCESS_KEY_ID="test"
AWS_SECRET_ACCESS_KEY="test"
AWS_S3_BUCKET="onepick-bucket"

# [실제 AWS S3 사용 시] - 아래 주석 해제 후 실제 값 입력
# AWS_S3_ENDPOINT=""         # 비워두면 실제 AWS S3 사용
# AWS_REGION="ap-northeast-2"
# AWS_ACCESS_KEY_ID="실제_액세스_키"
# AWS_SECRET_ACCESS_KEY="실제_시크릿_키"
# AWS_S3_BUCKET="실제_버킷명"

# ---------------------------------------------------------------
# 3. Redis (실시간 알림)
# ---------------------------------------------------------------
REDIS_URL="redis://localhost:6379"

# [AWS ElastiCache 사용 시]
# REDIS_URL="redis://elasticache-endpoint.amazonaws.com:6379"

# ---------------------------------------------------------------
# 4. Google Gemini AI API
# ---------------------------------------------------------------
GEMINI_API_KEY="발급받은_Gemini_API_키"
# 발급: https://aistudio.google.com/app/apikey

# ---------------------------------------------------------------
# 5. NextAuth 인증
# ---------------------------------------------------------------
AUTH_SECRET="랜덤_시크릿_문자열_최소32자"
# 시크릿 생성 방법: openssl rand -base64 32

# ---------------------------------------------------------------
# 6. 네이버 지도 API
# ---------------------------------------------------------------
NEXT_PUBLIC_NAVER_CLIENT_ID="네이버_클라이언트_ID"
# 발급: https://console.ncloud.com → AI·NAVER API → Maps
```

> [!IMPORTANT]
> `.env` 파일은 Git에 포함되지 않습니다(`.gitignore`에 등록됨).  
> **기존에 사용하던 실제 값들을 메모해두었다가 여기에 그대로 입력하세요.**

### AUTH_SECRET 새로 생성하는 방법

```bash
openssl rand -base64 32
```

---

## Step 10. DB 마이그레이션 실행

```bash
# 마이그레이션 적용 (기존 마이그레이션 파일 기반, 권장)
npx prisma migrate deploy

# 또는 강제 동기화 (완전 새 DB일 때)
npx prisma db push
```

Prisma 클라이언트 재생성 (혹시 필요하다면):
```bash
npx prisma generate
```

마이그레이션 상태 확인:
```bash
npx prisma migrate status
```

---

## Step 11. 초기 데이터(Seed) 입력

```bash
# 카테고리 및 서비스 초기 데이터 삽입
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed-categories.ts
```

> `ts-node`가 없으면:
> ```bash
> npm install -D ts-node
> ```

### SystemConfig 초기 데이터 입력

Prisma Studio 실행 후 `system_configs` 테이블에 직접 입력하거나, psql로 SQL 실행:

```bash
# psql로 직접 입력
psql postgresql://onepick_user:your_password@localhost:5432/onepick -c "
INSERT INTO system_configs (key, value, description, \"updatedAt\") VALUES
  ('urgent_request_fee', '5000', '긴급 요청 수수료 (원)', NOW()),
  ('subscription_basic_price', '29000', '베이직 구독 월 금액 (원)', NOW())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
"
```

---

## Step 12. 최종 실행 및 확인

```bash
# 개발 서버 시작
npm run dev
```

- **Next.js 앱:** http://localhost:3000
- **Prisma Studio (DB GUI):** 별도 터미널에서 `npx prisma studio` → http://localhost:5555

### ✅ 정상 작동 체크리스트

| 항목 | 확인 방법 | 기대 결과 |
|------|-----------|-----------|
| Next.js 서버 | `http://localhost:3000` 접속 | 메인 페이지 정상 출력 |
| DB 연결 | Prisma Studio `npx prisma studio` | 테이블 목록 정상 표시 |
| Redis | `redis-cli ping` | `PONG` 응답 |
| LocalStack S3 | `aws --endpoint-url=http://localhost:4566 s3 ls` | 버킷 목록 표시 |

---

## 🔧 자주 사용하는 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# Prisma Studio (DB GUI)
npx prisma studio

# 새 마이그레이션 생성 (스키마 변경 시)
npx prisma migrate dev --name 변경내용_설명

# 마이그레이션 상태 확인
npx prisma migrate status

# Prisma 클라이언트 재생성
npx prisma generate

# LocalStack 상태 확인
curl http://localhost:4566/_localstack/health

# Redis 상태 확인
redis-cli ping

# PostgreSQL 서비스 상태 확인
brew services list | grep postgresql
```

---

## 🚨 문제 해결 (Troubleshooting)

### ❌ `npm install` 실패 - node_modules 권한 오류
```bash
sudo chown -R $(whoami) ~/.npm
npm install
```

### ❌ PostgreSQL 접속 안될 때
```bash
# 서비스 재시작
brew services restart postgresql@17

# 로그 확인
tail -f /opt/homebrew/var/log/postgresql@17.log
```

### ❌ Redis 연결 오류 (`Redis connection error`)
```bash
# 서비스 재시작
brew services restart redis
# 상태 확인
redis-cli ping
```

### ❌ LocalStack S3 오류 (파일 업로드 실패)
```bash
# Docker LocalStack 재시작
docker restart localstack

# 버킷 재생성
aws --endpoint-url=http://localhost:4566 s3 mb s3://onepick-bucket
```

### ❌ Prisma generate 오류 (`Cannot find module '../generated/prisma'`)
```bash
npx prisma generate
```

### ❌ `AUTH_SECRET` 관련 오류
```bash
# 새 시크릿 생성
openssl rand -base64 32
# 생성된 값을 .env 파일의 AUTH_SECRET에 붙여넣기
```

### ❌ 포트 3000이 이미 사용 중일 때
```bash
# 3000번 포트를 점유한 프로세스 확인 및 종료
lsof -ti:3000 | xargs kill -9
```

---

## 📦 설치된 서비스 자동 시작 설정

맥북 재시작 후 자동으로 서비스가 시작되도록 설정합니다.

```bash
# PostgreSQL 자동 시작
brew services start postgresql@17

# Redis 자동 시작
brew services start redis

# 자동 시작 서비스 목록 확인
brew services list
```

> [!NOTE]
> LocalStack(Docker)은 Docker Desktop이 실행되면 자동으로 시작되도록 Docker Desktop → Settings → General → **"Start Docker Desktop when you log in"** 옵션을 활성화하세요.  
> 단, LocalStack 컨테이너 자체는 매번 수동으로 시작하거나, Docker Compose 파일을 만들어 자동화할 수 있습니다.

---

## 📎 주요 파일 경로 요약

| 파일/폴더 | 경로 | 설명 |
|---|---|---|
| 환경 변수 | `.env` | Git 미포함, **직접 생성 필수** |
| Prisma 스키마 | `prisma/schema.prisma` | DB 구조 정의 |
| 마이그레이션 | `prisma/migrations/` | DB 변경 이력 |
| 카테고리 시드 | `prisma/seed-categories.ts` | 초기 카테고리 데이터 |
| AWS S3 설정 | `src/lib/aws-config.ts` | S3 클라이언트 설정 |
| Redis 설정 | `src/lib/redis.ts` | Redis 클라이언트 설정 |
| Prisma 인스턴스 | `src/lib/prisma.ts` | DB 연결 인스턴스 |
| DB 복구 가이드 | `db_recovery_guide.md` | 전체 DB 모델 명세 문서 |

---

## 🌐 외부 서비스 발급 정보 (실제 운영 시)

| 서비스 | 발급 경로 | 환경 변수 |
|---|---|---|
| AWS S3 | AWS Console → IAM → 액세스 키 생성 | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| AWS RDS PostgreSQL | AWS Console → RDS → 데이터베이스 생성 | `DATABASE_URL` |
| AWS ElastiCache (Redis) | AWS Console → ElastiCache → Redis OSS 클러스터 | `REDIS_URL` |
| Google Gemini API | https://aistudio.google.com/app/apikey | `GEMINI_API_KEY` |
| 네이버 지도 API | https://console.ncloud.com → Maps | `NEXT_PUBLIC_NAVER_CLIENT_ID` |
| NextAuth 시크릿 | `openssl rand -base64 32` | `AUTH_SECRET` |

---

*최종 업데이트: 2026-04-15*
