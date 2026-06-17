# WA-38 코스 이미지 출처 계약 조사

- 작성일: 2026-06-17
- 대상 이슈: WA-38 `매직 스트링과 하드코딩된 이미지 매핑`
- 조사 범위: `apps/web/src/features/courses/course-image-url.ts`, 코스 목록/상세 화면, web course mapper/type, DB content schema, core content DTO, OpenAPI, BSSN 단순화 문서

## 결론

WA-38은 타당하다. `course-image-url.ts`는 `c1`부터 `c5`까지 코스 ID literal과 이미지 경로를 웹 코드에 하드코딩한다. 코스 데이터는 API/DB에서 오지만, 시각 자산 선택은 웹 코드가 seed ID를 알고 있다는 전제에 의존한다.

다만 이슈의 개선안처럼 곧바로 `courses` 테이블에 썸네일 URL 컬럼을 추가하는 것은 기존 BSSN 단순화 결정과 충돌할 수 있다. 2026-05-31 문서에서는 코스 썸네일 업로드, 스토리지, `thumbnail`/`thumbnailPath` 필드를 제거하고 제목/설명/진행률/카테고리 중심 UI를 권장했다. 따라서 해결 방향은 "이미지를 콘텐츠 계약으로 공식화할지" 또는 "코스 UI에서 이미지 의존을 제거할지"를 먼저 제품/운영 정책으로 결정해야 한다.

## 2026-06-17 구현 시작

- 선택한 방향: 업로드 URL 컬럼이 아니라 정적 `visualKey` 콘텐츠 계약을 도입한다.
- 이유: BSSN 결정처럼 스토리지/썸네일 업로드 복잡도는 되살리지 않되, seed ID와 웹 이미지 선택의 암묵 결합은 끊는다.
- 구현 범위: DB `courses.visual_key`, core course DTO, API/OpenAPI, web course model/mapper, 홈/목록/상세 이미지 호출부, seed visual key, 관련 테스트를 함께 갱신한다.

## 근거

- `apps/web/src/features/courses/course-image-url.ts`
  - `defaultCourseImageUrl`와 `Map<string, string>`에 `c1`, `c2`, `c3`, `c4`, `c5`가 직접 들어 있다.
  - 알 수 없는 코스 ID는 기본 이미지로 fallback한다.
- `apps/web/src/features/courses/courses-page.tsx`
  - 코스 카드에서 `createCourseImageUrl(course.id)`를 호출한다.
  - API 응답의 데이터가 아니라 course id 기반 웹 helper로 이미지를 결정한다.
  - API 실패/빈 목록 fallback도 `c1`부터 `c5`까지 정적 코스 데이터를 갖는다.
- `apps/web/src/features/courses/course-detail-page.tsx`
  - 상세 hero 이미지도 `createCourseImageUrl(course.id)`를 사용한다.
- `apps/web/src/features/courses/course-types.ts`
  - `CourseSummary`, `CourseDetail`에는 course image 필드가 없다.
- `apps/web/src/features/courses/course-api-mappers.ts`
  - API course response를 웹 모델로 매핑할 때 image 값을 받거나 전달하지 않는다.
- `packages/db/src/schema/content.schema.ts`
  - `courses` 테이블에는 `id`, `title`, `description`, `category`, `status`, `sortOrder`, `curriculumRevision`만 있고 image/thumbnail 컬럼은 없다.
- `packages/core/src/content/content.dto.ts`
  - course DTO에도 image/thumbnail 필드는 없다.
- `apps/api/src/openapi/openapi-document.ts`
  - 검색된 `image` 필드는 learner user profile schema에 해당하고, 코스 schema에는 image 필드가 없다.
- `docs/bssn-simplification-audit.md`
  - 코스 썸네일 업로드와 스토리지 의존성을 제거했고, 코스에서 `thumbnail`/`thumbnailPath` 필드를 제거하는 단순화 방향을 기록했다.

## 위험

- 새 코스를 seed나 관리자 API로 추가해도 웹 helper를 수정하지 않으면 기본 이미지가 반복된다.
- 코스 ID 변경이나 seed 재정렬이 UI 이미지와 암묵적으로 결합된다.
- 데이터 계약에 없는 시각 정보가 웹 코드에 숨어 있어 관리자 미리보기, API 소비자, 테스트가 같은 화면을 재현하기 어렵다.
- fallback 기본 이미지가 정상 상태처럼 보이므로 누락을 관측하기 어렵다.
- 과거에 제거한 썸네일/스토리지 복잡도를 다시 도입할지 판단 없이 웹 코드만 커질 수 있다.

## 개선 방안

### 방안 1. 코스 이미지 정책을 콘텐츠 계약으로 공식화한다

코스가 이미지가 필요한 제품이라면 `courses` 테이블, core DTO, API 응답, web model에 `imagePath` 또는 `visualAsset` 필드를 추가한다. seed와 관리자 편집기는 이 값을 소유하고, 웹은 전달받은 값을 렌더링만 한다.

장점은 seed ID와 웹 코드의 암묵 결합이 사라진다. 단점은 DB migration, API 계약, 관리자 편집 정책이 필요하며, 과거 제거한 썸네일 운영 복잡도 일부가 돌아올 수 있다.

### 방안 2. 업로드가 아닌 정적 asset token 계약을 둔다

스토리지와 업로드를 되살리지 않고, `courseVisualKey: "basic-sentence-writing" | "grammar-complete" | ...` 같은 제한된 token을 콘텐츠 계약에 둔다. 웹은 token을 정적 asset manifest에 매핑하고, 새 코스는 허용 token 중 하나를 선택한다.

