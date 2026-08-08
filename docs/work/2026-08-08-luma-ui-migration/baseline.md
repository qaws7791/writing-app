# Luma UI 전환 기준선

## 기준

- 기록 시각: 2026-08-08 KST
- 애플리케이션 commit: `232a14e1a6b890bdacd60709f55a3b5a8c441c9a`
- 대상 UI commit: `010ddc4421d0d2875c858f3cec69a4a93dbf2f28`

[`ui/package.json`](../../../ui/package.json)은 private 문서 애플리케이션을 정의한다.

대상 UI는 package export를 제공하지 않는다.

전환은 [`registry/base/registry.json`](../../../ui/registry/base/registry.json)과 선택한 registry item의 source를 공유 UI에 vendoring하는 방식으로 수행한다.

## 소비 기준선

| 항목                              | 기준선 |
| --------------------------------- | -----: |
| `@workspace/ui` 소비 파일         |    104 |
| 학습자 앱 소비 파일               |     39 |
| 관리자 앱 소비 파일               |     26 |
| Storybook 소비 파일               |     39 |
| 공유 UI 비테스트 컴포넌트 파일    |     43 |
| legacy style 소비 파일            |     91 |
| `lucide-react` source import 파일 |     22 |
| 공유 UI source alias를 선언한 앱  |      3 |

소비 파일 수는 테스트와 생성 산출물을 제외한 source 검색 결과이다.

## 초기 source allowlist

| 변경 단위      | 대상 source                                                                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 디자인 기반    | `registry/base/registry.json`의 token, radius, elevation, motion과 base style                                                                                                                                                   |
| 정적 primitive | `lib/utils.ts`, `ui/button.tsx`, `ui/field.tsx`, `ui/input.tsx`, `ui/textarea.tsx`, `ui/label.tsx`, `ui/card.tsx`, `ui/badge.tsx`, `ui/separator.tsx`                                                                           |
| 학습 기반      | `ui/lesson.tsx`, `ui/step.tsx`, `ui/insight.tsx`, `ui/prose.tsx`, `ui/compare.tsx`, `ui/choice.tsx`, `ui/token.tsx`, `ui/segment.tsx`, `ui/sortable.tsx`, `ui/pair.tsx`, `ui/classify.tsx`, `ui/compose.tsx`, `ui/coaching.tsx` |

예제 block, Astro 앱, registry CLI, preview fixture와 문서 사이트 utility는 allowlist에 포함하지 않는다.

## dependency 판정

첫 디자인 기반과 정적 primitive 변경 단위는 현재 dependency만 사용한다.

`@hugeicons/react`와 `@hugeicons/core-free-icons`는 MIT로 게시되어 있다.

`@hugeicons/core-free-icons`의 게시 artifact는 압축 해제 기준 약 83 MB이다.

Hugeicons 도입은 직접 icon import와 route bundle 측정을 포함하는 별도 변경 단위에서 수행한다.

`@dnd-kit/react`와 `@dnd-kit/dom`은 `Sortable`을 이전하는 변경 단위까지 도입을 보류한다.

`shadcn`, Astro와 registry 문서 도구는 애플리케이션 dependency graph에 추가하지 않는다.

## audit 기준선

`bun audit --cwd ui`는 대상 문서 도구 graph에서 취약점 5건을 보고했다.

- `nanoid`: 고위험 1건
- `hono`: 중간 위험 3건과 낮은 위험 1건

취약 package는 Astro, Vite, shadcn CLI와 MCP 경로에 있다.

해당 도구 graph를 복사하면 알려진 취약 package가 애플리케이션에 들어올 수 있다.

선택한 runtime dependency만 workspace manifest에 추가해야 한다.

Root `audit:production`과 `audit:full`은 기존 `GHSA-f88m-g3jw-g9cj` 예외가 2026-08-06에 만료되어 실패했다.

이 기존 실패는 UI 변경 결과와 분리해서 보고해야 한다.

## build와 route bundle 기준선

Root build는 Next.js compile과 typecheck를 통과한 뒤 관리자 standalone symlink 생성에서 `EPERM`으로 실패했다.

Windows symlink 권한 부족은 코드 변경으로 우회하지 않는다.

생성된 production route 산출물의 bundle 검사는 통과했다.

