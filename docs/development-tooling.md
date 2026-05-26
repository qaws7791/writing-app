# 개발 도구

## 포맷팅

- 포맷팅에는 Prettier를 사용한다.
- Prettier 설정은 저장소 루트의 `.prettierrc.json` 하나만 유지한다.
- 모노레포 전체를 포맷하려면 저장소 루트에서 `bun run format`을 실행한다.
- 포맷 상태를 확인하려면 저장소 루트에서 `bun run format:check`를 실행한다.

## 린트

- 모노레포 전체 린트에는 ESLint를 사용한다.
- 모든 워크스페이스를 Turbo로 린트하려면 저장소 루트에서 `bun run lint`를 실행한다.
- 앱과 패키지의 린트 스크립트는 각 워크스페이스에 두고, 루트에서는 Turbo를 통해 실행한다.

## 타입 검사와 빌드

- 모든 워크스페이스를 타입 검사하려면 저장소 루트에서 `bun run typecheck`를 실행한다.
- 구성된 모든 워크스페이스를 빌드하려면 저장소 루트에서 `bun run build`를 실행한다.
- `apps/web`은 Turbo 검증 흐름에 맞춰 `dev`, `build`, `start`, `lint`, `typecheck` 스크립트를 제공한다.

## 앱 실행

- 모든 개발 서버를 실행하려면 저장소 루트에서 `bun run dev`를 실행한다.
- docs 앱만 실행하려면 저장소 루트에서 `bun run docs` 또는 `npm run docs`를 실행한다.
- docs 앱 실행 명령은 루트 `package.json`의 `docs` 스크립트이며 내부적으로 `bun --filter docs dev`를 실행한다.

## Git 훅

- 커밋 전 검증은 `bun lefthook run pre-commit`으로 실행할 수 있다.
- 훅이 파일을 수정하면 `git status --short`로 변경 사항을 확인하고, 관련 커밋에 포함한다.

## 런타임

- Bun은 루트 `packageManager` 필드에 선언된 `1.3.10`을 사용한다.
- Node.js는 루트 `engines` 필드에 선언된 `20.x`를 사용한다.
