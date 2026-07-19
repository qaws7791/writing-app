# 학습자 웹 Next.js 아키텍처 마이그레이션

## 2026-07-19 로컬 사용자 재검증

- 상태: 완료
- 범위: 공개·보호 라우트, 테스트 전용 로그인, 전역 탐색, 코스 탐색·상세, 레슨 진행, 프로필, 오류·반응형 상태
- 기준: `nextjs-architecture.md`, 제품 요구사항, 화면 명세, 실제 브라우저에서 사용자가 관찰하는 동작
- 원칙: 발견한 결함만 새 아키텍처 경계 안에서 최소 수정하고 기존 제품 계약과 API 소유권을 유지한다.
- 완료 조건: 정적 품질 게이트와 자동 E2E를 통과하고, `ENABLE_TEST_AUTH=true` 로컬 환경에서 전체 사용자 흐름을 수동 브라우저로 재검증한다.

### 확인하고 수정한 결함

1. 로그아웃한 사용자가 동적 보호 경로에 직접 접근하면 page redirect보다 `generateMetadata`의 unavailable 제목이 먼저 노출됐다. `proxy.ts`에서 세션 쿠키 존재 여부만 확인하는 조기 로그인 redirect를 추가했다. 만료·위조 세션의 최종 판정은 기존 route와 API가 계속 소유한다.
2. 채점 가능한 레슨에서 오답 피드백을 닫은 뒤 선택 표시는 초기화되지만 이전 답안 payload가 남아 `확인하기`가 활성화됐다. `lesson-session` 순수 상태 머신의 retry edit 전이가 현재 step 답안을 불변 방식으로 제거하도록 수정했다.
3. 잘못 percent-encoding된 세션 쿠키가 proxy 요청을 실패시키지 않고 미인증으로 수렴하도록 세션 토큰 정규화를 보강했다.

### 사용자 관점 검증 결과

- 데스크톱과 390×844 모바일 뷰포트에서 랜딩, 로그인, 홈, 코스 목록, 코스 상세, 레슨, 프로필과 전역 404를 확인했다.
- 코스 검색·빈 상태·필터 초기화·정렬·카테고리 URL 상태, 커리큘럼 disclosure와 active lesson 이동을 확인했다.
- 레슨 시작, 나가기 확인, 오답 재시도, 정답 전진, 쓰기 글자 수 검증, AI 코칭, 완료와 완료 후 코스·홈·프로필 집계 반영을 확인했다.
- 테마 선택과 새로고침 뒤 지속, 계정 메뉴와 로그아웃, 비로그인 동적 상세 경로의 즉시 로그인 redirect를 확인했다.
- 누락된 `lesson_id`, 앱·공개 경로 404의 서로 다른 복귀 링크, health·robots·sitemap·manifest 응답과 CSP header를 확인했다.
- 최종 브라우저 여정에서 console error·warning과 500 응답은 없었다. 의도적으로 요청한 404 문서는 브라우저가 해당 404 응답을 console error로 기록하는 정상 동작을 별도로 확인했다.

### 품질 게이트

| 검증             | 결과                                                         |
| ---------------- | ------------------------------------------------------------ |
| Oxlint           | 통과                                                         |
| root lint        | 문서 drift, architecture boundary, import cycle 포함 통과    |
| TypeScript       | 통과                                                         |
| Vitest           | 35개 파일, 108개 테스트 통과                                 |
| production build | Next.js 16.2.6 Turbopack build 통과                          |
| Playwright       | 테스트 전용 로그인 핵심 학습 여정과 신규 회귀 assertion 통과 |
| 수동 브라우저    | 전체 학습자 라우트와 데스크톱·모바일 주요 상태 통과          |
| 자원 정리        | 브라우저·Node·Bun 종료, 검증 port 해제, 임시 fixture DB 삭제 |

### 로컬 환경 관찰

- 기존 `apps/api/.env`, `apps/web/.env`의 `ENABLE_TEST_AUTH=true` 설정으로 로컬 dev server 기동은 확인했다.
- 기존 로컬 DB에 활성 하위 항목이 없는 `course-0c729254-d0eb-4c09-b039-4e0a05467fc2`가 있어 `bun run dev:app:setup`의 curriculum migration 검증은 중단됐다. 이는 확인된 로컬 데이터 상태이며 웹 아키텍처 결함이라는 근거는 없다.
- 사용자 로컬 DB는 초기화하지 않았다. 전체 기능 검증은 프로젝트 표준 E2E setup이 생성한 격리 SQLite fixture와 `ENABLE_TEST_AUTH=true` dev server에서 수행했다.

## 상태

- 시작일: 2026-07-19
- 완료일: 2026-07-19
- 상태: 완료
- 대상: `apps/web`
- 비대상: 제품 기능, URL, 화면 디자인, API 계약, 패키지 버전 변경

## 불변 조건

