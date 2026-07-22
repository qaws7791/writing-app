# Workspace dependency와 품질 baseline 정책

## 공통 dependency catalog

둘 이상의 workspace가 사용하는 외부 dependency는 root `package.json`의 Bun catalog를 단일 출처로 사용한다. 한 workspace만 사용하는 dependency는 해당 workspace manifest가 exact version을 소유한다. catalog consumer는 dependency, devDependency 또는 peerDependency에서 개별 semver 대신 `catalog:`를 선언한다.

현재 exact version은 root manifest와 lockfile이 소유한다. 공통 version을 올릴 때는 root catalog 한 곳과 lockfile을 함께 변경하고 전체 테스트·빌드·audit를 실행한다. 서로 다른 version이 반드시 필요한 경우에는 호환성 근거, 영향 workspace, 제거 조건을 이 문서에 먼저 기록한 뒤 dependency drift 검사에 package 단위 예외를 추가한다.

`bun run check:workspace-dependency-versions`는 실제 consumer 수를 다시 계산해 공유 dependency의 exact catalog와 단일 consumer의 직접 version을 검사한다. 내부 package는 `workspace:*`를 사용하고 source가 import하는 runtime·test·build dependency를 해당 manifest에 직접 선언한다. Vitest test script를 가진 workspace는 transitive 실행 파일에 기대지 않고 devDependency를 직접 선언해야 한다.

## 디자인·lint ratchet

- 제품 lint는 warning도 실패로 처리한다. 로컬 root `lint`와 CI가 모두 Oxlint `--deny-warnings`를 사용한다.
- raw hex color baseline은 검증 source가 소유한다. 검출이 증가하면 실패하고, 감소해도 근거 없이 baseline을 낮추지 않는다.
- `apps/web/src/app/manifest.ts`는 CSS token을 참조할 수 없는 Web Manifest 정적 색상 필드만 포함하므로 제외한다.
- 미정의 `--semantic-color-*` 호환 별칭 baseline은 0이다. 앱과 패키지는 `--bg-*`, `--fg-*`, `--action-*`, `--success-*`, `--danger-*`, `--info-*` 공식 의미 토큰을 직접 참조한다.
- baseline이나 allowlist 변경에는 실제 검출 근거, owner, 제거 조건이 필요하다. 제품 소스 전체를 가리는 디렉터리 예외는 허용하지 않는다.

## 검증 명령

- `bun test scripts/check-design-system-guardrails.test.ts scripts/check-workspace-dependency-versions.test.ts`
- `bun run check:design-system-guardrails`
- `bun run check:workspace-dependency-versions`
- `bun install --frozen-lockfile`
- `bun pm ls --all`
- `bun run lint`
- `bun run test`
- `bun run build`
- `bun run audit:full`
