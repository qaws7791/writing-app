# 개발 도구

## 2026-05-31 docs 앱 제거 완료

- 루트 `docs` 스크립트와 `apps/docs` 워크스페이스를 제거했다.
- OpenAPI 정적 JSON은 문서 앱 입력 파일이 아니라 `docs/openapi/writing-app-api.json` 산출물로 관리한다.
- 별도 문서 개발 서버는 운영하지 않고, 프로젝트 문서는 저장소의 Markdown 파일을 기준으로 확인한다.

## 2026-05-31 BSSN 썸네일 스토리지 제거 시작

- 코스 썸네일 업로드 제거에 맞춰 로컬 개발 도구 요구사항에서 Docker Compose와 RustFS를 제거한다.
- README와 운영 환경 문서는 Bun, 앱별 `.env`, SQLite seed만으로 시작하는 흐름을 기준으로 갱신한다.

## 2026-05-31 BSSN 썸네일 스토리지 제거 완료

- 루트 Docker Compose 파일, RustFS 버킷 초기화 스크립트, `.env.docker.example`을 제거했다.
- 로컬 시작 절차는 Docker 없이 `bun install`, 앱별 `.env`, `bun run dev:admin:setup`, `bun run dev:admin`으로 정리했다.

## 2026-05-31 웹 runtime fake 개발 경로 제거 완료

- `apps/web/package.json`에서 `dev:fake` 스크립트를 제거했다.
- 웹 앱 개발 실행은 `bun run dev:app` 기준으로 실제 API와 함께 실행한다.
- fake 어댑터는 제품 실행 모드가 아니라 테스트에서 명시적으로 주입하는 용도로만 유지한다.

## 2026-05-30 웹 fake 개발 서버 스크립트 추가 시작

- `apps/web`을 백엔드 없이 fake API 모드로 실행하는 개발 스크립트를 추가한다.
- 스크립트는 서버와 브라우저 API 모드를 모두 fake로 명시해 실행 의도를 package.json에서 바로 확인할 수 있게 한다.
- 변경 후 개발 서버 기동과 웹 페이지 응답을 확인한다.

## 2026-05-30 웹 fake 개발 서버 스크립트 추가 완료

- `apps/web/package.json`에 `dev:fake` 스크립트를 추가했다.
- `dev:fake`는 `WEB_API_MODE=fake`, `NEXT_PUBLIC_API_MODE=fake`를 명시하고 `next dev`를 실행한다.
- 로컬 검증에서 `bun run dev:fake -- --port 3100`으로 개발 서버를 띄우고 `/` 요청이 `200`을 반환하는지 확인했다.
- 2026-05-31 BSSN 3순위 작업에서 이 스크립트는 제거되었다.

## 2026-05-30 README 로컬 시작 가이드 갱신 시작

- 클론 직후 필요한 도구, 환경 변수 파일 생성, Docker Compose 기반 RustFS 실행, DB seed, 관리자 계정 seed, 개발 서버 실행 순서를 README에 정리한다.
- README는 현재 모노레포 구조를 기준으로 한국어로 작성하고, 상세 운영 값은 `docs/operations-environment.md`로 연결한다.

## 2026-05-30 README 로컬 시작 가이드 갱신 완료

- README를 현재 학습자/어드민/문서/Storybook 모노레포 구조에 맞게 다시 작성했다.
- Node.js, Bun, Docker Desktop, Git 요구사항과 clone 이후 `bun install`, env 파일 생성, RustFS 실행, seed, dev server 실행 순서를 문서화했다.
- 어드민 로컬 계정 비밀번호 재동기화가 필요한 경우의 PowerShell 명령을 함께 기록했다.

## 포맷팅

- 포맷팅에는 Prettier를 사용한다.
- Prettier 설정은 저장소 루트의 `.prettierrc.json` 하나만 유지한다.
- 포맷 대상 제외 정책은 저장소 루트의 `.prettierignore`에서 관리한다.
- 모노레포 전체를 포맷하려면 저장소 루트에서 `bun run format`을 실행한다.
- 포맷 상태를 확인하려면 저장소 루트에서 `bun run format:check`를 실행한다.

## 2026-05-28 Prettier 명령 정리 시작

- 루트 `package.json`의 `format`, `format:check` 스크립트가 포맷 대상 glob과 ignore 경로를 직접 나열해 읽기 어렵다.
- 포맷 제외 정책은 `.prettierignore`로 옮기고, 스크립트는 `prettier --write .`, `prettier --check .`로 단순화한다.
- `prototype/`, agent 작업 공간, 빌드 산출물, 로컬 DB, credentials는 포맷 대상에서 제외한다.

## 2026-05-28 Prettier 명령 정리 완료

- 루트 `.prettierignore`를 추가해 포맷 제외 정책을 한 곳에서 관리한다.
- 루트 `format`은 `prettier --write .`, `format:check`는 `prettier --check .`로 단순화했다.
- `prototype/`, `.agent`, `.agents`, `.worktrees/`, `.vscode/`, 빌드 산출물, 로컬 데이터, credentials는 포맷 대상에서 제외한다.

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
- 별도 docs 앱은 운영하지 않는다. 문서는 저장소의 Markdown 파일과 API 런타임의 `/openapi.json`을 기준으로 확인한다.

## Git 훅

- 커밋 전 검증은 `bun lefthook run pre-commit`으로 실행할 수 있다.
- 훅이 파일을 수정하면 `git status --short`로 변경 사항을 확인하고, 관련 커밋에 포함한다.

## 런타임

- Bun은 루트 `packageManager` 필드에 선언된 `1.3.10`을 사용한다.
- Node.js는 루트 `engines` 필드에 선언된 `24.x`를 사용한다.
