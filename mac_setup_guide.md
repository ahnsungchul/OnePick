# 맥북 M4(Apple Silicon) 로컬 환경 셋팅 가이드

현재 Windows 10 컴퓨터에 셋팅된 로컬 환경(Node.js v20.19.0, PostgreSQL 15, Redis 7, MinIO 등)을 새로운 맥북 M4에 동일하게 구축하시기 위한 가이드입니다. 맥북 M4는 ARM아키텍처(Apple Silicon)를 사용하지만, 최근 대부분의 개발 도구가 네이티브 환경을 완벽히 지원하므로 아래 순서대로 진행하시면 문제없이 셋팅할 수 있습니다.

---

## 💻 1단계: 필수 도구 설치

Apple의 패키지 매니저인 **Homebrew**를 먼저 설치하고, 이를 통해 필요한 도구를 설치하는 것이 좋습니다.

1. **Terminal 열기** (Cmd + Space 누르고 '터미널' 검색)
2. **Homebrew 설치**: 터미널에 아래 명령어 입력
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
   *(설치 완료 후 터미널에 안내되는 `Next steps` 아래의 환경 변수 설정 스크립트를 꼭 복사해서 실행해주세요)*

3. **Node.js 설치 (NVM 사용 권장)**: 현재 Windows 환경과 동일한 버전을 맞추기 위해 Node Version Manager를 사용합니다.
   ```bash
   brew install nvm
   ```
   *(터미널에 안내되는 환경 변수 스크립트(`export NVM_DIR...`)를 `~/.zshrc` 파일 맨 밑에 추가한 뒤 `source ~/.zshrc` 실행)*
   
   이후 현재 프로젝트 버전에 맞게 Node.js를 설치합니다.
   ```bash
   nvm install 20.19.0
   nvm use 20.19.0
   node -v  # v20.19.0 으로 동일한지 확인
   ```

4. **Docker Desktop 설치**: 
   - Mac용 [Docker Desktop (Apple Silicon 앱)](https://www.docker.com/products/docker-desktop/)을 공식 홈페이지에서 다운로드하여 설치. 
   - 설치 완료 후 반드시 앱을 한 번 실행해 둡니다.

---

## 📦 2단계: 프로젝트 소스 코드 및 환경변수 가져오기

1. **소스 코드 이동**:
   - 기존 PC의 `onedeal` 프로젝트 폴더를 Github, USB 등을 통해 맥북으로 가져옵니다. 
   - 단, `node_modules` 폴더와 Docker 볼륨 폴더(`.postgres_data`, `.minio_data`, `.redis_data`)는 가져오지 않는 것이 깔끔합니다. Mac 자체에서 새로 생성하는 것이 안전합니다.
   
2. **환경변수(.env) 설정 확인**:
   - 루트 폴더 안의 `.env` 파일도 잘 가져왔는지 확인하세요. (.npmrc 파일 등이 있다면 그것도 포함)

---

## 🚀 3단계: 프로젝트 빌드 및 실행

소스 코드가 위치한 폴더의 터미널에서 진행합니다.

1. **패키지 설치**:
   ```bash
   npm install
   ```

2. **Docker 인프라 구동 (DB, Redis, MinIO)**:
   ```bash
   # 백그라운드에서 인프라 컨테이너들 실행
   docker-compose up -d
   ```
   *(이때 Apple Silicon용 이미지를 자동으로 받아오며 정상 구동됩니다.)*

3. **DB 스키마 동기화 및 Prisma 셋팅**:
   - 데이터베이스 컨테이너가 정상적으로 실행된 것을 확인한 후 아래 명령어를 실행.
   ```bash
   npx prisma generate
   # 필요에 따라 DB에 마이그레이션 변경사항을 적용합니다.
   npx prisma db push  # 혹은 npx prisma migrate dev
   ```

4. **Next.js 개발 서버 실행**:
   ```bash
   npm run dev
   ```

이제 맥북 랜선이나 와이파이에 접속한 상태에서 웹 브라우저(`http://localhost:3000`)를 열고 윈도우에서와 동일하게 화면이 나오는지 확인하시면 됩니다.

---

## ⚠️ 맥(Mac) 이주시 주의사항 체크포인트
- **경로 차이 표기 주의**: Mac에서는 Windows와 달리 드라이브 명(`C:\`, `D:\`)이 없습니다. Windows 소스 내에 하드코딩된 'D드라이브' 경로가 있다면 Mac 경로(`/Users/본인계정명/...` 형식) 또는 프로젝트 루트 기준 **상대 경로**로 수정해 주어야 합니다. 
- **SH 스크립트 권한 문제**: 로컬스택 스크립트(`localstack-init.sh`) 등의 쉘 파일이 Mac에서 실행 안되는 경우(Permission Denied)가 생긴다면, `chmod +x localstack-init.sh` 로 실행 권한을 부여해 주시면 해결됩니다.