장점은 DB/API가 이미지 선택을 명시적으로 소유하면서도 S3/RustFS/CDN 운영을 피할 수 있다. 단점은 token 목록과 asset manifest를 관리해야 한다.

### 방안 3. 코스 카드에서 bitmap 이미지 의존을 제거한다

BSSN 결정에 맞춰 코스 UI를 제목, 설명, 레슨 수, 진행률, 카테고리 색상/아이콘 기반으로 바꾼다. 이 경우 `course-image-url.ts` 자체를 제거하고, 코스 ID별 이미지 매핑 문제를 없앤다.

장점은 가장 단순하고 운영 의존성이 적다. 단점은 Kwep UI parity나 시각적 풍부함을 유지하려는 목표와 충돌할 수 있다.

### 방안 4. 임시로 manifest 기반 검증을 추가한다

장기 방향 결정 전에는 현재 helper를 `course-visual-manifest.ts`로 명명하고, seed의 active course id와 manifest key가 일치하는지 테스트한다. 누락 시 기본 이미지로 조용히 fallback하지 말고 개발/테스트에서 실패하게 한다.

장점은 즉시 DB schema를 바꾸지 않고도 누락을 관측 가능하게 만든다. 단점은 하드코딩 구조 자체는 남는다.

### 방안 5. fallback 정책을 명시적으로 분리한다

알 수 없는 코스에 기본 이미지를 주는 정책을 `missingVisualPolicy`로 분리한다. 운영에서는 placeholder를 허용할지, 관리자 화면에서 경고할지, 빌드/테스트에서 실패할지 명확히 정한다.

장점은 새 코스 추가 시 이미지 누락이 정상인지 오류인지 분리된다.

## 권장 진행 순서

1. 코스 화면이 bitmap 이미지를 제품 필수 요소로 유지할지 결정한다.
2. 이미지가 필수라면 업로드 URL이 아니라 정적 `courseVisualKey` 계약부터 도입한다.
3. `CourseSummary`/`CourseDetail`, core DTO, API 응답, web mapper에 visual key를 전달한다.
4. 웹은 `course.id`가 아니라 `course.visualKey`로 asset manifest를 조회하게 한다.
5. 이미지가 필수가 아니라면 `course-image-url.ts`와 `Image` 의존을 제거하고 카테고리 기반 visual system으로 전환한다.
6. 어떤 선택이든 seed/API/web 계약 drift 테스트를 추가한다.

## Notion 업데이트 요약

- WA-38 본문을 읽고 웹 코스 이미지 helper, 코스 목록/상세 화면, web mapper/type, DB schema, core DTO, OpenAPI, BSSN 단순화 문서를 조사했다.
- 이슈는 타당하지만, 곧바로 DB 썸네일 URL 컬럼을 추가하는 것은 과거 단순화 결정과 충돌할 수 있다.
- 해결은 코스 이미지가 제품 계약인지 먼저 정하고, 정적 visual key 계약 또는 이미지 의존 제거 중 하나로 시스템 경계를 명시해야 한다.

## 2026-06-17 구현 완료

- `courses.visual_key`를 baseline schema와 Drizzle schema에 추가하고, Kwep seed 5개 코스에 정적 visual key를 명시했다.
- core course DTO에 `courseVisualKeySchema`와 `visualKey` 필드를 추가해 API 계약의 허용 token 집합을 한 곳에서 관리하게 했다.
- 콘텐츠 repository, progress read model, OpenAPI 정적 문서, 웹 생성 타입을 갱신해 목록/상세/홈 진행 응답이 모두 visual key를 전달한다.
- 웹의 `course-image-url.ts`를 제거하고 `course-visual-assets.ts` 정적 manifest로 대체해 이미지 선택이 course id가 아니라 visual key에 의존하게 했다.
- 코스 목록, 코스 상세, 홈 이어 학습 카드의 이미지 호출부를 `course.visualKey` 기반으로 바꿨다.
- 관련 fixture와 테스트를 갱신해 visual key 누락이 typecheck/test에서 드러나게 했다.

## 검증 결과

- `bun --filter @workspace/api openapi:generate`
- `bun --filter @workspace/web api:generate`
- `bun --filter @workspace/core test src/content/content.dto.test.ts src/content/content.service.test.ts`
- `bun --filter @workspace/db test src/seeds/seed-content.test.ts src/repositories/content.repository.test.ts src/repositories/admin.repository.test.ts`
- `bun --filter @workspace/api test src/routes/courses.route.test.ts src/routes/progress.route.test.ts src/openapi/openapi-document.test.ts`
- `bun --filter @workspace/web test src/features/courses/course-visual-assets.test.ts src/features/courses/course-api-mappers.test.ts src/features/courses/courses-page.test.tsx src/features/courses/course-detail-page.test.tsx src/features/courses/course-curriculum.test.tsx src/features/home/home-page.test.tsx src/features/lessons/lesson-experience.test.tsx 'src/app/(learner)/app/courses/[id]/page.test.tsx' src/lib/api/http/create-http-writing-app-api.test.ts`
- `bun --filter @workspace/core typecheck`
- `bun --filter @workspace/db typecheck`
- `bun --filter @workspace/api typecheck`
- `bun --filter @workspace/web typecheck`
- `bun --filter @workspace/core lint`
- `bun --filter @workspace/db lint`
- `bun --filter @workspace/api lint`
- `bun --filter @workspace/web lint`