- 사용자가 관찰하는 화면, 문구, 상호작용, 접근성 이름과 navigation 결과를 바꾸지 않는다.
- `apps/api`가 인증·인가, 채점, 진도 전이와 persistence를 계속 소유한다.
- `@workspace/contracts/learning`의 canonical schema와 DTO를 유지한다.
- 기존 패키지 버전과 lockfile을 변경하지 않는다.
- 기존 dirty worktree의 웹 아키텍처와 무관한 변경을 보존한다.
- Google OAuth를 자동화하지 않으며 브라우저 검증은 `ENABLE_TEST_AUTH=true`를 사용한다.

## 목표 구조

```text
apps/web/src/
├── app/       # route와 조립
├── features/  # 사용자 능력 단위
├── entities/  # feature 간 공유 도메인 표현
├── shared/    # 도메인 중립 코드
├── server/    # 인증, 환경 변수, 원격 API 서버 adapter
└── proxy.ts   # CSP nonce와 request 경계
```

## 실행 순서

1. 기준 문서와 현재 회귀 테스트를 고정한다.
2. `shared`, `server`, `entities` 경계와 import 검사를 만든다.
3. auth, API transport와 runtime config를 새 계층으로 이동한다.
4. landing, course, home, profile 기능을 model/server/api/hooks/ui로 공배치한다.
5. lesson 기능을 기존 순수 상태 머신을 유지한 채 model/api/hooks/ui로 공배치한다.
6. `app`을 route와 route-private view 조립만 남도록 정리한다.
7. 중앙 `components`, `lib` 호환 경계를 삭제한다.
8. 전체 품질 게이트와 테스트 전용 로그인 E2E를 통과시킨다.
9. 문서를 최종 source와 동기화하고 상태를 완료로 바꾼다.

## 시작 기준선

- `apps/web` lint, typecheck와 production build 통과
- Vitest 31개 파일, 95개 테스트 통과
- import cycle과 architecture boundary 검사 통과
- 랜딩 초기 JavaScript gzip 46,800 bytes로 50,000 bytes 예산 통과

## 완료 구조

```text
apps/web/src/
├── app/
│   ├── (learner)/app/_views/       # 보호 shell의 route-private 조립
│   ├── (learner)/app/profile/_views/
│   └── _providers/                 # client provider 한정 경계
├── features/
│   ├── authentication/
│   ├── course-catalog/
│   ├── course-detail/
│   ├── landing/
│   ├── learner-home/
│   ├── learner-profile/
│   └── lesson-session/
├── entities/course/model/
├── shared/{auth,config,http,ui}/
├── server/{auth,env,http}/
└── proxy.ts
```

- `app` route는 입력 파싱, 인증·redirect, feature DAL 호출과 화면 조립만 수행한다.
- 서버 읽기는 각 feature의 `server/dal`, 브라우저 갱신은 각 feature의 좁은 `api` 포트가 소유한다.
- 홈·프로필·전역 nav의 정적 shell은 Server Component이고 필터, 테마, 계정 메뉴, 레슨 상호작용만 client 경계다.
- 레슨 상태 전이는 순수 reducer, 외부 요청은 effect adapter, React lifecycle 연결은 hook으로 분리했다.
- route/search parameter와 runtime env는 Zod 경계에서 검증한다.
- `exactOptionalPropertyTypes`, `useUnknownInCatchVariables`, `noFallthroughCasesInSwitch`를 web TypeScript 설정에 활성화했다.
- architecture test는 최상위 계층, 절대 import, 단방향 의존, feature 격리, model 순수성, client→server와 UI→DAL 금지를 강제한다.

## 검증 결과

| 검증                      | 결과                                                          |
| ------------------------- | ------------------------------------------------------------- |
| 패키지 버전·lockfile      | `package.json`, `apps/web/package.json`, `bun.lock` diff 없음 |
| Oxlint                    | 통과                                                          |
| TypeScript                | 통과                                                          |
| Vitest                    | 34개 파일, 106개 테스트 통과                                  |
| web architecture test     | 13개 규칙 통과                                                |
| import cycle              | 13개 workspace, 4개 runtime scope, 6개 core capability 통과   |
| root architecture ratchet | 7개 규칙, allowance 0개로 통과                                |
| production build          | Next.js 16.2.6 Turbopack build 통과                           |
| 랜딩 bundle               | 초기 7개 chunk, gzip 46,956 bytes                             |
| Playwright                | `ENABLE_TEST_AUTH=true` 격리 runner의 핵심 여정 2개 통과      |
| 자원 정리                 | 작업공간 Node/Bun 잔존 없음, 3100·3101·4100·4199 port 해제    |

## 의도적으로 유지한 호환 경계

- 새 dependency를 추가하지 않기 위해 `server-only` package 대신 architecture test로 client→server import를 차단한다.
- 기존 `@workspace/ui/lib/safe-navigation-path`의 순수 함수는 복제·공개 API 이동 없이 authentication model에서만 허용한다.
- 전역 404는 Server Component 분리 시 랜딩 초기 bundle이 58,169 bytes로 증가하는 Turbopack 결과가 확인되어 기존 단일 Client Component를 유지한다. 경로별 복귀 문구와 46KB대 bundle 예산을 동시에 보존하는 선택이다.
