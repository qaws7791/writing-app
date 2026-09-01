# Lead Magnet 콘텐츠 집필

이 디렉터리는 `docs/work/2026-08-31-lead-magnet-course-design/` 설계를 실행하는 집필 산출물을 둡니다.

## 검증

집필 품질 계약은 [`packages/shared/contracts/src/content/authoring/`](../../packages/shared/contracts/src/content/authoring/)이 소유합니다.

```sh
bun run content:validate -- work-orders content-authoring/lead-magnet/work-orders.json
bun run content:validate -- lesson content-authoring/lead-magnet/courses/course-01-spelling/lesson-spelling-roseo.json
bun run content:validate -- seed
```

## 절차

1. `work-orders.json`에서 레슨의 `template` 또는 `layout`과 `lessonId`를 확인합니다.
2. `courses/<코스-id>/<레슨-id>.json`에 시드 형식 스텝 배열을 작성합니다.
3. `content:validate -- work-orders`로 코스 작업 지시서를 검증합니다.
4. 검증 통과 후 `content:merge`로 `content-seed-data.json`에 병합합니다.
5. 병합한 코스는 `content:validate -- seed --course=<코스-id>`로 시드 집필 검사를 통과해야 합니다.

```sh
bun run content:merge -- course-01-spelling content-authoring/lead-magnet/courses/course-01-spelling --dry-run
```

병합 뒤에는 시드 파일을 Oxfmt로 정렬합니다.

```sh
bun oxfmt packages/modules/content/src/infrastructure/persistence/content-seed-data.json
```

## 샘플

- `work-orders.json` — 코스 01 golden sample 작업 지시서
- `courses/course-01-spelling/lesson-spelling-roseo.json` — 합격 golden sample
