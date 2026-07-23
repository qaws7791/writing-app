# ADR-0018: Better Auth 내부 package 경계

## 상태

채택됨

## 날짜

2026-07-22

## 맥락

확인된 source에서 학습자 API, 관리자 API와 두 Next.js 앱이 Better Auth의 설정·client 호출을 각자 소유했고 seed script도 비밀번호 해시 구현을 직접 가져왔다. 반면 인증 DB lifecycle, learner/admin schema mapping, 학습자 profile 저장과 관리자 session 삭제는 API runtime에 결합되어 있다. 이 persistence 책임까지 공유 package로 옮기면 package가 앱 DB와 migration 변경에 결합되고 runtime lifecycle 소유권이 불분명해진다.

Better Auth 설정은 secret, origin, cookie, provider, hook과 session 변환이 함께 바뀌는 보안 경계다. 세 runtime이 vendor API를 직접 소비하면 업그레이드와 보안 검토가 분산된다. 성능 병목이 확인된 것은 아니며 이 결정은 실행 성능 개선이 아니라 vendor 변경 경계와 client/server 번들 격리를 목표로 한다.

## 결정

- `packages/auth`를 `@workspace/auth` 내부 package로 두고 root barrel 없이 learner/admin의 명시적인 client/server subpath만 공개한다.
- package는 Better Auth server 설정, 공식 vanilla client 호출, 테스트 인증, session 변환, password hash와 token 정규화를 소유한다.
- SQLite adapter 생성은 opaque Interface 뒤에 격리한다. API가 DB lifecycle과 명시적인 learner/admin schema mapping을 소유해 factory에 전달한다.
- 학습자 profile repository와 테스트 사용자 표시명 동기화 port 구현, 관리자 session revoker 구현은 app-owned adapter로 API에 둔다.
- 학습자와 관리자 secret, cookie, table, origin, endpoint를 합치지 않는다. 기존 schema, migration과 HTTP 계약도 변경하지 않는다.
- 인증 cookie 이름은 `@workspace/contracts/auth-session-cookie`가 계속 소유하며 auth package는 재수출하지 않는다.
- `better-auth` 직접 import는 auth package만 허용하고 client subpath의 server, core, DB와 ORM import를 정적 검사로 거부한다.
- ADR-0020의 module-owned 제품 persistence를 따른다. auth infra가 credential·session schema와 Better Auth integration을 소유하고 API가 DB lifecycle과 identity 연결을 조립하는 이 ADR의 인증 전용 경계는 유지한다.

## 대안과 트레이드오프

### 앱별 Better Auth 설정 유지

- 장점: 새 workspace와 공개 Interface가 없다.
- 단점: vendor 업그레이드, cookie 보안 설정과 오류 처리 변경이 여러 앱에 분산되고 구현 차이가 누적된다.

### 인증 persistence까지 package로 이동

- 장점: 인증 관련 source가 한 package에 가장 많이 모인다.
- 단점: 앱 DB lifecycle, schema와 migration에 package가 결합되고 app-owned repository 경계가 약해진다. 독립 배포 단위도 아니므로 결합 비용을 상쇄할 이점이 부족하다.

### 선택한 client/server subpath package

- 장점: vendor API와 보안 설정의 변경 지점을 하나로 제한하면서 persistence와 runtime lifecycle은 실제 owner에 남긴다. Next.js client graph도 공개 subpath로 정적으로 분리할 수 있다.
- 단점: workspace, factory 입력 Interface와 조립 코드가 늘어난다. 학습자와 관리자의 의도적인 분리 때문에 설정 일부는 별도 runtime factory에 남는다.

## 영향

- 확장성: 새 인증 consumer는 같은 vendor 경계를 재사용할 수 있지만 provider나 정책이 다르면 기존 runtime factory에 억지로 합치지 않는다.
- 유지보수성: Better Auth 변경은 auth package test와 public Interface에서 검토한다. API mapping과 repository 변경은 앱 경계에서 독립적으로 검토한다.
- 보안: secret과 cookie 계약의 학습자/관리자 격리를 유지하고, 테스트 인증의 production 금지와 외부 callback 차단을 package 회귀 테스트로 고정한다.
- 성능: source 이동만으로 runtime 성능 향상은 예상하지 않는다. 이는 측정 전 추론이며, client/server import 검사가 번들 누출 방지의 직접 수단이다.
- 롤백: migration이 없으므로 package source, app import와 manifest를 같은 변경 단위로 복원한다. compatibility forwarding이나 이중 구현은 남기지 않는다.

## 검증

- auth, API, Web, Admin의 인증 단위·통합 테스트와 핵심 테스트 인증 E2E를 실행한다.
- package export, architecture boundary, workspace dependency, import cycle과 coverage inventory 검사를 통과해야 한다.
- `packages/auth` 밖의 Better Auth import, root barrel, client-to-server import와 workspace cycle이 없어야 한다.
- 기존 endpoint, cookie 속성, OpenAPI, DB schema와 migration에 의미 변경이 없어야 한다.
