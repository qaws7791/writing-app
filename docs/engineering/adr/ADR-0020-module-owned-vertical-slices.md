# ADR-0020: 모듈 소유 수직 슬라이스

## 상태

채택됨

## 날짜

2026-07-23

## 맥락

이전 전환 구조는 제품 policy와 port를 core에 두고 concrete adapter를 실행 앱에 배치했다. capability 하나를 변경할 때 core, API composition, app-owned adapter와 DB schema를 함께 수정해야 했고, 관리자 runtime 통합 뒤에는 한 앱이 서로 다른 제품 경계의 route와 persistence를 소유했다. 이 구조는 단계적 이동에는 유리했지만 최종 모듈러 모놀리스에서 변경 이유와 실패 경계를 모으지 못했다.

독립 서비스로 분리하면 배포·관측·데이터 일관성 비용이 즉시 늘어난다. 현재 요구는 독립 배포가 아니라 한 process와 SQLite 경계 안에서 제품 책임을 명확히 격리하는 것이다.

## 결정

- 제품 module은 domain, application, infrastructure와 HTTP interface를 하나의 수직 슬라이스로 소유한다.
- persistence schema·repository·seed와 provider adapter는 해당 제품 module infrastructure가 소유한다. API app은 concrete 제품 adapter를 소유하지 않고 module factory, 공통 middleware, runtime lifecycle과 composition만 소유한다.
- module 간 협력은 공개 application/query port와 commit 뒤 domain event로만 수행한다. 상대 schema·repository·table deep import와 cross-module FK·join은 허용하지 않는다.
- credential·session과 Better Auth vendor integration은 제품 module이 아닌 auth infra가 소유한다. identity module은 제품 profile·상태·role policy를 소유하고 API composition이 두 경계를 연결한다.
- DB infra는 schema-neutral SQLite client, transaction, backup과 destructive guard만 제공한다. application migration 순서와 schema 조립은 ADR-0022의 현재 schema era 계보를 따른다.
- frontend는 공개 HTTP contract만 소비하고 module 또는 DB source를 직접 import하지 않는다.
- 전환용 forwarding, compatibility facade와 app/module 이중 구현은 최종 구조에 남기지 않는다.

## 대안과 트레이드오프

- app-owned adapter 유지: 실행 lifecycle과 technology가 가깝지만 한 앱에 여러 제품 변경 이유가 누적되고 module의 persistence 책임이 분리된다.
- 공유 persistence package 집중: 저장 기술은 모이지만 제품 schema와 repository가 거대한 공통 변경 경계가 된다.
- 독립 서비스 분리: 배포 격리는 강해지지만 분산 transaction, network failure와 운영 비용이 현재 규모에서 이점을 앞선다.

선택한 구조는 module 내부 응집도와 유지보수성을 높이는 대신 API composition port와 경계 test 수를 늘린다. 단일 process 호출이므로 network 비용은 추가하지 않지만 성능 개선 자체는 측정된 사실이 아니라 추론이다. 보안과 장애 격리는 schema 직접 접근 금지, 명시적 설정 주입, Result·event 실패 계약과 정적 architecture 검사로 유지한다.

## 영향과 대체 관계

새 제품 기능은 먼저 책임 module과 공개 협력 계약을 정해야 한다. 별도 배포나 DB가 필요해지는 시점에는 같은 port를 추출 경계로 재평가하되 미리 remote abstraction을 만들지 않는다. 현재 source 위치와 package 수는 코드·설정에서 확인하고 이 ADR에 복제하지 않는다.

이 결정은 ADR-0014의 app-owned concrete persistence 위치를 대체한다. ADR-0018의 인증 vendor 경계와 ADR-0022의 현재 schema era 계보는 이 결정의 예외·실행 규칙으로 함께 유지한다.

## 검증

workspace inventory, dependency graph, package public interface, runtime cycle, schema ownership, cross-module SQL·FK, frontend import와 제거 잔존물 검사를 통과해야 한다. module 단위·HTTP·E2E test와 migration·backup 검증은 구조 검사만으로 증명할 수 없는 동작과 복구 계약을 보완한다.
