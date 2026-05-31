# 콘텐츠 시드 데이터 분리 작업

## 작업 시작 기록

- 시작일: 2026-05-31
- 대상: `packages/db/src/seeds/content-seed.ts`
- 문제: 한국어 학습 콘텐츠 원문이 TypeScript 로직 파일에 대량으로 하드코딩되어 있어 데이터 수정과 코드 수정의 경계가 흐려졌다.
- 방향: 콘텐츠 원문은 JSON 데이터 파일로 분리하고, 시드 로직은 JSON을 읽어 Zod로 검증한 뒤 데이터베이스 행으로 변환하는 책임만 갖도록 정리한다.

## 작업 완료 기록

- 완료일: 2026-05-31
- 콘텐츠 원문은 `packages/db/src/seeds/content-seed-data.json`으로 분리했다.
- `packages/db/src/seeds/content-seed.ts`는 JSON 파일을 읽고 Zod 스키마로 검증한 뒤 `contentSeed`로 제공한다.
- 잘못된 외부 시드 데이터가 조용히 통과하지 않도록 `parseContentSeedData` 검증 테스트를 추가했다.
- 검증: `bun --filter @workspace/db test`, `bun --filter @workspace/db typecheck`, `bun --filter @workspace/db lint`
