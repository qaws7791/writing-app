# 프로덕션 배포를 위한 플랫폼 전체 기능 검토 보고서

## 1. 개요 및 검토 목적

본 보고서는 글쓰기 학습 플랫폼 서비스의 프로덕션 배포를 목적으로, 기존 플랫폼의 모든 기능, 아키텍처, 인프라, 보안 및 검증 상태를 종합적으로 검토한 결과를 기록한다.

본 검토에서는 **새로운 서비스 기획이나 추가 기능 개발을 배제**하며, 현재 구축된 시스템의 프로덕션 안정성, 보안, 컴플라이언스 및 운영 준비도를 충족하기 위해 **추가적으로 필요한 사항**, **수정이 필요한 사항**, **삭제가 필요한 사항**을 식별하는 데 집중한다.

### 1.1 검토 일시 및 환경

- **검토 일시**: 2026-08-14
- **런타임 및 엔진**: Bun v1.3.14 / Node.js v24.19.0 / Windows & Ubuntu Deployment Target
- **검토 기준 commit**: 저장소 최신 HEAD (`main`)

### 1.2 자동화 품질 게이트 검증 요약

| 검증 항목                | 실행 명령                            | 검증 결과                     | 비고                                                                                          |
| :----------------------- | :----------------------------------- | :---------------------------- | :-------------------------------------------------------------------------------------------- |
| **정적 분석**            | `bun run ci:static`                  | **통과 (0 Error, 0 Warning)** | 아키텍처, 의존성 graph, 코드 포맷팅, Knip 미사용 코드, Oxlint 규칙, 타입체크 전원 정상        |
| **단위/통합 테스트**     | `bun run ci:tests`                   | **통과 (210/210 Passed)**     | 48개 테스트 파일, 210개 테스트 케이스 100% 성공                                               |
| **프로덕션 빌드**        | `bun run build`                      | **통과 (6/6 Turbo Tasks)**    | Next.js (`apps/web`, `apps/admin`), Hono API (`apps/api`), Astro (`apps/ui`) 산출물 생성 성공 |
| **로컬 환경 진단**       | `bun run doctor`                     | **통과**                      | API 환경 변수 계약, DB 무결성, foreign key 정상                                               |
| **컨테이너 이미지 Lock** | `bun run check:container-image-lock` | **통과**                      | 4개 컨테이너 이미지 `linux/amd64` digest 고정 확인                                            |
| **의존성 취약점 감지**   | `bun run audit:production`           | **1건 감지 (High)**           | `nanoid < 3.3.18` 취약점 감지 (수정 필요 사항에 반영)                                         |

---

## 2. 플랫폼 전체 기능 및 모듈 현황 검토

플랫폼은 Bun 모노레포 구조로 구성되어 있으며, 핵심 도메인과 인터페이스가 엄격한 경계 원칙(`docs/engineering/system-overview.md`)에 따라 분리되어 있다.

```
apps/
  ├── web/        : 학습자 웹 애플리케이션 (Next.js 16 App Router)
  ├── admin/      : 관리자 웹 애플리케이션 (Next.js 16 App Router)
  ├── api/        : 백엔드 HTTP API 및 MCP 서버 (Hono + Bun)
  └── ui/         : 공유 UI 디자인 시스템 및 문서 (Astro + Luma Component Engine)
packages/
  ├── modules/    : 도메인 모듈 (content, identity, learning, writing, ai-feedback, operations)
  ├── infra/      : 인프라 스트럭처 (ai, auth, db, http-client, http-platform, observability, storage)
  ├── shared/     : 공유 계약 및 커널 (contracts, kernel, types, ui)
  └── config/     : 환경 변수 및 설정 (env, nextjs-config, typescript-config, vitest-config)
```

### 2.1 학습자 서비스 (`apps/web` & 관련 모듈)

