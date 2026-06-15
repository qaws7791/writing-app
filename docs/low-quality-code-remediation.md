# 저품질 코드 개선 기록

## 2026-06-16 작업 시작

- 범위: 식별된 8개 저품질 코드 항목과 같은 종류의 인접 문제를 순차적으로 개선한다.
- 원칙: 기존 공개 응답 형태는 유지하고, 실패 원인을 숨기던 경계에는 관찰 가능한 원인 정보를 남긴다.
- 검증: 각 항목마다 가장 가까운 테스트를 먼저 추가하거나 보강한 뒤 관련 패키지 테스트를 실행한다.

## Finding #1 완료: OpenAPI 클라이언트 네트워크 실패 관찰성

- `createOpenApiClient`가 `fetch` 예외를 무조건 `null`로 삼키지 않고 `reportNetworkError` 훅에 원인 예외와 요청 정보를 전달하도록 변경했다.
- 호출자에게 반환되는 `ApiResult` 형태는 기존과 동일하게 `network-error`를 유지했다.
- 검증: `bun --filter @workspace/web test src/lib/api/http/openapi-client.test.ts`
- 참고: 기존 `create-http-writing-app-api.test.ts`는 현재 Vite가 `@workspace/core/content`를 해석하지 못해 테스트 파일 로딩 단계에서 실패했다.
