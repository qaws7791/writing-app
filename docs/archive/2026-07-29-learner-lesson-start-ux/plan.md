# 학습자 레슨 시작 화면 UI/UX 개선

## 목표

[`SCR-006`](../../design/screens/SCR-006-learner-lesson.md)의 시작 전 상태와 [`design-brief`](../../design/design-brief.md)의 학습자 톤을 유지하면서, 승인된 범위의 정보 위계·아이콘·접근성·브랜드 표현을 개선한다.

동시에 다음 **제품 불변식**을 코드와 명세에 고정한다.

- 시작 화면에 도달한 레슨은 **학습 가능한 레슨**(스텝 ≥ 1)이다.
- 레슨이 없으면 시작 화면이 아니라 **찾을 수 없음(또는 동등한 route notice)** 으로 끝난다.
- 스텝 없는 레슨은 발행하지 않으며, 조회·진입 경로에서도 **사용자에게 시작 화면을 보여주지 않고 에러로 차단**한다.
- 따라서 시작 CTA의 `canStart`·시작 불가 disabled·불가 이유 UI는 **존재하지 않아야** 한다.

이 문서는 한시 계획이다. 현재 사실의 권위 소스가 아니며, 구현 전에 합의된 결론을 `SCR-006`과 필요한 design·product·engineering 문서에 반영한 뒤 코드를 변경한다.

## 비범위

