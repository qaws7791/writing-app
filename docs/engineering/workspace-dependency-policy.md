# Workspace dependency와 품질 baseline 정책

## 상태

완료했다.

## 공통 dependency catalog

여러 workspace가 공유하는 React, Recharts, Vitest, Tailwind PostCSS family는 root `package.json`의 Bun catalog를 단일 출처로 사용한다. workspace manifest의 dependency, devDependency, peerDependency는 개별 semver 대신 `catalog:`를 선언한다.

현재 exact version은 다음과 같다.

- React와 React DOM: `19.2.4`
- Recharts: `3.9.2`
- Vitest: `4.1.10`
- `@tailwindcss/postcss`: `4.1.18`

공통 version을 올릴 때는 root catalog 한 곳과 lockfile을 함께 변경하고 전체 테스트·빌드·audit를 실행한다. 서로 다른 version이 반드시 필요한 경우에는 호환성 근거, 영향 workspace, 제거 조건을 이 문서에 먼저 기록한 뒤 dependency drift 검사에 package 단위 예외를 추가한다. 현재 예외는 없다.

`bun run check:workspace-dependency-versions`는 catalog가 exact version인지, 모든 workspace가 `catalog:`를 사용하는지 검사한다. 의도적인 개별 version drift fixture는 root tooling test가 고정한다.

## 디자인·lint ratchet

- 제품 lint는 warning도 실패로 처리한다. 로컬 root `lint`와 CI가 모두 Oxlint `--deny-warnings`를 사용한다.
- raw hex color baseline은 현재 검출값인 32다. 검출이 증가하면 실패하고, 감소해도 baseline을 같은 변경에서 낮추지 않으면 실패한다.
- `apps/admin/src/features/step-debug`는 legacy debug fixture라 raw hex 검사에서 제외한다.
- `apps/web/src/app/manifest.ts`는 CSS token을 참조할 수 없는 Web Manifest 정적 색상 필드만 포함하므로 제외한다.
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
