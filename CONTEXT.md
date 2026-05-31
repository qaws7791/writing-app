# 프로젝트 맥락

이 저장소는 한국어 글쓰기 학습 플랫폼을 만드는 Bun 기반 모노레포다. 학습자는 웹 앱에서 코스를 탐색하고 레슨을 단계별로 진행하며, 관리자는 별도 어드민 앱에서 현재 공개 커리큘럼을 직접 편집한다.

## 제품 목표

- 한국어 글쓰기 학습자가 문장 구조, 문법, 에세이, 비즈니스 글쓰기 흐름을 작은 레슨 단위로 익히게 한다.
- 레슨은 도입, 설명, 짧은 쓰기, AI 피드백, 완료 같은 step 기반 경험으로 구성한다.
- 학습 진행률, 답변, 완료 상태를 사용자별로 저장해 이어 학습할 수 있게 한다.
- 운영자는 코스, 챕터, 레슨, 스텝을 어드민에서 관리하고 저장 전 변경 유형을 확인한다.

## 현재 앱 구성

- `apps/web`: 학습자용 Next.js 앱이다. 랜딩, 로그인, 보호된 학습 홈, 코스 목록, 코스 상세, 레슨 경험을 제공한다.
- `apps/api`: 학습자용 Hono API다. 인증 세션, 코스 조회, 진행 저장, AI 피드백 생성을 담당한다.
- `apps/admin`: 관리자용 Next.js 앱이다. 로그인, 코스 목록, 코스 편집기, 사용자 목록을 제공한다.
- `apps/admin-api`: 관리자용 Hono API다. 관리자 세션, 커리큘럼 편집, 관리자 계정 seed를 담당한다.
- `apps/storybook`: 공유 UI 컴포넌트와 디자인 시스템 상태를 확인하는 Storybook이다.
- `packages/core`: DTO, Zod schema, 도메인 서비스, repository port를 둔다.
- `packages/db`: Drizzle SQLite schema, migration, seed, repository 구현을 둔다.
- `packages/ui`: shadcn 기반 공유 UI 컴포넌트와 Next 통합 경계를 제공한다.

## 핵심 런타임 경계

- 학습자 웹은 `apps/api`만 호출한다.
- 어드민 웹은 `apps/admin-api`만 호출한다.
- 인증 프록시는 각 Next 앱의 same-origin `/api/auth/*` route에서 처리한다.
- `packages/core`는 DB나 HTTP 구현을 모르는 도메인 경계다.
- `packages/db`는 core의 repository port를 구현한다.

## 문서 언어 정책

프로젝트 문서는 한국어로 작성한다. 기술 고유명사, 패키지명, 명령어, 코드 식별자는 원문을 유지한다. 사용자에게 보이는 화면 텍스트와 접근성 텍스트도 한국어를 기본으로 한다.