| 앱     | route         | 초기 chunk | gzip bytes |
| ------ | ------------- | ---------: | ---------: |
| 관리자 | `/`           |          9 |     65,577 |
| 관리자 | `/analytics`  |         11 |     74,151 |
| 학습자 | `/`           |          7 |     58,078 |
| 학습자 | `/app`        |         11 |    132,887 |
| 학습자 | `/app/lesson` |         12 |    225,647 |

관리자 초기 chunk에는 Recharts가 없다.

학습자 landing 초기 chunk에는 landing Client Component가 없다.

## 1단계 검증 결과

Luma token, theme와 Foundation story의 변경 파일 포맷 검사는 통과했다.

공유 UI lint와 typecheck는 통과했다.

Storybook의 34개 story 파일과 57개 검사는 통과했다.

Storybook production build는 통과했다.

밝은 테마, 어두운 테마, 타이포그래피와 reduced motion의 수동 Storybook 검증은 통과했다.

브라우저 console의 error와 warning은 0건이었다.

Workspace test는 192개 파일에서 1,083개 테스트가 통과했다. Root test는 기존 audit 예외 만료 검사가 1건 실패했다.

Next.js 앱 2개는 production compile, typecheck와 정적 페이지 생성을 통과했다. 두 앱은 standalone symlink 생성에서 `EPERM`으로 실패했다.

PR E2E는 7개 중 6개가 통과했다. 관리자 코스 발행 시나리오는 UI 동작 전에 `e2e/admin-content-fixture.ts`의 허용되지 않는 `category: "E2E"` 값으로 실패했다.

Route bundle 검사는 기준선과 같은 수치로 통과했다.

Root format 검사는 중첩 참조 저장소인 `ui/`의 192개 파일을 검사해서 실패했다. 애플리케이션 변경 파일 29개의 별도 format 검사는 통과했다.

## 2-A단계 검증 결과

정적 primitive 9개와 `cn` utility를 Luma source로 전환했다.

Button, Card와 Badge의 legacy 공개 API 소비자는 0개다.

공유 UI, Storybook, 학습자 앱과 관리자 앱의 lint와 typecheck는 통과했다.

공유 UI는 6개 파일에서 20개 테스트가 통과했다.

Storybook은 34개 파일에서 57개 테스트가 통과했다.

학습자 앱은 32개 파일에서 136개 테스트가 통과했다.

관리자 앱은 34개 파일에서 151개 테스트가 통과했다.

Storybook production build와 밝은 테마 및 어두운 테마의 수동 검증은 통과했다.

Route bundle 검사는 모든 예산을 통과했다.

## 2-B단계 검증 결과

Dialog, AlertDialog, DropdownMenu, Select, Tabs, Accordion과 Popover를 Luma source로 전환했다.

모든 Select 소비자는 `items`를 전달한다.

SelectTrigger의 legacy `variant` 소비자는 0개다.

공유 UI, Storybook, 학습자 앱과 관리자 앱의 lint와 typecheck는 통과했다.

공유 UI는 6개 파일에서 20개 테스트가 통과했다.

Storybook은 36개 파일에서 59개 테스트가 통과했다.

학습자 앱은 32개 파일에서 136개 테스트가 통과했다.

관리자 앱은 34개 파일에서 151개 테스트가 통과했다.

Storybook production build는 통과했다.

Storybook 접근성 검사는 Tabs의 72% 투명도에서 2.99:1 대비를 발견했다.

Tabs는 전체 `muted-foreground` 색상을 사용하도록 수정했다.

Dialog, Popover, Select와 Tabs의 밝은 테마 및 어두운 테마 수동 검증은 통과했다.

Next.js 앱 2개는 production compile, typecheck와 정적 페이지 생성을 통과했다.

두 앱은 기존 standalone symlink `EPERM`에서 실패했다.

Route bundle 검사는 모든 예산을 통과했다.

| 앱     | route         | 초기 chunk | gzip bytes | 기준선 차이 |
| ------ | ------------- | ---------: | ---------: | ----------: |
| 관리자 | `/`           |          9 |     65,536 |         -41 |
| 관리자 | `/analytics`  |         11 |     74,110 |         -41 |
| 학습자 | `/`           |          7 |     57,910 |        -168 |
| 학습자 | `/app`        |         10 |    131,866 |      -1,021 |
| 학습자 | `/app/lesson` |         10 |    224,280 |      -1,367 |

## 2-C 변경 단위 검증 결과

`Progress`, `Table`, `Empty`와 `Spinner`를 Luma source로 교체했다.

`Progress`의 `indicatorClassName`과 `trackClassName` 소비자는 0개다.