- **코스 카탈로그 및 상태 조회 (`/app`, `/app/courses`)**:
  - 학습자별 코스 진행률, 레슨 목록, 완료 상태를 제공한다.
  - API 계약(`packages/shared/contracts`)을 소비하며 SQLite `learning` 및 `content` 모듈의 읽기 전용 projection 데이터를 Hono API를 통해 수신한다.
- **레슨 세션 상태 머신 (`/app/lesson`)**:
  - `도입(Introduction) -> 글 작성(Draft Writing) -> AI 평가(AI Evaluation) -> 피드백 확인 및 수정/퀴즈(Revision/Choice) -> 완료(Step Complete)` 순서의 세션 상태 머신으로 동작한다.
  - 세션 전환 및 학습 진행 상태는 `learning_lesson_sessions` 및 `learning_step_submissions` 테이블에 원자적으로 기록된다.
- **실시간 작성 및 자동 저장 (`use-writing-autosave`, `use-lesson-draft-sync`)**:
  - 학습자가 작성 중인 글은 클라이언트 로컬 상태에 실시간 보관되며, 일정 주기 및 네트워크 재연결 시 백엔드로 자동 동기화된다.
- **자율 글쓰기 및 AI 피드백 (`/app/writing`, `/app/writing/[writingId]`)**:
  - 프롬프트 기반 및 자유 주제 글쓰기를 지원하며, 작성된 글은 버전을 관리한다(`writing_versions`).
  - OpenAI GPT 기반 AI 검토 서비스를 호출하여 피드백 및 교정안을 수신한다.
- **프로필, 학습 통계 및 회원 탈퇴 (`/app/profile`)**:
  - 연속 학습 일수(Streak), 완료한 레슨 수 등 통계를 표시한다.
  - 회원 탈퇴 요청 시 개인정보 처리 방침(`docs/engineering/privacy.md`)에 따라 유저 데이터가 안전하게 정제(Purge)되며, 데이터 무결성 보장을 위한 Deletion Marker가 재적용된다.

### 2.2 관리자 서비스 (`apps/admin` & 관련 모듈)

- **커리큘럼 콘텐츠 관리 (`content` 모듈)**:
  - 코스(Course), 유닛(Unit), 레슨(Lesson), 스텝(Step)의 Draft 작성 및 Immutable Published Revision 발행/보관을 관리한다.
  - `content-seed-data.json` 기반의 시드 데이터와 동기화되며, 시드 재실행 시 기존 발행본 및 사용자의 진행 상태를 보존한다.
- **학습자 현황 및 리포팅 (`operations` 모듈)**:
  - 전체 학습자 수, 일일 활성 학습자(DAU), 레슨 완료율, 피드백 통계 등 대시보드 리포팅을 제공한다.
- **접근 제어 및 권한**:
  - 관리자 인증은 Better Auth 관리자 세션을 사용하며, 별도 일반 유저 역할(Role Profile)을 두지 않고 관리자 전용 인증 경계로 처리한다.

### 2.3 관리자 MCP (Model Context Protocol) 시스템 (`apps/api/src/mcp/admin`)

- **읽기 전용 MCP 도구 6종**:
  - 외부 LLM 또는 Codex 에전트가 관리자 데이터를 조회할 수 있는 MCP v2 프로토콜 지원.
  - `admin:mcp:read` 스코프로 제한된 전용 Static/Synthetic Bearer Token 인증을 요구한다.
- **토큰 관리 CLI 바이너리**:
  - 토큰 발급: `bin/admin-mcp-token-issue`
  - 토큰 폐기: `bin/admin-mcp-token-revoke`
  - 원샷 CLI 바이너리로 동작하며, 토큰 원문은 로그나 DB에 직접 노출되지 않는다.

### 2.4 백엔드 API 및 인프라 (`apps/api` & `packages/infra/*`)

- **API Runtime (Hono framework)**:
  - OpenAPI 3.0 사양을 자동으로 생성하고 Orval을 통해 클라이언트 SDK를 결정적으로 빌드한다.
  - Health check 엔드포인트 `/health` (Liveness) 및 `/health/ready` (Readiness + DB 진단)를 제공한다.
