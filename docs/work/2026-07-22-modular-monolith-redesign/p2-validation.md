# P2 구현 증거

## 검증된 구현

- `packages/shared/types`가 runtime 없는 `Brand`와 P0에서 확정한 canonical ID를 소유한다. Zod schema 또는 ID 생성·persistence 신뢰 경계 factory만 string을 brand로 바꾸며, type fixture와 package interface 검사가 ID 오용과 중복 선언을 거부한다.
- `packages/shared/kernel`은 neverthrow 8.2.0의 좁은 Result surface, `Clock`, `IdGenerator`, immutable `DomainEvent`·`DomainDecision`만 공개한다. mutable event collection은 type fixture가 거부하고 framework·workspace runtime·`process.env` 의존은 architecture와 interface 검사가 막는다.
- `packages/shared/errors`는 infrastructure·transport 오류만 immutable union으로 공개한다. module domain 오류와 cause·stack·SQL·credential·개인정보 필드는 type·runtime test와 interface 검사 대상이다.
- `packages/shared/event-contracts`에는 P0에서 합의한 cross-module event 5개만 있다. 이름과 payload는 exhaustive fixture로 고정했고, dependency는 kernel과 types로 제한했다.
- contracts, resource-document, UI의 물리 경로를 각각 `packages/shared/contracts`, `packages/shared/resource-document`, `packages/shared/ui`로 옮기고 이전 package 경로를 제거했다. 세 package 모두 root barrel 없이 manifest의 explicit subpath만 공개한다.
- contracts의 기존 `admin` umbrella를 `content`, `identity`, `operations`, `resource-library` 소유 context로 분해했다. learner와 admin의 HTTP interface·frontend는 같은 canonical Zod schema를 직접 import하며 성공 response도 runtime parse한다.
- resource-document는 GFM Markdown parse·serialize·validation과 headless Lexical node만 소유한다. tree·저장·권한·asset lifecycle 파일의 재유입을 package interface 검사가 거부한다.
- UI는 접근성 primitive와 lesson presentation export를 분리하고 React·React DOM을 peer와 dev dependency로 선언한다. app·module·API·auth·DB·HTTP client·Next navigation 의존과 직접 I/O·server command를 정적 검사로 거부한다.

## 자동 검증

권위 package manager인 Bun 1.3.10으로 다음 결과를 확인했다.

- shared 7개 package와 core, API, web, admin, DB, Storybook typecheck 통과
- contracts 12개 파일·56개, resource-document 3개 파일·71개, errors 1개 파일·1개, UI 8개 파일·35개 test 통과
- core 22개 파일·109개, API 56개 파일·278개 회귀 test 통과
- Storybook interaction·a11y 42개 파일·179개 test와 정적 build 통과
- `check:architecture`, `check:dead-code`, `check:package-interfaces`, workspace inventory·dependency version 검사 통과
- root `format:check`, lint, 18-workspace typecheck, 12-workspace test, web·admin·Storybook build 통과. production build는 `apps/web/.env.example`과 `apps/admin/.env.example`의 비밀 없는 검증 입력을 명시했다.
- frozen install은 변경 없이 통과했다. pre-commit hook은 종료 코드 0이었지만 staged file이 없어 hook 작업은 skip됐고, 동일 검사는 위 root 전체 범위 명령으로 별도 통과시켰다.

초기 build는 production origin 입력 없이 fail-closed한 뒤 위 검증 입력으로 성공했다. 이는 코드 실패와 구성 전제 실패를 구분해 기록한 것이다.

## 선택과 trade-off

- neverthrow 표준화는 Result 의미와 조합 API의 장기 일관성을 높이는 대신 기존 custom Result 소비자를 한 번에 전환하는 단기 비용이 있었다. 임시 이중 API는 drift를 만들므로 남기지 않았다.
- context·primitive 단위 explicit export는 의존 의도, 변경 영향과 bundle 분석을 명확하게 하지만 manifest 항목 수를 늘린다. exact export snapshot으로 이 관리 비용을 자동화했다.
- canonical branded ID는 컴파일 시점의 의미 안전성을 높이지만 신뢰 경계의 parse·factory 비용을 요구한다. 임의 cast를 공용 helper로 숨기지 않고 각 경계를 드러냈다.
- UI와 문서 package의 직접 I/O·업무 lifecycle 금지는 재사용성과 장애 격리를 높이는 대신 앱 adapter의 조립 코드가 늘어난다. 이는 공유 package가 제품 정책을 흡수하는 장기 결합보다 작은 비용으로 판단했다.

## 추론과 제한

기존 route와 UI 동작의 성능이 악화되지 않았다는 판단은 source 이동, 동일한 소비 schema, 회귀 test와 Storybook build에 근거한 추론이다. 별도 성능 benchmark나 production traffic 검증은 수행하지 않았으므로 성능 동일성을 검증된 사실로 간주하지 않는다. Storybook build는 성공했지만 vendor의 `use client` directive와 기존 chunk 분할 관련 Vite warning은 남아 있으며 P2 기능 실패로 판정하지 않았다.
