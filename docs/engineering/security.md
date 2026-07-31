# 보안 원칙

## 목적

이 문서는 제품과 운영이 지켜야 할 보안 기준을 정의한다. 현재 middleware, header, cookie, CSP, rate limit, image lock과 dependency 예외는 코드·설정·workflow가 소유한다.

## 기본 원칙

- 최소 권한, 명시적 신뢰 경계, fail-closed와 민감 정보 최소화를 기본으로 한다.
- 인증·인가·입력 검증·오류 변환은 외부 입력이 application에 도달하기 전에 적용한다.
- 브라우저 제어와 서버 인가는 독립적인 경계이며, 한쪽 성공이 다른 쪽을 대체하지 않는다.
- security control의 실제 값과 적용 범위는 runtime source와 테스트로 확인한다.

## 인증·인가

- credential, session과 cookie는 학습자·관리자 목적별로 분리하고 rotation·폐기 경로를 제공한다.
- 학습자 email/password 인증은 이메일 확인 전 session과 보호 API 접근을 허용하지 않고, 중복 가입과 확인 메일 재전송 응답으로 계정 존재 여부를 노출하지 않는다.
- 비밀번호 재설정 요청은 존재·비존재 이메일과 메일 provider 실패에 같은 외부 응답을 사용한다. 재설정 token은 한 시간 안에 한 번만 소비하고, 변경 성공 시 기존 학습자 session을 모두 폐기한다.
- 검증된 동일 이메일의 Google account만 기존 credential user에 연결하며, 다른 이메일 연결과 provider profile의 기존 사용자 덮어쓰기를 허용하지 않는다.
- 인증 메일 전달은 절대 HTTP(S) callback, 제한 시간과 정규화된 실패만 허용하며 API key, 메일 본문과 provider 원문을 로그에 남기지 않는다.
- 보호된 read와 write 모두 server-side authorization을 요구한다.
- 권한 변경, password 변경, 계정 정지·삭제는 기존 session과 장기 token의 영향을 함께 검토한다.
- 테스트 fixture도 공개 인증 handler를 우회하는 전용 route를 추가하지 않는다.

## 네트워크·rate limit 신뢰 경계

- client IP 기반 제어는 Caddy가 직접 연결의 remote address로 덮어쓴 전용 header만 입력으로 사용한다. 외부 요청의 일반 전달 header와 client IP 주장은 신뢰하지 않으며 애플리케이션도 이를 직접 해석하지 않는다. 현재 경계는 [Caddy 설정](../../deploy/caddy/caddyfile)과 [HTTP 보안 adapter](../../packages/infra/http-platform/src/security/trusted-client-ip.ts)가 소유한다.
- 인증 남용 방지와 학습자 AI feedback 제한은 각 capability가 독립된 상태와 정책을 소유한다. 실제 owner와 저장 구조는 [auth schema](../../packages/infra/auth/src/schema)와 [ai-feedback schema](../../packages/modules/ai-feedback/src/infrastructure/persistence/schema.ts)에서 확인한다.
- 관리자 로그인은 기본 제한보다 강한 sign-in 경로 제한을 적용하고 그 결과를 일반 인증 실패와 구분되는 사용자 안내로 옮긴다. 관리자는 owner 단일 계정이고 자기 잠금 해제 경로가 없으므로 계정 단위 잠금은 도입하지 않는다. 계정 잠금이 필요해지면 잠금 해제 주체와 절차를 먼저 정한다. 현재 값은 [관리자 auth runtime](../../packages/infra/auth/src/admin/server.ts)이 소유한다.
- 확인 메일 재전송 제한은 현재 단일 API process의 메모리 저장소를 사용한다. 여러 API instance로 확장하기 전 auth schema migration과 함께 공유·원자적 저장소로 전환해야 한다.

## 입력·출력·브라우저