- **데이터베이스 (SQLite + Drizzle ORM + Litestream)**:
  - `api.sqlite` 단일 파일 기반으로 단일 Writer 구조를 가진다.
  - Litestream을 통해 S3/R2 버킷으로 WAL 변경 사항을 실시간 복제/백업한다.
  - `0000-current-schema-baseline.sql` 기반의 스키마 마이그레이션 체계를 소유한다.
- **일일 유지보수 타스크 (`maintenance:daily`)**:
  - systemd oneshot timer로 동작하며 SQLite VACUUM, WAL Checkpoint, 탈퇴 유저 데드라인 정제 작업을 일괄 실행한다.

---

## 3. 프로덕션 배포를 위해 추가적으로 필요한 사항 (Additions Required)

프로덕션 환경으로 정식 배포하기 위해 반드시 추가로 준비 및 설정되어야 하는 필수 요소 목록이다.

### 3.1 외부 서비스 자격 증명 및 시크릿 환경 변수 설정

프로덕션 환경에서는 `.env.example`이나 개발용 디폴트 값이 엄격히 차단되므로 다음 프로덕션 시크릿이 Vault / GitHub Secret 환경 변수에 제공되어야 한다.

1. **AI 서비스 자격 증명**:
   - `OPENAI_API_KEY`: 프로덕션 AI 글쓰기 피드백 및 평가 엔진 호출용 실효 API 키.
2. **트랜잭션 이메일 발송 서비스**:
   - `RESEND_API_KEY`: 회원가입 인증, 비밀번호 재설정 이메일 실제 발송용 Resend API 키.
3. **소셜 로그인 (Google OAuth)**:
   - `GOOGLE_CLIENT_ID` 및 `GOOGLE_CLIENT_SECRET`: 구글 콘솔에서 등록된 프로덕션 도메인(`WEB_ORIGIN`) 전용 OAuth 2.0 자격 증명.
4. **고엔트로피 세션 및 서명 시크릿**:
   - `@workspace/env` 검증 기준을 충족하는 128-bit 이상의 Shannon Entropy를 가진 32자 이상의 무작위 문자열:
     - `LEARNER_AUTH_SECRET`: 학습자 인증 토큰 서명 키
     - `ADMIN_AUTH_SECRET`: 관리자 인증 토큰 서명 키 (`LEARNER_AUTH_SECRET`과 완전히 다른 값이어야 함)
     - `CURSOR_SIGNING_SECRET`: Cursor/MCP 서명 키
5. **객체 저장소 (S3 / Cloudflare R2) 자격 증명**:
   - Public Asset Bucket 자격 증명: 썸네일 및 정적 미디어 자산 업로드용.
   - Private Litestream Bucket 자격 증명: SQLite DB WAL 실시간 백업용.

### 3.2 출시 승인 게이트 요구사항 (Launch Gate Evidence Requirements)

`docs/engineering/deployment.md` 및 `scripts/production-readiness.ts`에 정의된 배포 승인 자동화 검사를 통과하기 위해 다음 증명 식별자(Evidence Identifier)가 제출되어야 한다.

1. **외부 법률/개인정보 검토 증명 (`legal_review_id`)**:
   - 외부 법률 검토 보고서 식별자 및 검증 시각 데이터.
2. **Staging DB 복구 훈련 증명 (`staging_recovery_drill_id`)**:
   - 최근 31일 이내에 실시된 Staging 복구 훈련 식별자 및 검증 시각 (최대 31일 유효 기간 적용).
3. **GitHub Production Environment 리뷰어 승인**:
   - Protected Environment 승인권자의 제출 및 승인 절차.

### 3.3 호스트 인프라 및 네트워크 구성 (Production Infrastructure)

