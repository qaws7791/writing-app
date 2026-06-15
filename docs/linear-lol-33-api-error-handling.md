# Linear LOL-33 API 예외 처리 경계 검토

## 2026-06-15 시작

- Linear 이슈: `LOL-33 예외 처리(Error Handling) 미흡`
- 조사 범위: `apps/api/src/app.ts`, 학습 API route, core 서비스의 Zod parse 예외
- 목표: route 내부에서 `ZodError`가 발생해도 Hono 기본 오류 응답이나 예외 전파가 아니라 JSON 오류 응답으로 변환한다.

## 판단

이슈는 타당하다.

- `createApp`에는 전역 예외 처리기가 없었다.
- core 서비스는 `zod.parse()`를 사용하는 경로가 있어 잘못된 내부 데이터나 command가 들어오면 `ZodError`를 던질 수 있다.
- mounted route 내부 예외는 단순 parent `app.onError()`만으로 테스트 환경에서 잡히지 않았으므로, 전역 middleware에서 `next()`를 감싸는 처리가 필요했다.

## 2026-06-15 완료

- API 앱에 공통 `handleAppError`를 추가했다.
- `ZodError`는 `invalid_request` JSON과 HTTP 400으로 변환한다.
- 그 외 예외는 `internal_server_error` JSON과 HTTP 500으로 변환한다.
- mounted route 예외까지 잡기 위해 `app.onError()`와 전역 try/catch middleware를 함께 적용했다.
- 학습 답변 저장 route에서 서비스가 `ZodError`를 던지는 회귀 테스트를 추가했다.

## 검증

- `bun --filter @workspace/api test src/app.test.ts`
- `bun --filter @workspace/api typecheck`