`@hugeicons/react` 1.1.9와 `@hugeicons/core-free-icons` 4.2.3을 추가했다.

두 package metadata는 MIT license를 선언한다.

`lucide-react` source import와 package 선언은 0개다.

Icon data는 `@hugeicons/core-free-icons/*` subpath에서 직접 가져온다.

초기 shell은 `control-icons`, `navigation-icons`와 `action-icons` 모듈을 사용한다.

공유 UI, Storybook, 웹과 관리자 typecheck 및 lint는 통과했다.

공유 UI는 6개 파일과 20개 테스트를 통과했다.

웹은 32개 파일과 136개 테스트를 통과했다.

관리자는 34개 파일과 151개 테스트를 통과했다.

Storybook은 36개 파일과 59개 테스트를 통과했다. 7개 파일은 설정에 따라 제외됐다.

Storybook production build는 통과했다.

`Progress`, `Table`, `Empty`와 `Spinner`의 밝은 테마 및 어두운 테마 수동 검증은 통과했다.

Next.js 앱 2개는 production compile, typecheck와 정적 페이지 생성을 통과했다.

두 앱은 기존 standalone symlink `EPERM`에서 실패했다.

Route bundle 검사는 모든 예산을 통과했다.

| 앱     | route         | 초기 chunk | gzip bytes | 기준선 차이 |
| ------ | ------------- | ---------: | ---------: | ----------: |
| 관리자 | `/`           |          9 |     69,725 |      +4,148 |
| 관리자 | `/analytics`  |         11 |     78,299 |      +4,148 |
| 학습자 | `/`           |          7 |     57,459 |        -619 |
| 학습자 | `/app`        |         11 |    137,250 |      +4,363 |
| 학습자 | `/app/lesson` |         11 |    229,014 |      +3,367 |

Production audit와 full audit은 기존 `GHSA-f88m-g3jw-g9cj` 예외가 2026-08-06에 만료돼 실패했다.

## 3-A 변경 단위 검증 결과

공개 랜딩, 학습자 로그인과 관리자 로그인을 Luma 조합으로 교체했다.

랜딩은 실제 코스 데이터와 Server Component 경계를 유지한다.

학습자 로그인은 Google 행동을 먼저 제공하고 이메일 행동을 `FieldSeparator` 뒤에 제공한다.

관리자 로그인은 `Surface variant="panel"`, `Field`, `Alert`, `Button`과 `Input`을 사용한다.

인증 전용 Hugeicons는 `authentication-icons` 진입점으로 분리했다.

공유 UI, 웹과 관리자 typecheck 및 lint는 통과했다.

공유 UI는 6개 파일과 20개 테스트를 통과했다.

웹은 32개 파일과 136개 테스트를 통과했다.

관리자는 34개 파일과 151개 테스트를 통과했다.

Storybook은 36개 파일과 59개 테스트를 통과했다. 7개 파일은 설정에 따라 제외됐다.

Storybook production build는 통과했다.

브라우저에서 랜딩과 인증 화면의 밝은 테마 및 어두운 테마를 확인했다.

세 화면의 heading, link, label, alert와 수평 overflow를 확인했다.

Next.js 앱 2개는 production compile, typecheck와 정적 페이지 생성을 통과했다.

두 앱은 기존 standalone symlink `EPERM`에서 실패했다.

Route bundle 검사는 모든 예산을 통과했다.

| 앱     | route         | 초기 chunk | gzip bytes | 2-C 차이 |
| ------ | ------------- | ---------: | ---------: | -------: |
| 관리자 | `/`           |          9 |     70,021 |     +296 |
| 관리자 | `/analytics`  |         11 |     78,595 |     +296 |
| 학습자 | `/`           |          7 |     57,459 |        0 |
| 학습자 | `/app`        |         11 |    137,250 |        0 |
| 학습자 | `/app/lesson` |         11 |    228,977 |      -37 |

PR E2E는 7개 중 5개가 통과했다.

관리자 코스 발행 시나리오는 기존 `e2e/admin-content-fixture.ts`의 허용되지 않는 `category: "E2E"` 값으로 실패했다.

학습자 핵심 레슨 시나리오는 완료 화면까지 도달했으나 Next.js development RSC 탐색에서 `pageerror: Connection closed.`를 기록해 실패했다.

## 4단계 검증 결과

학습 shell과 10개 학습 단계 표시를 Luma 학습 primitive로 교체했다.

