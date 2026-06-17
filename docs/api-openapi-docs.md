# API OpenAPI 문서 통합

## 2026-06-18 시작

- `apps/api` 라우트 정의를 `@hono/zod-openapi` 기반의 선언형 `createRoute` 헬퍼로 전환한다.
- 하나의 라우트 파일은 하나의 API 엔드포인트만 정의하고, OpenAPI 스펙과 핸들러를 같은 파일에 둔다.
- 수동 OpenAPI 문서 빌더를 제거하고 실제 Hono 앱에 등록된 라우트에서 OpenAPI JSON을 생성한다.

## 2026-06-18 완료

- `apps/api/src/lib/hono.ts`에 `OpenAPIHono` 기반 `createRoute` 헬퍼를 추가했다.
- API 엔드포인트 파일은 하나의 파일이 하나의 route spec과 handler를 함께 가지도록 분리했다.
- `/openapi`와 `openapi:generate`는 수동 문서 빌더가 아니라 실제 앱의 `getOpenAPI31Document()` 결과를 사용한다.
- `docs/openapi/writing-app-api.json`와 웹 API generated 타입을 새 라우트 registry 기준으로 갱신했다.

## 2026-05-31 docs 앱 제거 완료

- 별도 `apps/docs` Fumadocs 앱과 API 레퍼런스 MDX 생성 경로를 제거했다.
- `apps/api`의 `openapi:generate`는 정적 계약 파일을 `docs/openapi/writing-app-api.json`에 생성한다.
- `apps/web`의 `api:generate`는 이 JSON 파일을 읽어 `apps/web/src/lib/api/generated/writing-app-api.d.ts`를 갱신한다.
- 공개 API 문서 사이트는 운영하지 않는다. 현재 기준의 문서 확인은 저장소의 Markdown 문서와 API 런타임의 `/openapi.json`으로 충분하다.
- 아래 2026-05-26 기록은 별도 docs 앱이 존재하던 시점의 이력이며, 현재 실행 경로가 아니다.

## 2026-05-26 시작

- `apps/api`가 OpenAPI JSON 파일을 생성하고, `apps/docs`가 이 파일을 읽어 Fumadocs API 문서로 생성하는 파이프라인을 구축한다.
- docs 앱은 현재 정적 export 구조를 유지하므로 실행 중인 API 서버를 fetch하지 않는다.
- OpenAPI 입력 파일은 docs 앱 내부에 저장해 빌드와 리뷰에서 재현 가능한 산출물로 관리한다.
- 문서 생성에는 `fumadocs-openapi`를 사용한다.
- 범위 제외: API 클라이언트 SDK 생성, 별도 Swagger UI/Scalar 런타임 콘솔, API 계약 변경, `/prototype` 변경.

## 2026-05-26 완료

- `apps/api`에 OpenAPI JSON 파일 생성 스크립트를 추가했다.
- 생성 파일은 `apps/docs/openapi/writing-app-api.json`에 저장된다.
- `apps/docs`는 `fumadocs-openapi`로 `apps/docs/content/docs/api` 문서를 생성한다.
- docs OpenAPI 생성 스크립트는 생성된 MDX/JSON을 Prettier로 정리해 빌드 이후 작업 트리가 불필요하게 변경되지 않게 한다.
- docs 앱은 생성된 OpenAPI MDX의 `APIPage` 컴포넌트를 렌더링하며 정적 export 구조를 유지한다.
- `apps/docs` Fumadocs collection은 async 로딩으로 전환해 OpenAPI MDX가 포함된 server collection을 안정적으로 생성한다.
- 검증 통과:
  - `bun --filter @workspace/api test`
  - `bun --filter @workspace/api typecheck`
  - `bun --filter @workspace/api lint`
  - `bun --filter docs types:check`
  - `bun --filter docs lint`
  - `bun --filter docs build`
  - `bun run test`
  - `bun run lint`
  - `git diff --check`
- `bun run typecheck`는 기존 `@workspace/ui`의 `packages/ui/src/lib/utils.ts` `clsx` 모듈 타입 해석 실패로 종료 코드 2를 반환했다. 이번 작업은 `packages/ui`를 변경하지 않았다.
