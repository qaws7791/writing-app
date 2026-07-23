# ADR-0023: 앱 origin별 API reverse proxy

## 상태

채택됨 — source topology 구현 완료, production 전환 검증은 미실행

## 날짜

2026-07-24

## 맥락

브라우저가 별도 API public origin을 호출하면서 API base URL, CORS, cross-subdomain cookie, Host allowlist와 CSP 연결 대상이 앱·배포·검사 코드에 반복됐다. 학습자와 관리자는 서로 다른 인증 realm과 XSS 영향 범위를 유지해야 하지만, 이를 위해 API 자체가 세 번째 public origin일 필요는 없다.

저장소 스냅샷에서는 API public origin을 직접 소비해야 하는 외부 client가 확인되지 않았다. 이는 정적 source 범위의 사실이며 운영 중인 외부 호출자가 없다는 증거는 아니다.

## 결정

- 학습자와 관리자 public origin은 분리한다.
- 학습자 origin의 `/api/*`와 관리자 origin의 `/api/admin/*`를 Caddy가 내부 `api:4000`으로 전달한다. 학습자 origin에서는 관리자 namespace를 공개하지 않는다.
- API 전용 public host와 browser API base URL 설정을 제거한다. API container는 내부 network에서만 접근한다.
- 브라우저 adapter는 상대 경로와 host-only session cookie를 사용한다. CORS는 두지 않으며 상태 변경 요청의 trusted origin 검증은 유지한다.
- Server Component의 DAL은 내부 `API_BASE_URL`로 API를 직접 호출한다. 로컬 개발에서만 Next rewrite가 상대 브라우저 경로를 내부 API로 전달한다.
- 관리자 AI stream은 별도 Next Route Handler를 거치지 않고 관리자 origin의 API proxy 경로를 사용한다.

## 대안과 trade-off

- 별도 API public origin 유지: 외부 client에는 단순하지만 CORS·cookie domain·공개 설정과 검증 조합을 계속 소유한다.
- Next BFF로 모든 API 중계: 앱별 제어는 강하지만 route와 오류·streaming 전달 코드를 다시 만들고 Next runtime이 추가 장애 지점이 된다.
- 학습자와 관리자를 한 origin으로 통합: 설정은 가장 적지만 한 앱의 XSS가 다른 인증 realm에 도달할 수 있어 채택하지 않는다.

선택한 구조는 브라우저 보안 경계와 설정 수를 줄이는 대신 Caddy path routing을 핵심 가용성 경계로 만든다. API를 직접 호출하던 외부 consumer가 있다면 호환되지 않는 변경이다.

## 배포 조건

production 적용 전에 외부 API consumer와 Cloudflare tunnel/DNS route를 확인하고 Google OAuth redirect URI를 학습자 origin의 callback 경로로 갱신한다. 기존 Domain cookie는 만료 전까지 브라우저에 남을 수 있으므로 즉시 격리가 필요하면 session 폐기와 cookie 만료 계획을 별도로 승인한다. 두 앱 origin의 health·인증·상태 변경·관리자 stream smoke가 통과한 뒤에만 API public route를 제거한다.

이 ADR은 source 구성을 설명하며 production traffic 전환, 외부 consumer 부재, 기존 cookie 만료 또는 OAuth 설정 완료를 주장하지 않는다.
