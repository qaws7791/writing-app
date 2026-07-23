# Workspace dependency와 품질 baseline 정책

## 공통 dependency catalog

둘 이상의 workspace가 사용하는 외부 dependency는 root `package.json`의 Bun catalog를 단일 출처로 사용한다. 한 workspace만 사용하는 dependency는 해당 workspace manifest가 exact version을 소유한다. catalog consumer는 dependency, devDependency 또는 peerDependency에서 개별 semver 대신 `catalog:`를 선언한다.

현재 exact version은 root manifest와 lockfile이 소유한다. 공통 version을 올릴 때는 root catalog 한 곳과 lockfile을 함께 변경하고 전체 테스트·빌드·audit를 실행한다. 서로 다른 version이 반드시 필요한 경우에는 호환성 근거, 영향 workspace, 제거 조건을 이 문서에 먼저 기록한 뒤 dependency drift 검사에 package 단위 예외를 추가한다.

dependency audit는 HIGH 이상을 예외 없이 차단하는 상태를 기본으로 한다. 수정 버전이 없어 예외가 불가피하다면 advisory와 package, 실제 도달 경로, 완화 근거, owner, 만료일과 제거 조건을 실행 가능한 정책 source에 먼저 기록해야 하며 명령문에 `--ignore`를 직접 추가하지 않는다.

`bun run check:workspace-dependency-versions`는 실제 consumer 수를 다시 계산해 공유 dependency의 exact catalog와 단일 consumer의 직접 version을 검사한다. 내부 package는 `workspace:*`를 사용하고 source가 import하는 runtime·test·build dependency를 해당 manifest에 직접 선언한다. Vitest test script를 가진 workspace는 transitive 실행 파일에 기대지 않고 devDependency를 직접 선언해야 한다.

## 디자인·lint ratchet

- 제품 lint는 warning도 실패로 처리한다. 로컬 root `lint`와 CI가 모두 Oxlint `--deny-warnings`를 사용한다.
- raw hex color baseline은 검증 source가 소유한다. 검출이 증가하면 실패하고, 감소해도 근거 없이 baseline을 낮추지 않는다.
- `apps/web/src/app/manifest.ts`는 CSS token을 참조할 수 없는 Web Manifest 정적 색상 필드만 포함하므로 제외한다.
- 미정의 `--semantic-color-*` 호환 별칭 baseline은 0이다. 앱과 패키지는 `--bg-*`, `--fg-*`, `--action-*`, `--success-*`, `--danger-*`, `--info-*` 공식 의미 토큰을 직접 참조한다.
- baseline이나 allowlist 변경에는 실제 검출 근거, owner, 제거 조건이 필요하다. 제품 소스 전체를 가리는 디렉터리 예외는 허용하지 않는다.

## 검증

현재 task 이름과 실행 대상은 root manifest와 CI workflow가 소유한다. dependency 변경은 다음 범주의 root gate를 함께 통과해야 한다.

- workspace inventory·version 정책과 design-system ratchet
- frozen install, lockfile 불변성과 전체 dependency tree 확인
- lint, test, build와 전체 dependency audit

문서에 task 목록을 복제하지 않고 [사실별 권위 지도](../authority-map.md)를 통해 현재 실행 진입점을 확인한다.
