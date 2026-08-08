# ADR-0002: 공유 UI 디자인 시스템 계약

## 상태

채택됨. 실행 가능한 UI 카탈로그와 browser 검증 결정은 ADR-0029가 대체한다.

## 날짜

2026-06-25

## 맥락

학습자 앱과 어드민 앱은 같은 제품 시각 언어를 사용하지만 구현은 세 곳에 나뉘어 있다.

- `packages/ui`는 색상 변수와 소수 primitive만 제공한다.
- `apps/web`은 Tailwind utility와 inline style로 학습 화면을 구성한다.
- `apps/admin/src/app/globals.css`는 패널, 툴바, 테이블, 상태, dialog를 직접 구현한다.

이 구조는 색상 의미 충돌, 정적 typography 중복, 수동 접근성 구현, class/style assertion 테스트 결합을 만든다. 디자인 시스템 이관은 여러 앱과 패키지에 걸친 결정이므로 공용화 범위와 naming을 ADR로 고정한다.

## 결정

- `packages/ui`는 도메인 비의존 UI 계약만 소유한다.
- 공통 파운데이션은 하나로 유지하고, 앱별 차이는 root의 `data-density`로 표현한다.
- web 기본 밀도는 `comfortable`, admin 기본 밀도는 `compact`다.
- 색상 이름은 `primary`, `muted`, `destructive`처럼 모호한 이름보다 `action-primary`, `action-selected`, `fg-muted`, `danger-fg`처럼 역할이 드러나는 의미 토큰을 우선한다.
- 기존 `cream`, `surface`, `charcoal`, `primary`, `destructive` 이름은 이관 중 호환 alias로 유지한다.
- Button의 기존 `default` variant는 migration alias로 유지하고, 새 문서와 story는 `solid` 또는 `primary` 같은 명확한 이름을 사용한다.
- Base UI 기반 overlay, menu, disclosure, segmented selection은 앱에서 직접 다시 구현하지 않는다.
- 비즈니스 로직·라우팅·데이터 조회가 섞인 feature module(`CourseCard` 조립체, `AdminCourseTable` 등)은 공용 UI API로 올리지 않는다. 순수 도메인 프레젠테이션은 ADR-0003에 따라 `components/<domain>`에 둘 수 있다.

## 고려한 대안

### 대안 1. web과 admin을 별도 theme로 분리

- 장점: 각 앱의 현재 모습을 빠르게 보존할 수 있다.
- 단점: 색상, 접근성, 상태 표현이 계속 분기되고 공용 컴포넌트 leverage가 낮아진다.

### 대안 2. 모든 feature component를 `packages/ui`로 이동

- 장점: 앱 화면 코드가 짧아진다.
- 단점: 도메인 로직과 라우팅 정책이 UI package로 새어 들어가고 package 책임이 불명확해진다.

### 대안 3. 공용 파운데이션과 도메인 비의존 primitive만 중앙화

- 장점: 앱의 도메인 조립은 유지하면서 접근성, 토큰, 상태 표현을 한 곳에서 검증할 수 있다.
- 단점: migration 기간 동안 호환 alias와 중복 구현을 함께 관리해야 한다.

## 선택 근거

대안 3은 현재 제품의 위험을 가장 작게 나눈다. `packages/ui`가 깊은 module로 동작하려면 작은 interface 뒤에 토큰, 접근성, 상태 표현 implementation을 집중해야 한다. 도메인 화면 전체를 옮기면 interface가 커지고 locality가 낮아진다.

또한 density를 theme가 아니라 root attribute로 두면 색상 의미를 분리하지 않고도 web과 admin의 사용 맥락을 표현할 수 있다.

## 결과

- PR 템플릿은 디자인 시스템 변경 체크리스트를 포함한다.
- `packages/ui` token은 호환 alias를 유지한 채 reference, semantic, component token으로 재편한다.
- 앱 migration은 pilot 화면 단위로 진행하고 전체 admin CSS를 한 번에 삭제하지 않는다.
- 접근성 primitive는 실행 가능한 문서 예제와 browser interaction test를 추가한 뒤 앱에 적용한다.
- Tailwind import, plugin과 source scan 설정은 web, admin, Astro UI 문서 앱의 Adapter가 각각 소유한다.
- `packages/ui`는 Tailwind build engine 설정을 공개하지 않고 token, 공통 utility, 도메인 비의존 style Implementation만 제공한다.
- 각 앱은 `source(none)`과 명시적 `@source`로 자신의 소스와 `packages/ui/src`만 scan하며, CSS에서 해석하는 plugin을 직접 의존성으로 선언한다.

## 검증

초기 ADR 작성 시점에는 문서와 기준만 추가한다. 이후 각 Phase에서 다음 검증을 점진적으로 연결한다.

```bash
bun --filter @workspace/ui test
bun --filter @workspace/ui typecheck
bun --filter @workspace/ui-registry build
bun run lint
```

## 관련 문서

- `docs/design/foundations.md`
- `docs/design/components.md`
- `docs/design/accessibility.md`
- `docs/engineering/adr/ADR-0029-astro-ui-documentation.md`
- `packages/ui/README.md`
