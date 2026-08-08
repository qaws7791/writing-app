---
name: implement-ui
description: writing-app의 새 UI 구현과 기존 UI 수정을 토큰, 공용 컴포넌트, shadcn·ReUI·Base UI, Astro UI 문서 계약에 맞춰 수행한다. React/Next.js 화면·컴포넌트·스타일을 추가하거나 시각 상태, variant, 상호작용을 변경할 때 사용한다.
---

# UI 구현

아래 순서를 지킨다. 단계를 건너뛰면 최종 보고에 이유를 남긴다.

## 1. 계약 확인

1. `docs/_index.md`, `docs/authority-map.md`를 먼저 읽는다.
2. 관련 화면 문서와 `docs/design/foundations.md`, `components.md`, `accessibility.md`, `ui-documentation.md`, `docs/engineering/frontend-development.md`를 읽는다.
3. 대상 경로의 `AGENTS.md`와 실제 코드·설정을 확인한다.
4. 사용자 행동, 반응형 범위와 적용 가능한 default·loading·empty·error·disabled 상태를 관찰 가능한 인수 기준으로 정한다.
5. 수정 전에 각 인수 기준을 `기준 | 권위 소스 | 현재 코드 | 차이 | 처리` 형식으로 짧게 대조한다. 별도 문서 파일은 만들지 않는다.
6. 문서의 정책이 현재 코드에 구현되지 않았으면 충족으로 간주하지 말고 차이로 기록한다.
7. 요청한 UI 추가 자체가 차이라면 구현 계획으로 처리한다. 그 밖의 정책 값, 동작, 소유 경계가 다르거나 요청 범위 밖 변경이 필요하면 수정하지 말고 사용자에게 확인한다.
8. 모든 차이가 처리되기 전에는 구현을 시작하지 않는다.

## 2. 소유 위치 결정

- 라우팅, 조회, 앱 상태나 도메인 정책을 포함하면 해당 앱 feature에 둔다.
- 도메인 비의존적이고 기존 primitive의 확장이거나 실제 복수 소비자가 있을 때만 `packages/shared/ui`에 둔다.
- 가상의 재사용을 위해 공용 컴포넌트를 만들지 않는다.
- 공용 UI에 앱·API·라우팅·비즈니스 규칙을 넣지 않는다.

## 3. 토큰 결정

1. `packages/shared/ui/src/styles/globals.css`와 이 파일이 import하는 `tokens/`를 확인한다.
2. 기존 semantic 또는 component token 조합을 우선한다.
3. 새 의미 역할이나 여러 소비자가 공유할 값만 새 토큰으로 만든다.
4. 새 토큰은 구현 전에 `docs/design/foundations.md`에 정의하고, 소유 token 파일에 라이트·다크·대비·motion 영향을 반영한다.
5. raw color 값은 reference 또는 semantic token 정의 밖에 추가하지 않는다.

## 4. 컴포넌트 선택

다음 순서에서 모든 채택 조건을 통과한 첫 후보를 사용한다.

1. `packages/shared/ui`의 파일, export map과 Astro UI 문서를 검색한다.
2. 기존 primitive의 조합으로 해결한다.
3. shadcn 공식 registry를 `search`와 `view`로 확인하고 `add --dry-run` 또는 `--diff`로 변경을 검토한다.
4. 적합한 shadcn 항목이 없을 때만 ReUI를 확인한다. Base UI 기반 무료 항목을 우선하며 유료 항목이나 자격 증명이 필요하면 사용자에게 확인한다.
5. registry 후보가 모두 탈락하면 단순 요소는 native HTML, 복합 상호작용은 `@base-ui/react`로 구현한다.

채택 조건:

- 요구한 행동과 상태를 충족한다.
- semantic HTML, 키보드, 포커스와 접근 가능한 이름을 제공한다.
- native 또는 Base UI 기반이며 병렬 headless 체계를 추가하지 않는다.
- 저장소 토큰과 import 경계로 무리 없이 이식할 수 있다.
- 공용 패키지에 앱·도메인 의존성을 만들지 않는다.
- 라이선스가 명확하고 불필요한 의존성·코드를 추가하지 않는다.

registry 코드를 바로 덮어쓰지 않는다. 생성 결과를 검토한 뒤 `#ui/*`, 공개 export와 로컬 토큰 규칙에 맞게 최소 이식한다. `--overwrite`를 사용하지 않는다. 새 package가 필요하면 `manage-dependencies` 절차를 함께 적용한다.

## 5. 구현과 동기화

- 가장 작은 변경으로 구현하고 기존 public API를 불필요하게 깨뜨리지 않는다.
- 공용 컴포넌트를 추가하면 `packages/shared/ui/package.json`의 좁은 export를 추가한다.
- token 또는 공용 컴포넌트 계약이 바뀌면 같은 변경에서 관련 디자인 문서를 갱신한다.
- 사용자 노출 문구와 접근성 문구는 한국어로 작성한다.

Astro UI 문서는 다음 조건으로 갱신한다.

- public component 추가 또는 상태·variant·상호작용 변경: 관련 component 예제와 browser interaction contract 갱신
- token 변경: 관련 Foundation 문서와 격리 예제 갱신
- 앱 로컬 UI 또는 관찰 가능한 변화가 없는 내부 수정: Astro UI 문서 변경 생략

예제에는 적용 가능한 주요 상태, 키보드 동작과 접근성 검증만 포함한다. 정적 마크업이나 구현 세부사항을 위한 테스트는 추가하지 않는다.

## 6. 검증

1. 각 인수 기준을 변경 위치와 검증 증거에 연결한다. 증거가 없는 기준은 완료로 보고하지 않는다.
2. 변경한 UI를 실제 앱 또는 Astro UI 문서의 격리 미리보기에서 확인한다.
3. 적용 가능한 모바일·데스크톱, 라이트·다크, 키보드 포커스와 reduced motion을 확인한다.
4. 관련 workspace의 lint, typecheck와 필요한 테스트를 실행한다.
5. Astro UI 문서를 갱신했으면 다음을 실행한다.

```bash
bun --filter @workspace/ui-registry docs:validate
bun --filter @workspace/ui-registry test:browser
bun --filter @workspace/ui-registry build
```

6. 저장소 완료 기준에 따라 다음을 실행한다.

```bash
bun lint
bun typecheck
bun build
bun lefthook run pre-commit
```

실패를 우회하지 말고 원인을 수정한다. 시작한 서버와 감시 프로세스를 종료한 뒤 사전 대조에서 발견한 차이와 처리, 변경, 선택 근거와 검증 결과를 보고한다.
