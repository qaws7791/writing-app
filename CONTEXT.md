# 프로젝트 맥락

이 저장소는 한국어 글쓰기 학습 플랫폼을 만드는 Bun 기반 모노레포다. 학습자는 웹 앱에서 코스를 탐색하고 레슨을 단계별로 진행하며, 관리자는 별도 어드민 앱에서 현재 공개 커리큘럼을 직접 편집한다.

## 제품 목표

- `Kwep` 프로토타입에서 확인한 글쓰기 학습 흐름을 제품 코드로 이식한다.
- 한국어 글쓰기 학습자가 문장 구조, 문법, 논증, 독자 중심 글쓰기, 퇴고를 작은 레슨 단위로 익히게 한다.
- 레슨은 읽기, 비교, 객관식, 빈칸, 선택, 순서, 매칭, 분류, 쓰기, AI 코칭 같은 step 기반 경험으로 구성한다.
- 학습 진행률, 답변, 완료 상태를 사용자별로 저장해 이어 학습할 수 있게 한다.
- 프로필, 가입일, 완료 레슨, 전체 진도, 현재 연속 학습일을 학습자가 직접 확인할 수 있게 한다.
- 운영자는 코스, 유닛, 레슨, 스텝, 사용자, 분석, 운영 설정을 어드민에서 관리한다.

## 현재 앱 구성

- `apps/web`: 학습자용 Next.js 앱이다. 랜딩, 로그인, 보호된 학습 홈, 코스 목록, 코스 상세, 레슨 경험을 제공한다.
- `apps/api`: 학습자용 Hono API다. 라우팅, 미들웨어, 인증 토큰/헤더 추출, HTTP 요청/응답 매핑, 에러 매핑을 담당한다.
- `apps/admin`: 관리자용 Next.js 앱이다. 로그인, 대시보드, 콘텐츠 관리, 사용자 관리, 분석, 운영 설정을 제공한다.
- `apps/admin-api`: 관리자용 Hono API다. 관리자 세션, 커리큘럼 편집, 사용자 운영, 분석, 운영 설정, 관리자 계정 seed를 담당한다.
- `apps/storybook`: 공유 UI 컴포넌트와 디자인 시스템 상태를 확인하는 Storybook이다.
- `packages/core`: DTO, Zod schema, 도메인 서비스, repository port와 구현, 트랜잭션 경계, DB query, 학습자 API 런타임 조립을 둔다.
- `packages/db`: Drizzle SQLite client, schema, migration, seed 같은 저수준 영속성 primitive를 둔다.
- `packages/ui`: shadcn 기반 공유 UI 컴포넌트와 Next 통합 경계를 제공한다.
- `packages/hono`: Hono route, validation, error handling 표준을 제공한다.
- `packages/env`: 환경 변수 파싱과 로컬 기본값을 제공한다.
- `packages/logger`: pino logger와 요청 로그 middleware를 제공한다.
- `packages/http-client`: HTTP transport result와 네트워크 오류 모델을 제공한다.
- `packages/config`: workspace TypeScript 설정을 제공한다.

## 피벗 reset 상태

Kwep 피벗은 기존 제품 구현을 이어 고치는 방식이 아니라 새 baseline을 작성하는 방식으로 진행한다. 현재 `apps/api`, `apps/web`, `apps/admin-api`, `apps/admin`, `packages/core`, `packages/db`, `packages/ui`, `packages/env`, `packages/logger`의 기존 `src` 구현은 제거했고, package manifest와 TypeScript, ESLint, Vitest, Next/Hono 실행 설정 같은 monorepo 골격만 보존한다.

후속 Task는 보존된 골격 위에 Kwep 요구사항 기준의 새 API, DB, UI 구현을 추가한다.

## 핵심 런타임 경계

- 학습자 웹은 `apps/api`만 호출한다.
- 어드민 웹은 `apps/admin-api`만 호출한다.
- 인증 요청은 각 프론트엔드에서 Hono API의 `/api/auth/*` endpoint로 직접 보낸다.
- 운영에서 웹과 API가 서로 다른 서브도메인을 쓰는 경우 Better Auth cookie domain을 parent domain으로 명시한다.
- 학습자 API 의존성 방향은 `apps/api -> packages/core -> packages/db`다.
- `packages/core`는 HTTP transport를 모르지만 DB primitive를 사용해 도메인 규칙, 유스케이스, repository 구현을 제공한다.
- `packages/db`는 `packages/core`를 import하지 않는 저수준 영속성 패키지다.
- `Kwep/` 디렉토리는 읽기 전용 요구사항 원천이다. 런타임 코드는 `Kwep` 파일을 import하거나 직접 참조하지 않는다.
- Kwep 콘텐츠는 새 DB baseline seed로 승격하고, 개발 DB는 누적 보정 migration이 아니라 새 baseline schema로 재생성한다.

## 문서 언어 정책

프로젝트 문서는 한국어로 작성한다. 기술 고유명사, 패키지명, 명령어, 코드 식별자는 원문을 유지한다. 사용자에게 보이는 화면 텍스트와 접근성 텍스트도 한국어를 기본으로 한다.
