# 코스 상세 페이지

## 2026-05-25 시작

- `sonnet-to-react`의 코스 상세 프로토타입을 `apps/web`으로 옮긴다.
- 기존 공유 앱 shell을 유지하고 `/courses/[id]` route를 추가한다.
- 홈과 코스 목록에서 연결되는 모든 코스 ID에 수동 작성 상세 데이터를 제공한다.
- 프로토타입 전용 CSS token 대신 `@workspace/ui` primitive와 semantic Tailwind token을 사용한다.
- 검증 대상은 web typecheck, web lint, web build, root formatting check, `git diff --check`, 가능한 경우 로컬 브라우저 smoke check다.

## 2026-05-25 완료

- 홈과 코스 목록에서 연결되는 11개 코스 ID 전체에 static params 기반 `/courses/[id]`를 추가했다.
- 진행 중 코스의 레슨 수와 진행률에 맞는 수동 작성 코스 상세 데이터를 추가했다.
- 프로토타입 상세 레이아웃을 `@workspace/ui` primitive, semantic Tailwind token, `next/image`, 클라이언트 접기/펼치기 커리큘럼으로 이식했다.
- 알 수 없는 코스 ID를 위한 route-level not-found UI를 추가했다.
- 검증 통과: `bun --filter @workspace/web typecheck`, `bun --filter @workspace/web lint`, `bun --filter @workspace/web build`, `bun run format:check`, `git diff --check`.
- 당시 추가 monorepo check에서 `bun run typecheck`는 통과했고, `bun run lint`는 기존 `apps/docs/out` 생성 파일 때문에 실패했다. 2026-05-31 docs 앱 제거 이후 해당 생성 경로는 더 이상 운영하지 않는다.
- 임시 개발 서버 브라우저 smoke check에서 `/courses` 200, `/courses/reading-comprehension` 200, `/courses/basic-sentence-writing` 200, `/courses/not-real` 404를 확인했다.