관리자 학습 단계 미리보기는 학습자 앱과 같은 공유 표시 컴포넌트를 사용한다.

정답 판정과 AI 피드백 생성은 기존 서버 계약을 유지한다.

`@dnd-kit/dom` 0.5.0과 `@dnd-kit/react` 0.5.0을 이동형 학습의 직접 dependency로 추가했다.

공유 UI는 6개 파일과 20개 테스트를 통과했다.

학습자 레슨은 관련 2개 파일과 11개 테스트를 통과했다.

관리자 미리보기는 관련 1개 테스트를 통과했다.

Storybook은 37개 파일과 61개 테스트를 통과했다. 7개 파일은 설정에 따라 제외됐다.

Storybook production build는 통과했다.

브라우저에서 선택형 오답, AI 피드백, 연결형 오답, 320 px 분류형 화면과 학습 shell을 확인했다.

이동형 단계는 키보드만으로 항목을 첫 번째 위치에서 두 번째 위치로 이동했다.

선택형 오답은 한 개의 라디오만 선택 상태로 노출된다.

확인한 Storybook 화면에는 수평 overflow와 브라우저 오류가 없었다.

학습자 production build는 compile, typecheck와 11개 정적 페이지 생성을 통과했다.

학습자 production build는 기존 standalone symlink `EPERM`에서 실패했다.

Route bundle 검사는 모든 예산을 통과했다.

| 앱     | route         | 초기 chunk | gzip bytes |
| ------ | ------------- | ---------: | ---------: |
| 관리자 | `/`           |          9 |     70,021 |
| 관리자 | `/analytics`  |         11 |     78,595 |
| 학습자 | `/`           |          7 |     56,892 |
| 학습자 | `/app`        |         12 |    137,832 |
| 학습자 | `/app/lesson` |         11 |    232,385 |

## 3-B 변경 단위 수동 검증 결과

격리된 E2E 데이터베이스와 실제 이메일 로그인 handler를 사용했다.

학습자 홈, 코스 목록, 코스 상세와 프로필을 어두운 테마에서 확인했다.

프로필과 쓰기 홈을 밝은 테마에서 확인했다.

확인한 화면에는 수평 overflow가 없었다.

코스 상세에서 Server Component가 `ProgressValue`에 함수 child를 전달하는 RSC 오류를 발견했다.

코스 상세와 학습자 홈의 함수 child를 직렬화 가능한 JSX 텍스트로 교체했다.

관련 3개 테스트 파일과 9개 테스트는 통과했다.

320 px와 200% 확대 등가 폭 검증은 최종 검증에서 통과했다.

## 5단계 검증 결과

쓰기 홈은 Luma `Card`, `Empty`, `Badge`와 `Insight`를 사용한다.

집중 편집기는 Luma `Compose`, `Field`, `ComposeEditor`와 `ComposeMeter`를 사용한다.

자기 점검은 Luma `Prose`, `Card`, `Badge`와 `Insight`를 사용한다.

전체 학습자 앱은 32개 파일과 136개 테스트를 통과했다.

학습자 앱 typecheck와 lint는 통과했다.

Production build는 compile, typecheck와 11개 정적 페이지 생성을 통과했다.

Production build는 기존 standalone symlink `EPERM`에서 실패했다.

실제 이메일 로그인 뒤 새 글 생성, 51자 자동 저장, 자기 점검 진입과 완료를 확인했다.

쓰기 홈, 편집기와 자기 점검의 어두운 테마를 확인했다.

저장한 글이 있는 쓰기 홈의 밝은 테마를 확인했다.

확인한 화면에는 수평 overflow와 새 브라우저 오류가 없었다.

320 px와 200% 확대 등가 폭 검증은 최종 검증에서 통과했다.

## 6단계와 최종 검증 결과

관리자 shell, dashboard, course 관리, learner 관리, analytics와 audit 화면을 Luma 조합으로 교체했다.

모바일 관리자 drawer는 별도 동적 client 경계로 분리했다.

분석의 페이지 크기 선택은 Server Component 경계를 유지하는 native `select`로 교체했다.

반복 업로드 필드 20개는 `useId()`로 서로 다른 input `id`를 사용한다.

320 px와 200% 확대 등가 폭 640 px에서 학습자와 관리자 주요 화면의 page horizontal overflow는 0건이다.

강의 상세 accordion의 `min-w-0` 수정도 같은 조건에서 확인했다.

