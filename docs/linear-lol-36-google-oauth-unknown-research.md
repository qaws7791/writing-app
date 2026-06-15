# Linear LOL-36 Google OAuth 테스트 unknown 검토

## 2026-06-15 시작

- Linear 이슈: `LOL-36 google oauth unknown 파티`
- 조사 범위: `apps/api/src/routes/google-oauth.route.test.ts`, Google OAuth route, DB schema 타입
- 목표: 테스트 코드의 `unknown` 사용 지적이 현재 코드 기준으로 타당한지 판단한다.

## 관찰

- `apps/api/src/routes/google-oauth.route.test.ts`의 provider token 저장 방지 테스트는 `savedAccount: unknown`으로 DB insert 값을 캡처한다.
- 같은 fake DB에서 `insert(table: unknown)`와 `values(value: unknown)`도 사용한다.
- 테스트는 `db: db as never`로 `createGoogleOAuthRoute`에 fake DB를 주입한다. 이 때문에 `KwepDatabase`의 insert/value 타입 정보가 테스트 fake 내부로 전달되지 않는다.
- 실제 route는 `apps/api/src/routes/google-oauth.route.ts`의 `upsertGoogleUser`에서 `authAccounts` insert/update 값에 `accessToken`, `idToken`, `refreshToken`을 모두 `null`로 둔다.
- `authAccounts`는 Drizzle table이므로 테스트에서 `typeof authAccounts.$inferInsert` 같은 insert payload 타입을 직접 사용할 수 있다.
- `rg` 기준으로 `apps/api/src/routes`에서 `db as never`, `insert(table: unknown)`, `values(value: unknown)` 조합은 이 테스트 파일에만 있다.

## 판단

이슈는 타당하다.

현재 코드는 `bun --filter @workspace/api typecheck`를 통과하지만, 이는 테스트 fake가 타입 안정적이라는 뜻은 아니다. `savedAccount`가 `unknown`이라서 캡처한 row가 실제 `authAccounts` insert payload인지 타입 레벨에서 확인되지 않고, `expect(savedAccount).toMatchObject(...)`도 구조 검증을 런타임에만 맡긴다.

다만 문제 범위는 프로덕션 OAuth 동작이 아니라 테스트 코드의 타입 표현력이다. 실제 route의 provider token 미저장 동작은 현재 테스트가 런타임으로 검증하고 있으며, 이슈는 그 테스트가 DB insert 계약을 더 명확하게 드러내야 한다는 품질 개선으로 보는 것이 정확하다.

## 권장 조치

- `savedAccount`는 `typeof authAccounts.$inferInsert | null`처럼 실제 insert payload 타입으로 선언한다.
- fake DB의 캡처 경계도 가능하면 `unknown` 대신 좁은 타입 또는 작은 캡처 helper로 분리한다.
- `db as never`는 route 전체 fake를 위해 남길 수 있더라도, 캡처되는 값까지 `unknown`으로 두지는 않는다.
- 더 넓은 개선을 원하면 fake DB 대신 `createInMemoryKwepDatabase()`와 migration/seed helper를 사용하는 통합 테스트로 바꿀 수 있지만, 이 이슈의 최소 해결 범위는 테스트 캡처 타입 정리다.

## 검증

- `bun --filter @workspace/api typecheck`: 통과

## 결론

`LOL-36`은 타당한 코드 품질 이슈다. 현재 테스트는 동작 검증에는 충분하지만, `unknown`과 `db as never`가 함께 쓰여 타입 의도를 숨긴다. 작은 diff로 `authAccounts` insert payload 타입을 명시하면 테스트가 무엇을 캡처하고 검증하는지 더 분명해진다.

## 2026-06-15 완료

- `apps/api/src/routes/google-oauth.route.test.ts`의 provider token 저장 방지 테스트에서 `savedAccount`를 `typeof authAccounts.$inferInsert | null`로 좁혔다.
- fake DB의 `insert(table)` 인자는 Drizzle `AnySQLiteTable`로 표현하고, `values(value)` 인자는 `authAccounts` insert payload 타입으로 표현했다.
- `unknown`으로 캡처하던 값을 `saveAccount()` helper를 통해 명시적으로 저장하도록 바꿨다.
- `db as never`는 route 옵션의 전체 `KwepDatabase` surface를 fake로 구현하지 않기 위한 주입 경계로만 남겼다.

## 완료 검증

- `bun --filter @workspace/api test src/routes/google-oauth.route.test.ts`: 통과, 1 file / 4 tests
- `bun --filter @workspace/api typecheck`: 통과
