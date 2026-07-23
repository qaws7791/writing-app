# 보안 원칙

## 목적

이 문서는 제품과 운영이 지켜야 할 보안 기준을 정의한다. 현재 middleware, header, cookie, CSP, rate limit, image lock과 dependency 예외는 코드·설정·workflow가 소유한다.

## 기본 원칙

- 최소 권한, 명시적 신뢰 경계, fail-closed와 민감 정보 최소화를 기본으로 한다.
- 인증·인가·입력 검증·오류 변환은 외부 입력이 application에 도달하기 전에 적용한다.
- 브라우저 제어와 서버 인가는 독립적인 경계이며, 한쪽 성공이 다른 쪽을 대체하지 않는다.
- security control의 실제 값과 적용 범위는 runtime source와 테스트로 확인한다.

## 인증·인가

- credential, session, cookie와 role은 사용자 목적별로 분리하고 rotation·폐기 경로를 제공한다.
- 보호된 read와 write 모두 server-side authorization을 요구한다.
- 권한 변경, password 변경, 계정 정지·삭제는 기존 session과 장기 token의 영향을 함께 검토한다.
- test-only 인증과 개발 편의 설정은 production에서 fail-closed해야 한다.

## 네트워크·rate limit 신뢰 경계

- client IP 기반 제어는 reverse proxy가 신뢰 가능한 upstream을 기준으로 정제하고 덮어쓴 전용 header만 입력으로 사용한다. 애플리케이션은 일반 전달 header를 직접 해석하지 않는다. 현재 경계는 [Caddy 설정](../../deploy/caddy/caddyfile), [HTTP 보안 adapter](../../packages/infra/http-platform/src/security/trusted-client-ip.ts)와 [관리자 AI route](../../packages/modules/operations/src/interface/http/ai-routes.ts)가 소유한다.
- 인증 남용 방지, 관리자 AI quota와 학습자 AI feedback 시도 제한은 각각의 capability가 독립된 상태와 정책을 소유한다. 실제 owner와 저장 구조는 [auth schema](../../packages/infra/auth/src/schema), [operations schema](../../packages/modules/operations/src/infrastructure/persistence/schema.ts), [ai-feedback schema](../../packages/modules/ai-feedback/src/infrastructure/persistence/schema.ts)에서 확인한다.

## 입력·출력·브라우저

- 모든 외부 입력은 크기·형식·권한·소유권을 검증한다.
- 오류와 로그는 secret, credential, raw request body, 내부 stack과 provider 원문을 노출하지 않는다.
- 공개 응답과 인증된 응답은 cache 정책을 분리한다.
- 브라우저 API는 앱별 same-origin 경로로 제한하고 학습자와 관리자 public origin을 분리한다. 상태 변경 요청의 trusted origin·CSRF 방어, reverse proxy Host routing, security header와 CSP는 함께 검토한다.
- upload와 외부 URL은 MIME, 크기, 접근 권한, 저장 위치와 공개 경로를 분리해 검증한다.

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