학습자 프로필 control로 라이트 테마와 다크 테마를 확인했다.

관리자 화면은 운영체제의 다크 테마를 사용했다.

최종 학습자, 관리자와 Storybook 브라우저 console의 error와 warning은 0건이다.

Storybook destructive alert의 3.99:1 대비는 설명 opacity를 1로 수정한 뒤 통과했다.

공유 UI는 6개 파일과 20개 테스트가 통과했다.

관리자 앱은 34개 파일과 152개 테스트가 통과했다.

학습자 앱은 32개 파일과 136개 테스트가 통과했다.

전체 workspace는 192개 파일에서 1,084개 테스트가 통과하고 1개가 skip됐다.

Storybook은 35개 파일과 58개 테스트가 통과하고 4개 파일이 skip됐다.

Storybook production build는 통과했다.

| 앱     | route         | 초기 chunk | gzip bytes |
| ------ | ------------- | ---------: | ---------: |
| 관리자 | `/`           |          8 |     62,379 |
| 관리자 | `/analytics`  |         11 |     72,747 |
| 학습자 | `/`           |          7 |     57,633 |
| 학습자 | `/app`        |         12 |    138,487 |
| 학습자 | `/app/lesson` |         11 |    233,268 |

모든 route bundle 예산은 통과했다.

`lucide-react`, 앱 source의 `#ui/*`, legacy UI component, legacy Button variant와 예제 block product import의 소비자는 0개다.

`ci:static`은 중첩 참조 저장소 `ui/`의 기존 192개 format 차이만 실패했다.

Root workspace test는 통과했다.

Root repository test와 두 audit은 만료된 `GHSA-f88m-g3jw-g9cj` 예외 때문에 실패했다.

두 Next.js 앱은 compile, typecheck와 정적 페이지 생성을 통과했다.

Build와 release E2E는 Windows standalone symlink `EPERM`에서 실패했다.

Lighthouse는 standalone server 산출물이 없어서 시작하지 못했다.

중복 `새 글 쓰기` 행동을 제거한 뒤 글쓰기 PR E2E는 통과했다.

최종 PR E2E는 7개 중 5개가 통과했다.

PR E2E의 기존 잔여 장애는 Next.js development의 `pageerror: Connection closed.`와 허용되지 않은 `category: "E2E"` fixture다.

## 전체 upstream 이관 검증

- 검증 시각: 2026-08-09 KST
- upstream commit: `010ddc4421d0d2875c858f3cec69a4a93dbf2f28`
- Git 추적 파일: 355개, 누락 0개
- Markdown 문서: 13개, 누락 0개
- registry UI: 115개, 공유 UI 누락 0개
- registry block: 등록 항목 20개, source 파일 23개, 공유 block 누락 0개
- registry hook: 1개, 공유 hook 누락 0개
- registry lib: 1개, 공유 lib 누락 0개
- base registry: 1개

`bun.lock`, `.oxfmtrc.json`, `package.json` 원본은 각각 `upstream-bun.lock.snapshot`, `upstream-oxfmtrc.snapshot`, `upstream-package.snapshot`으로 보존했다.

Astro 앱의 format, lint, 문서 규칙, typecheck, registry validate와 production build는 통과했다.

Astro 진단은 697개 파일에서 error, warning과 hint가 0개였다.

문서 예제 522개를 생성했다.

shadcn은 registry 파일 3개의 항목 138개를 검증했다.

Astro는 정적 페이지 118개를 생성했다.

브라우저에서 홈, 학습·운영·로그인 block 분류와 Chart 문서를 확인했다.

`bun install --frozen-lockfile`, `ci:static`, Storybook production build, Storybook 58개 테스트와 route bundle 검사는 통과했다.

`ci:tests`의 repository 검사는 `GHSA-f88m-g3jw-g9cj` 예외가 2026-08-06에 만료되어 실패했다.

병렬 workspace test에서 3개 UI 테스트가 대기 시간 초과로 실패했다. 같은 파일의 12개 테스트를 단일 worker로 재실행한 결과는 통과였다.

Root build는 Next.js compile과 typecheck 후 관리자 standalone symlink 생성에서 Windows `EPERM`으로 실패했다.

정책 기반 production audit와 full audit는 만료된 예외 때문에 실행 전에 중단됐다.

진단용 raw audit는 production graph에서 20개 취약점을 보고했다. full graph에서는 21개 취약점을 보고했다.
