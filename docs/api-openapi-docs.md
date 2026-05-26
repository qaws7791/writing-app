# API OpenAPI 문서 통합

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
