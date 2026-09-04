# ADR-0040: 레슨 집필 품질 게이트는 템플릿 순서가 아니라 의미 규칙을 강제한다

## 상태

채택됨

## 날짜

2026-09-04

## 맥락

시드 코스 01~05의 124개 레슨을 감사한 결과, 형식 검증(스키마·글자 수·템플릿 순서)은 모두 통과했지만 학습 효과를 무너뜨리는 결함이 전체에 분포했다. 위치 정답이 마지막 구간에 몰리고, 교정안이 원문과 정답 둘뿐이라 문항이 스스로 정답을 드러냈다. 오답이 판정 축과 무관한 비문이어서 레슨 지식 없이 풀렸다. 글자 수 상한(선택지 15자, 해설 40자)이 실전 문장을 조각냈다. 템플릿 순서 강제는 스텝 유형을 맞추기 위해 상호작용을 납작하게 만들었다. 감사 기록은 `docs/work/2026-09-04-course-seed-quality-rebuild/report-and-plan.md`에 있다.

## 결정

- 검증기는 템플릿의 스텝 순서를 강제하지 않는다. `docs/product/lesson-step-templates.md`의 60종은 권장 배치로 남기고, `content:validate -- template` 명령과 `layout` 순서 검사를 제거한다.
- 검증기는 의미 규칙을 오류와 경고로 나눠 강제한다. 오류는 병합을 막고 경고는 리뷰어가 판정한다. 규칙 목록과 임계값은 `packages/shared/contracts/src/content/authoring/lesson-quality-rules.ts`와 `unit-authoring-rules.ts`가 소유한다.
- 글자 수 상한을 실전 문장이 조각나지 않는 값으로 올린다. 값은 `authoring-limits.ts`가 소유한다. 학습 컴포넌트(`Choice`, `Segment`)는 줄바꿈 레이아웃이라 잘림 없이 렌더한다.
- 집필 입력은 레슨 브리프다. `work-orders.json`은 레슨별 `title`, `thesis`, `judgementAxis`, `scene`, `contrastPairs`, `distractorRules`, `forbidden`, `closing`을 담고, 스키마는 `packages/modules/content/src/authoring/authoring-work-order.ts`가 소유한다.
- 집필자 문장의 톤은 해요체 하나다.
- 기존 시드 레슨은 새 규칙으로 통과하지 않으므로 코스 단위로 전량 재집필해 교체한다. 재집필 전까지 `content:validate -- seed`는 `--course`를 지정한 코스에만 집필 검사를 적용한다.

## 고려한 대안

### 대안 1. 템플릿 순서 강제를 유지하고 의미 규칙만 추가한다

- 장점: 기존 작업 지시서와 검증 흐름을 유지한다.
- 단점: 순서를 맞추기 위해 문장을 스텝 유형에 끼워 넣는 원인이 그대로 남는다.

### 대안 2. 글자 수 상한을 유지하고 문장을 더 짧게 쓴다

- 장점: 화면 레이아웃 변화가 없다.
- 단점: 주어·서술어 호응, 문장 다듬기 같은 코스는 실전 문장을 담지 못한다.

### 대안 3. 기존 레슨을 부분 수정한다

- 장점: 재집필 비용이 낮다.
- 단점: 결함이 장면·대립쌍 설계 단계에서 생겨 스텝 수정으로 고쳐지지 않는다.

## 선택 근거

문항이 정답을 스스로 드러내지 않는지, 오답이 판정 축을 요구하는지는 순서가 아니라 내용 규칙이다. 규칙을 코드로 두면 사람 리뷰가 의미 판정에 집중할 수 있다.

## 결과

- `packages/shared/contracts/src/content/authoring/`에 `authoring-issue.ts`, `forbidden-terms.ts`, `lesson-quality-rules.ts`, `unit-authoring-rules.ts`를 추가한다.
- `packages/modules/content/src/authoring/`의 레이아웃 검증을 제거하고 브리프 스키마로 바꾼다.
- `docs/product/authoring-guidelines.md`가 집필·리뷰 규칙의 단일 권위가 되고, 에이전트 파일은 이 문서를 참조한다.

## 검증

```bash
bun run ci:static
bun run ci:tests
bun run build
bun run content:validate -- lesson content-authoring/lead-magnet/courses/course-01-spelling/lesson-spelling-roseo.json
```

## 관련 문서

- `docs/product/authoring-guidelines.md`
- `docs/product/lesson-step-templates.md`
- `docs/work/2026-09-04-course-seed-quality-rebuild/report-and-plan.md`