- 레슨 진행 중·완료 화면의 전면 UI 개편
- 코스 상세·학습 홈·글로벌 내비게이션 개편
- 신규 일러스트·에셋 파이프라인
- 다크 모드·디자인 토큰 체계 전면 개편
- 미승인 항목(#5, #6, #12, #16)
- 시작 API 자체의 제거·낙관적 시작·자동 시작으로의 아키텍처 변경
- 시작 **네트워크 실패** 피드백(기존 `startError` Callout) 제거 — 유지
- 레슨 **진행 중** 헤더(`LessonProgressHeader`) 열 폭 정렬은 #17 승인 시 같은 계약으로 맞추되, 진행 UI 전면 개편은 비범위

## 권위 소스와 구현 위치

| 영역                    | 권위 / 구현                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------- |
| 화면 목적·상태·접근성   | [`SCR-006`](../../design/screens/SCR-006-learner-lesson.md)                        |
| 브랜드·아트 디렉션      | [`design-brief`](../../design/design-brief.md)                                     |
| 제품 진행 규칙          | [`REQ-LRN-4`](../../product/requirements/platform/req-lrn-4-lesson-progression.md) |
| 레슨 route·조회 실패 UI | `apps/web/src/app/(lesson)/app/lesson/page.tsx`                                    |
| 시작 화면 UI            | `apps/web/src/features/lesson-session/ui/lesson-start-screen.tsx`                  |
| 셸·나가기 헤더          | `apps/web/src/features/lesson-session/ui/lesson-shell.tsx`                         |
| 세션·시작 전이          | `apps/web/src/features/lesson-session/hooks/use-lesson-session.ts`                 |
| 발행 hierarchy 검증     | content domain `decidePublishCurriculum`                                           |
| 학습자 레슨 조회        | learning `readLesson` 및 learner lesson 계약                                       |
| CTA·Callout             | `packages/shared/ui`의 `StickyActionBar`, `Button`, `Callout`                      |

코드·설정이 소유하는 값(경로, DTO 필드명, 토큰 값, HTTP status)은 이 계획에 복제하지 않는다.

## 조사 요약

### `canStart` (확정 폐기)

`canStart = mounted && getFirstLessonStep(lesson) !== null`이다. `!mounted`는 하이드레이션 가드일 뿐이고, 빈 `steps`는 발행이 거절하는 비정상 데이터다. 시작 화면에서 disabled·이유 문구로 다룰 상태가 아니며, **진입 전 에러**로 차단한다.

### 시작 중(`starting` / `isSavingStart`) (확정 유지·카피만 변경)

`시작하기`는 `POST …/lessons/{id}/start`로 코스·레슨 진행과 활동일을 서버에 확정한다([`REQ-LRN-4`](../../product/requirements/platform/req-lrn-4-lesson-progression.md)). 요청이 끝날 때까지의 in-flight 구간·버튼 비활성·실패 시 재시도는 **필요하다**. 제거할 것은 pending 자체가 아니라 **“저장 중”이라는 시스템 카피**다. 표시는 `시작하는 중…`(또는 동등) + busy(spinner/`aria-busy`)로 한다.

### 진입 경계

- `lesson_id` 없음·조회 실패는 route `AppRouteNotice`로 이미 처리한다.
- 빈 `steps`가 조회 성공으로 내려오면 시작 화면까지 도달할 수 있다. 이를 fail closed로 막는다.

### 가로 열 정렬 (#17)

시작 화면에서 X·본문·CTA가 한 열로 보이지 않는 이유는 **의도적 여백이 아니라 max-width 불일치**다.

| 영역                      | 현재                 | 효과                    |
| ------------------------- | -------------------- | ----------------------- |
| `LessonIntroHeader`       | `max-w-3xl` + `px-6` | 넓은 열의 왼쪽 패딩에 X |
| 본문 (`LessonShell` main) | `max-w-2xl` + `px-6` | 더 좁은 중앙 열         |
| CTA (`StickyActionBar`)   | `max-w-2xl`          | 본문과 동일 열          |

뷰포트가 `2xl`보다 넓을 때 X만 본문·CTA 왼쪽 가장자리보다 밖으로 나간다. 좁은(모바일) 폭에서는 세 영역이 모두 full-bleed + 동일 `px-6`이라 어긋남이 거의 없다.

**UX 판정:** 과제를 막지는 않지만 단일 콘텐츠 열 관례에 어긋나 신뢰·완성도(중) 이슈다. **승인:** 시작·진행 헤더와 본문·CTA의 max-width를 `max-w-2xl`로 통일한다.

## 제품 불변식 → 처치 (확정)

| #   | 심각도 | 처치 | 문제                        | 해결 방향                                                           |
| --- | ------ | ---- | --------------------------- | ------------------------------------------------------------------- |
| 0a  | 상     | 제거 | `canStart`로 CTA disabled   | `canStart` 제거. 비활성은 시작 요청 중(`starting`)만                |
| 0b  | 상     | 변경 | 빈 스텝이 시작 화면에 도달  | 발행 거절 유지 + 학습자 조회에서 거절 + route가 Experience에 미전달 |
| 0c  | 상     | 변경 | 계약이 빈 `steps` 허용 가능 | 조회 경계에서 not-found(또는 동등) 매핑 + 테스트로 회귀 방지        |
| 0d  | 중     | 변경 | 명세에 시작 불가 UI 여지    | SCR-006: 시작 전 = 학습 가능 레슨만. 불능은 route/조회 실패         |

## 승인 범위 (2026-07-29)

| #     | 판정            | 확정 처치                                                                                                            |
| ----- | --------------- | -------------------------------------------------------------------------------------------------------------------- |
| 0a–0d | 승인            | 위 불변식 그대로 구현                                                                                                |
| 2     | 승인            | pending 유지. 카피 `저장 중` → `시작하는 중…`(또는 동등). 시스템 “저장” 용어 제거                                    |
| 3     | 승인            | 이모지 → 제품 아이콘. 아이콘 decorative                                                                              |
| 4     | 승인            | category에서 `uppercase`·과도 `tracking` 제거. 한국어 eyebrow                                                        |
| 5     | 미승인          | 코스/유닛 맥락 줄 추가하지 않음                                                                                      |
| 6     | 미승인          | “이 레슨에서 할 일” 중간 밴드 추가하지 않음                                                                          |
| 7     | 승인            | 기존 토큰 범위에서 약한 accent·아이콘 색으로 모노크롬 완화                                                           |
| 8     | 승인            | 나가기 hit area를 최소 터치 목표로 확대. `aria-label="나가기"` 유지. **텍스트 라벨 병기 없음**(#16)                  |
| 9     | 승인            | 시작 중 busy(`aria-busy` 또는 spinner). 이중 제출은 `starting` 가드                                                  |
| 10    | 승인(수정)      | 예상 시간(**분**) 메타 **제거**. 스텝 수는 **`n개 활동`** 으로 표시. 유형 요약은 하지 않음                           |
| 11    | 승인(방향 반전) | 메타를 더 작게 만들지 않음. **메타를 크고 눈에 띄게(통계/세션 요약 느낌)** 두고, 설명은 상대적으로 한 단계 낮은 위계 |
| 12    | 미승인          | 데스크톱도 모바일과 동일한 상단 정보·하단 CTA 레이아웃 유지(Duolingo·Brilliant류). 세로 여백·간격 조정 없음          |
| 13    | 승인            | 시작 화면 `main` ↔ `h1`을 `aria-labelledby` 등으로 명시 연결                                                         |
| 14    | 승인            | 시작 화면 StickyActionBar **배경 그라데이션 삭제**(또는 시작 화면에서 비그라데이션 처리)                             |
| 15    | 통합·불필요     | #10으로 흡수(분 제거·활동 표기). 별도 작업 없음                                                                      |
| 16    | 미승인          | X 아이콘 유지. “뒤로”/텍스트 나가기로 바꾸지 않음                                                                    |
| 17    | 승인            | 헤더·본문·CTA `max-width`를 `max-w-2xl`로 통일. 동일 `px-6` 유지. 풀블리드 크롬 아님                                 |

> 그라데이션 삭제는 원 지적이 #14(sticky footer 그라데이션)이다. 판정 메모의 “15번 → 그라데이션 삭제”는 #14 처치로 반영했고, 옛 #15(단위 표현)는 #10에 흡수했다.

## UI/UX 문제 → 처치 매핑 (승인분만 구현)

| #   | 심각도 | 처치 | 문제                    | 해결 방향                                                                                                |
| --- | ------ | ---- | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| 2   | 상     | 변경 | “저장 중” 카피          | `시작하는 중…` + #9 busy. in-flight·재시도 구조 유지                                                     |
| 3   | 상     | 변경 | 이모지 메타             | 제품 아이콘 + `n개 활동` 텍스트                                                                          |
| 4   | 상     | 변경 | Latin uppercase eyebrow | 한국어에 맞는 category 스타일                                                                            |
| 7   | 중     | 변경 | 모노크롬                | 토큰 accent·아이콘 색. 신규 에셋 없음                                                                    |
| 8   | 중     | 변경 | 나가기 hit area         | 44/48 수준 hit area. X 아이콘만                                                                          |
| 9   | 중     | 추가 | 시작 중 피드백 부족     | spinner 또는 `aria-busy`                                                                                 |
| 10  | 중     | 변경 | 메타 라벨               | **분 제거**, **`n개 활동`만**                                                                            |
| 11  | 중     | 변경 | 위계                    | 메타=큰 통계형 블록, 설명=보조 본문                                                                      |
| 13  | 하     | 변경 | landmark                | `aria-labelledby` → 제목 `h1`                                                                            |
| 14  | 하     | 제거 | footer 그라데이션       | 시작 화면에서 그라데이션 삭제                                                                            |
| 17  | 중     | 변경 | X만 왼쪽 열 밖으로 빠짐 | `LessonIntroHeader`·(동일 계약) `LessonProgressHeader`를 본문·CTA와 같이 `max-w-2xl`로 통일. `px-6` 유지 |

## #12 데스크톱 세로 여백 (미승인)

Duolingo·Brilliant처럼 **PC에서도 모바일과 같은** 상단 정보·하단 CTA 구조를 유지한다. 데스크톱 전용 세로 간격 조정·콘텐츠 재배치는 하지 않는다.

## #17 가로 열 정렬 (승인)

넓은 화면에서 chrome(X)과 content/CTA 왼쪽 엣지가 어긋나면 몰입 레이아웃의 단일 열 약속이 깨진다. **`LessonIntroHeader`와 `LessonProgressHeader`를 본문·CTA와 동일하게 `max-w-2xl`로 통일**한다. 풀블리드 크롬은 채택하지 않는다.

## 미결 해소 (2026-07-29)

1. **빈 스텝 조회 에러** — `lesson-not-found`로 통합한다.
2. **#7·#11 메타** — 프로필 페이지와 같은 `StatCard`/`StatGrid`(`layout="profile"`)로 구현한다. 아이콘은 제품 아이콘 + accent 토큰으로 약한 색 신호를 준다.

## 실행 결과 (2026-07-29)

승인 범위를 구현했다. 빈 스텝 조회는 `lesson-not-found`로 통합했고, 메타는 프로필형 `StatCard`/`StatGrid`로 표시한다. `canStart` 제거, 시작 중 카피·busy, 열 폭 통일, footer `tone="plain"`, 나가기 hit area, category·landmark 반영.

## 실행 순서

1. **A–F** — 명세·fail closed·CTA·정보 시각·a11y·검증 완료. 이 작업 단위는 `docs/archive/2026-07-29-learner-lesson-start-ux/`로 이동한다.

## 완료 조건

- SCR-006이 불변식·승인 UI와 일치한다.
- `canStart`/시작 불가 UI 없음. CTA 비활성은 시작 요청 중뿐. 카피에 “저장 중” 없음.
- 빈 스텝이 시작 화면에 도달하지 않는다(테스트로 고정).
- 메타는 이모지 없이 **`n개 활동`만**(분 없음), 통계형으로 강조된다.
- 시작 화면 footer 그라데이션 없음. 나가기는 X + 확대 hit area.
- 헤더·본문·CTA가 동일 `max-w-2xl` 열에 정렬된다.
- 관련 테스트·`bun run typecheck`·해당 lint 통과 후 work → archive.

## 검증 관점

- 정상 레슨: 즉시 CTA 활성 → 시작 중 busy/카피 → 성공 시 진행 화면
- 조회 실패·빈 스텝: 시작 화면 미렌더
- 메타 위계(통계형)·category 한국어·키보드/스크린리더·reduced motion

자동화는 불변식·CTA 상태·메타 카피·조회 실패 회귀의 최소 범위만 확장한다.