1. **Ubuntu VPS 호스트 전용 Caddy Reverse Proxy 구성**:
   - DNS A/AAAA 레코드를 VPS public IP로 지정.
   - Caddy automatic HTTPS를 통해 학습자 도메인(`WEB_ORIGIN`) 및 관리자 도메인(`ADMIN_ORIGIN`) 인증서 자동 발급.
   - Caddy 설정에서 `X-Forwarded-For` 헤더를 직접 TCP 연결 IP로 강제 덮어쓰기 설정 확인.
2. **systemd Maintenance Timer 등록**:
   - VPS 호스트 상에 `writing-app-maintenance.timer` 및 `writing-app-maintenance.service` 등록.
   - 매일 지정된 시각(03:00 UTC)에 `maintenance:daily` 컨테이너가 원샷으로 실행되도록 설정.

---

## 4. 수정이 필요한 사항 (Modifications Required)

프로덕션 배포 전 코드 base, 의존성 패키지, 또는 빌드/인프라 설정에서 수정이 필요한 항목이다.

### 4.1 간접 의존성 보안 취약점 패치 (`nanoid < 3.3.18`)

- **현상**: `bun run audit:production` 실행 시 `nanoid` 패키지에서 1건의 High severity 취약점(CVE/GHSA-2v37-7h3g-55p8: custom generators loop indefinitely when size is zero)이 감지됨.
- **영향 범위**: Next.js, PostCSS, Scalar Hono API Reference, Astro 등 하위 의존성.
- **수정 요구사항**: 루트 `package.json`의 `overrides` (또는 `resolutions`)에 안전 버전 지정:
  ```json
  "overrides": {
    "nanoid": "^3.3.18"
  }
  ```

### 4.2 Docker 컨테이너 파일 시스템 권한 보장

- **현상**: Production 컨테이너 실행 시 SQLite DB 파일 (`/var/lib/writing-app/api.sqlite`) 및 WAL 파일 작성 권한 오류 가능성.
- **수정 요구사항**: Docker Compose 및 Ansible 배포 role에서 데이터 볼륨 디렉터리 권한을 non-root 컨테이너 실행 계정(`1000:1000`)에 소유권을 명확히 부여하도록 Ansible playbook 및 compose volume 정의 확인.

### 4.3 CI/CD 빌드 생성 태스크 선행 의존성 명시

- **현상**: 최초 클론 또는 캐시가 없는 상태에서 `check:architecture` 실행 시 `apps/ui/src/generated/component-examples` 생성 파일 부재로 인한 ENOENT 오류 발생 가능성.
- **수정 요구사항**: CI workflow script 및 로컬 static check runner에서 `check:architecture` 호출 전 반드시 `bun run generate`가 먼저 수행되도록 task 종속성 보장 (현재 Turbo pipeline에 설정되어 있으나 단독 script 실행 시 유의).

### 4.4 OpenAI API 장애/타임아웃 시 사용자 에러 메시지 처리 보완

- **현상**: OpenAI API의 rate limit (429), quota 부족, 또는 타임아웃 발생 시 백엔드 재시도(`OPENAI_MAX_RETRIES=2`) 후 실패 반환.
- **수정 요구사항**: 클라이언트 웹 앱(`apps/web`)에서 503/500 에러 수신 시 렌더링이 깨지지 않고, "현재 AI 피드백 서비스 요청이 많아 지연되고 있습니다. 잠시 후 다시 시도해 주세요." 형태의 사용자 친화적 안내 UI가 안전하게 노출되는지 확인 및 에러 바운더리 점검.

---

## 5. 삭제가 필요한 사항 (Deletions Required)

프로덕션 배포 시 보안 유출방지 및 경량화를 위해 삭제 또는 프로덕션 빌드에서 격리되어야 하는 요소들이다.

### 5.1 로컬 개발/테스트용 인증 이메일 파일 격리 및 삭제

- **대상**: `data/local-auth-email.json`
- **사유**: 로컬 개발 환경(`NODE_ENV=development`)에서 이메일 발송 대신 로컬 디렉터리에 이메일 템플릿/토큰을 파일로 덤프하는 기능.
- **삭제/격리 요구사항**: Production Docker 빌드 이미지 (`.dockerignore`)에 `data/` 디렉터리가 포함되지 않도록 배제되어 있는지 재확인하고, `NODE_ENV=production` 시 파일 작성 코드가 완전히 차단되는지 검증.

