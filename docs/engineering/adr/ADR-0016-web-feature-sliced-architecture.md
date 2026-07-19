# ADR-0016: 학습자 웹 기능 슬라이스 아키텍처 전환

## 상태

채택됨 — 구현 완료

## 날짜

2026-07-19

## 맥락

`apps/web`은 Next.js App Router와 Server Component를 사용하지만 `src/components`,
`src/lib` 같은 전역 기술 폴더, 화면 전체 Client Component, 중앙
`WritingAppApi` 포트와 feature 간 내부 import가 함께 존재한다. API 응답은
`@workspace/contracts/learning`의 canonical Zod schema로 검증하지만 route parameter와
웹 환경 변수 검증, 앱 내부 계층 방향은 자동화되어 있지 않다.

학습자 웹은 별도 `apps/api` runtime을 통해서만 데이터를 읽고 쓴다. 따라서 일반적인
Next.js 예시의 DB DAL을 웹에 도입하면 현재 서비스 경계와 frontend→persistence 금지
규칙을 위반한다. 웹의 DAL은 원격 API를 호출하고 canonical 계약을 검증하는
feature-local adapter여야 한다.

## 결정

- `apps/web/src`의 최상위 런타임 계층을 `app`, `features`, `entities`, `shared`,
  `server`로 제한한다.
- 의존성은 `app → features → entities → shared` 방향으로 흐른다. `app`과
  `features`는 서버 플랫폼인 `server`를 사용할 수 있고, `server`는 `entities`와
  `shared`만 사용한다.
- 다른 feature의 내부 경로 import를 금지한다. 둘 이상의 feature가 공유하는 안정된
  도메인 표현은 `entities`, 도메인 중립 코드는 `shared`로 승격한다.
- `app`은 route parameter 검증, 인증 redirect, 데이터 요청 시작, Next.js routing
  decision과 화면 조립만 담당한다.
- 원격 API endpoint, query와 mutation은 feature에 공배치한다. 공통 HTTP transport,
  인증 cookie 전달과 환경 변수 파싱만 `shared` 또는 `server`가 소유한다.
- Server Component를 기본값으로 유지하고 상호작용이 필요한 최소 leaf만 Client
  Component로 둔다.
- 사용자 URL, 화면 문구, 접근성 의미, API request/response, 인증·redirect, cache와
  오류 의미는 전환 전후에 동일하게 유지한다.
- 현재 설치된 패키지의 버전과 lockfile은 변경하지 않는다. 새 상태 관리 패키지도
  추가하지 않고 기존 React·Next.js 기능으로 현재 동작을 보존한다.
- Oxfmt, Oxlint와 기존 repository tooling을 확장하고 ESLint나 dependency-cruiser를
  중복 도입하지 않는다.
- 레슨의 순수 상태 머신, 서버가 소유하는 채점 결과와 UI orchestration 경계는
  ADR-0003을 유지한다.
- strict CSP의 request nonce와 동적 root layout은 ADR-0006을 유지한다.

## 기존 저장소에 대한 적응

- 가이드의 `server-only` marker package는 현재 manifest와 lockfile에 없다. 패키지 버전과 의존성 집합을 동결한다는 이번 불변 조건 때문에 새 패키지를 추가하지 않고, Client Component의 `@/server` 및 feature `server` import를 architecture test로 차단한다. 다음 dependency 변경 창에서 marker package 도입을 별도 검토할 수 있다.
- 안전한 내부 이동 경로의 canonical 순수 함수는 기존 `@workspace/ui/lib/safe-navigation-path`에 있다. 이번 작업에서 이를 복제하거나 패키지 공개 API를 이동하지 않고, feature model의 이 단일 순수 import만 명시적으로 허용한다. UI component·hook import는 계속 실패한다. 장기적으로 공용 도메인 중립 패키지가 생길 때 이동하는 편이 책임상 더 정확하지만, 현재는 새 패키지 비용이 이 한 함수의 위치 부채보다 크다.
- `exactOptionalPropertyTypes`는 `apps/web`에 활성화했다. 이 앱이 source로 소비하는 `packages/ui`의 두 내부 선택 prop 전달부도 prop이 없을 때 key 자체를 생략하도록 최소 수정했다. 공개 UI와 런타임 출력은 바뀌지 않는다.

## 결과

- 변경 이유가 같은 model, API adapter, hook과 UI가 한 feature 안에 모인다.
- 화면 전체 hydration과 RSC 직렬화 범위를 줄일 수 있다.
- 작은 feature-local adapter가 늘어날 수 있지만 중앙 서비스의 결합과 변경 반경은
  줄어든다.
- 구조 이동 중에도 route와 feature 단위로 독립 검증과 롤백이 가능하다.
- 앱 내부 경계 검사가 늘어 CI 비용이 소폭 증가하지만 잘못된 server/client import와
  순환 의존을 merge 전에 차단한다.

## 완료 조건

- `apps/web/src/components`와 `apps/web/src/lib`가 제거된다.
- 승인되지 않은 feature 간 import, client→server import와 module cycle이 0이다.
- route/search parameter, 환경 변수와 API 응답을 각 신뢰 경계에서 검증한다.
- lint, typecheck, unit/component test, production build, architecture 검사와 핵심 E2E가
  통과한다.
- 기존 패키지 manifest와 `bun.lock`의 버전 내용이 변경되지 않는다.
- 관련 living documentation이 최종 source 구조와 일치한다.

## 완료 결과

2026-07-19에 마이그레이션을 완료했다. `components`, `lib` 기술 폴더를 제거하고 여섯 feature와 `entities/course`, `shared`, `server`, route-private `_views`, provider 조립 경계로 이동했다. route·search parameter와 서버·브라우저 환경 변수를 Zod로 파싱하고, 서버 조회는 feature-local DAL로 공배치했다. 홈과 프로필의 정적 영역, 전역 nav shell을 Server Component로 되돌리고 상호작용 leaf만 client 경계로 유지했다.

Vitest 34개 파일 106개 테스트, Oxlint, 강화된 web architecture test, TypeScript, import cycle, root architecture ratchet와 production build가 통과했다. 테스트 전용 인증을 사용한 Playwright 핵심 여정 2개도 통과했다. 랜딩 초기 JavaScript는 7개 chunk, gzip 46,956 bytes로 기존 50,000 bytes 예산 안에 유지됐다. package manifest와 `bun.lock`은 변경하지 않았다.
