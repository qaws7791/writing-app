# ADR-0017: 관리자 웹 기능 슬라이스 아키텍처 전환

## 상태

채택됨 — 구현 완료

## 날짜

2026-07-20

## 맥락

`apps/admin`은 Next.js App Router와 별도 Hono API runtime을 사용하지만
`src/components`, `src/lib`, 루트 runtime config와 넓은 feature 폴더가 함께
존재한다. 화면, 계약 parsing, HTTP transport와 서버 인증의 변경 이유가 분리되지
않고 일부 대형 Client Component가 모델 전이와 I/O lifecycle까지 소유한다.

관리자 웹은 API runtime의 인가와 persistence 경계를 우회해서는 안 된다. 따라서
일반적인 Next.js 예시처럼 웹 앱에 DB repository를 도입하지 않고, feature-local
DAL이 원격 관리자 API를 호출하고 canonical 계약을 검증해야 한다.

## 결정

- `apps/admin/src`의 최상위 runtime 계층을 `app`, `features`, `entities`, `shared`,
  `server`로 제한한다.
- 의존성은 `app → features → entities → shared` 방향으로 흐른다. `app`과 feature의
  server 모듈은 `server`를 사용할 수 있고 `server`는 `entities`와 `shared`만
  사용한다.
- 다른 feature의 내부 경로 import를 금지한다. 여러 feature가 공유하는 안정된
  도메인 표현은 `entities`, 도메인 중립 코드는 `shared`로 승격한다.
- `app`은 Zod 기반 route 입력 parsing, 인증 redirect, `notFound`, feature DAL 호출과
  화면 조립만 담당한다.
- Server Component가 조회를 직접 시작한다. 브라우저 재조회가 필요한 편집기는 좁은
  feature API adapter를 사용하고 조회용 Server Action은 제거한다.
- Server Action은 `unknown` 입력을 command schema로 parsing하고 action 내부에서
  관리자 세션을 확인한 다음 mutation DAL을 호출한다.
- AI SSE route의 App Router 파일에는 얇은 진입점만 두고 origin, body 크기와 schema,
  세션, upstream 응답 처리는 `features/ai-chat/server/route-handlers`가 소유한다.
- Server Component를 기본값으로 유지하고 dialog, mutation, chart, 편집기처럼
  상호작용이 필요한 최소 경계만 Client Component로 둔다.
- Recharts와 Lexical은 기존 동적 import 경계를 유지한다.
- `exactOptionalPropertyTypes`, `useUnknownInCatchVariables`,
  `noFallthroughCasesInSwitch`를 Admin TypeScript 설정에 활성화한다.
- 새 dependency와 캐시 정책 변경은 도입하지 않는다. `server-only` package 대신
  architecture test가 Client Component의 server import를 차단한다.

## 대안과 트레이드오프

### 기존 구조를 점진적으로 유지

단기 diff와 회귀 위험은 작지만 구 경로 forwarding module이 장기간 남아 두 구조를
동시에 이해해야 한다. feature 격리와 자동 경계 검사의 이익이 지연되어 기술 부채가
누적되므로 선택하지 않는다.

### 공통 BaseService 또는 BaseRepository 도입

CRUD boilerplate는 줄지만 CRUD, SSE, reducer 편집기와 ETag 문서 저장의 실패 의미를
하나의 추상화에 숨긴다. 타입과 장애 경계가 넓어지고 변경 영향이 커지므로
feature-local 함수 합성을 선택한다.

### 클라이언트 query library 도입

브라우저 재조회와 optimistic update를 표준화할 수 있으나 dependency와 cache 정책,
hydration 의미가 동시에 바뀐다. 이번 작업은 동작 보존 아키텍처 전환이므로 현재의
좁은 adapter와 React/Next.js primitive를 유지한다.

## 결과

- 변경 이유가 같은 model, DAL, action, route handler와 UI가 한 feature에 모인다.
- Client bundle과 RSC 직렬화 범위를 명시적으로 제한할 수 있다.
- 작은 feature-local adapter가 늘어나지만 중앙 서비스 결합과 장애 전파 범위는
  줄어든다.
- architecture test와 경계 fixture가 늘어 CI 비용이 소폭 증가한다.
- 단일 대형 전환은 중간 병합이 어렵지만 forwarding module 없이 최종 구조를 한 번에
  강제한다. 문서·테스트·기반·feature·app 단계의 작은 변경 단위로 리뷰와 롤백
  지점을 남긴다.
- 공개 런타임 설정 parser는 Server Component 경계에서 실행하고 Client Component에는
  검증된 값만 전달한다. 이 경계는 설정 검증을 유지하면서 대시보드 초기 번들에서
  Zod를 제거한다.
- 2026-07-20에 완료 조건의 lint, typecheck, 123개 Admin 테스트, production build,
  architecture, cycle, bundle, 테스트 인증 E2E 검증이 모두 통과했다.

## 완료 조건

- `apps/admin/src/components`, `apps/admin/src/lib`, `features/shared`와 루트 runtime
  config가 제거된다.
- 승인되지 않은 feature 간 import, Client→server, UI→DAL과 module cycle이 0이다.
- route/search parameter, Server Action 입력, 환경 변수와 API 응답을 신뢰 경계에서
  검증한다.
- lint, typecheck, test, production build, architecture, bundle과 E2E 검증이 통과한다.
- 관련 living documentation이 최종 source 구조와 일치한다.