### 5.2 테스트 전용 디버그 헤더 및 테스트 바이패스 제거 확인

- **대상**: 개발 환경 전용 모의 세션(Mock session) 및 디버그 토큰 바이패스 logic.
- **검증 결과**: 현재 `packages/infra/auth` 및 Hono API middleware 검토 결과, `NODE_ENV=production` 시 바이패스 경로는 완전히 차단(fail-closed)되어 있음.
- **유지 조치**: 배포 시 `NODE_ENV`가 `production`으로 엄격히 주입되는지 CI pipeline 및 Compose 파일에서 확인.

### 5.3 미사용 의존성 코드 (Dead Code)

- **검증 결과**: `knip` 정적 분석 도구 실행 결과, 미사용 export, 미사용 패키지, 미사용 파일 0건으로 청정 상태임. 지속적으로 `ci:static:knip` 게이트 유지.

---

## 6. 결론 및 프로덕션 배포 체크리스트

플랫폼은 기술 아키텍처, 도메인 경계 분리, 정적 분석 및 자동화 테스트 관점에서 매우 높은 수준의 품질과 안정성을 유지하고 있다.

새로운 서비스 기획을 추가하지 않고, 현재 구현된 플랫폼을 성공적으로 프로덕션에 출시하기 위한 **최종 배포 체크리스트**는 다음과 같다.

### 📋 프로덕션 배포 최종 체크리스트

#### 1단계: 코드 및 의존성 패치 (Code & Security Fixes)

- [ ] 루트 `package.json`의 `overrides`에 `"nanoid": "^3.3.18"` 추가하여 취약점 해소
- [ ] `bun run ci:static` 및 `bun run audit:production` 성공 확인

#### 2단계: 프로덕션 시크릿 및 외부 서비스 환경 구성 (Production Environment & Secrets)

- [ ] `OPENAI_API_KEY` 발급 및 Vault/GitHub Secret 설정
- [ ] `RESEND_API_KEY` 발급 및 템플릿 도메인 인증 완료
- [ ] `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` 프로덕션 도메인 등록
- [ ] `LEARNER_AUTH_SECRET`, `ADMIN_AUTH_SECRET`, `CURSOR_SIGNING_SECRET` 고엔트로피 시크릿 생성 및 등록 (서로 다른 값 지정)
- [ ] S3 / R2 버킷 생성 (Public Asset Bucket, Private Litestream Bucket) 및 자격 증명 등록

#### 3단계: 출시 승인 게이트 증명서 제출 (Launch Gate Requirements)

- [ ] 외부 법률/개인정보 검토 완료 및 `legal_review_id` 생성
- [ ] Staging DB 복구 훈련 수행 및 `staging_recovery_drill_id` 기록 (31일 이내)
- [ ] GitHub `Production` Environment 승인권자 확인

#### 4단계: 인프라 프로비저닝 및 Ansible 배포 (Infrastructure & Deployment)

- [ ] Ubuntu VPS provisioning 및 DNS A/AAAA 레코드 (`WEB_ORIGIN`, `ADMIN_ORIGIN`) 지정
- [ ] Linux/WSL2 제어 노드에서 Ansible Playbook 실행 및 Docker 이미지 리포지토리 게시 (`.github/workflows/image-release.yml`)
- [ ] VPS 호스트 Caddy reverse proxy HTTPS 자동 인증서 발급 확인
- [ ] VPS 호스트 systemd maintenance timer (`writing-app-maintenance.timer`) 활성화
- [ ] Production Health Check (`/health/ready`) 및 핵심 사용자 흐름 Smoke Test 검증

---

_보고서 작성 완료 (문서 위치: `docs/work/2026-08-14-production-readiness-audit/production-readiness-audit.md`)_