- 모든 외부 입력은 크기·형식·권한·소유권을 검증한다. 학습자 인증 POST body는 공통 API 제한보다 작은 전용 상한을 먼저 적용하고 이메일·비밀번호 필드 길이를 함께 제한한다.
- 오류와 로그는 secret, credential, raw request body, 내부 stack과 provider 원문을 노출하지 않는다.
- 공개 응답과 인증된 응답은 cache 정책을 분리한다.
- 브라우저 API는 앱별 same-origin 경로로 제한하고 학습자와 관리자 public origin을 분리한다. 상태 변경 요청의 trusted origin·CSRF 방어, reverse proxy Host routing, security header와 CSP는 함께 검토한다.
- upload와 외부 URL은 MIME, 크기, 접근 권한, 저장 위치와 공개 경로를 분리해 검증한다.

## 로그 데이터 경계

- 일반 request log는 허용 필드만 재구성하며 이메일, 이름, 답안, prompt, secret, credential, token, cookie, raw body, IP와 User-Agent를 기록하지 않는다.
- URL은 query 전체를 제거하고, request path에는 실제 식별자가 포함된 URL 대신 매칭된 route template을 사용한다. provider cause와 provider 원문도 공통 redaction 대상이다.
- IP는 `security.audit`와 operations DB audit에서만 명시적으로 허용하고, User-Agent는 `security.audit`에만 허용한다. IP는 신뢰 경계가 검증한 단일 주소만, User-Agent는 제어 문자를 제거한 제한 길이 값만 사용한다.
- audit와 AI usage event는 원문 payload를 받지 않는 schema를 사용한다. AI usage에는 model, prompt policy version, token 수, latency, outcome과 정규화한 실패 code만 기록한다. global redaction은 최종 방어선이며 schema의 허용 목록을 대신하지 않는다.
- 현재 필드, redaction과 보존 class의 실행 계약은 [observability event](../../packages/infra/observability/src/events.ts), [request logger](../../packages/infra/observability/src/request-logger.ts), [security logger](../../packages/infra/observability/src/security-audit-logger.ts)가 소유한다.
- 인증된 owner의 사용자 상세 조회·상태 변경·삭제와 콘텐츠 발행·보관은 operations가 소유한 DB audit에 기록한다. 인증·인가에 실패해 신뢰할 수 있는 actor를 확정하지 못한 요청은 DB audit에 넣지 않고 `security.audit`에만 기록한다.
- DB audit는 임의 payload를 받지 않고 허용된 action과 opaque actor·target ID만 저장한다. client IP는 reverse proxy 신뢰 경계가 검증한 값만 저장하며 검증할 수 없으면 `NULL`로 남긴다.
- 개인정보 조회와 고위험 mutation은 `started` 감사 row의 사전 저장이 실패하면 실행하지 않는다. 결과 종결 실패도 성공 응답으로 숨기지 않으며, 남은 `started` row는 누락 없는 보수적 장애 신호다.

## 데이터·provider·공급망

- 개인 정보와 학습 답안은 목적에 필요한 범위만 저장하고 접근·보존·삭제 정책을 적용한다.
- AI provider에는 최소 입력만 전달하고 timeout, 취소, rate limit과 실패 변환을 둔다.
- dependency와 runtime image는 재현 가능한 식별자로 관리하고 보안 갱신·취약점 예외·만료를 검토한다.
- backup과 복구는 production 원본을 덮어쓰지 않는 격리된 경로에서 정기적으로 검증한다.

## 변경 검토

1. 공격 표면, 신뢰 경계, 민감 데이터와 실패 시 영향을 식별한다.
2. 인증·인가, 입력 검증, logging, cache, rate limit, rollback 영향에 대한 테스트를 추가한다.
3. 외부 공개 범위, secret store, CSP, provider, image 또는 데이터 보존 정책을 바꾸면 ADR 필요성을 판단한다.
4. 실제 보안 검증 결과는 commit과 환경이 고정된 archive 보고서로 남긴다.
