# Lead Magnet 콘텐츠 집필

이 디렉터리는 리드 마그넷 코스 설계를 실행하는 집필 산출물을 둡니다. 집필·리뷰 규칙은 [`docs/product/authoring-guidelines.md`](../../docs/product/authoring-guidelines.md)가 소유합니다.

## 검증

집필 품질 계약은 [`packages/shared/contracts/src/content/authoring/`](../../packages/shared/contracts/src/content/authoring/)이 소유합니다. 오류는 병합을 막고, 경고는 리뷰어가 판정합니다.

```sh
bun run content:validate -- work-orders content-authoring/lead-magnet/work-orders.json
bun run content:validate -- lesson content-authoring/lead-magnet/courses/course-01-spelling/lesson-spelling-roseo.json
bun run content:validate -- seed --course=<코스-id>
```

## 절차

1. `work-orders.json`에 레슨 브리프를 추가합니다. `title`과 `thesis`는 시드의 레슨 `title`·`desc`와 같은 문장을 씁니다.
2. 집필 에이전트(`.agents/agents/lesson-author.md`)에 브리프 하나와 대상 경로 `courses/<코스-id>/<레슨-id>.json`을 전달합니다.
3. 리뷰 에이전트(`.agents/agents/lesson-reviewer.md`)가 반려하면 반려 사유를 집필 에이전트에 전달해 다시 집필합니다.
4. `content:validate -- work-orders`로 브리프와 레슨 파일을 함께 검증합니다.
5. `content:merge`로 `content-seed-data.json`에 병합하고, `content:validate -- seed --course=<코스-id>`를 통과시킵니다.

```sh
bun run content:merge -- course-01-spelling content-authoring/lead-magnet/courses/course-01-spelling --dry-run
bun oxfmt packages/modules/content/src/infrastructure/persistence/content-seed-data.json
```

## 샘플

- `work-orders.json` — 레슨 브리프 목록. 배열의 각 항목이 레슨 하나이고 `courseId`로 코스 디렉터리를 정합니다.
- `courses/course-01-spelling/lesson-spelling-roseo.json` — 합격 golden sample
