# 코스 검색 기능 전면 제거 계획

## 문서 상태

- 작성일: 2026-07-29
- 상태: 구현 완료, 브라우저 검증 결함 대기
- 결정: 초기 출시에서는 학습자와 관리자 코스 목록의 텍스트 검색을 모두 제공하지 않는다.

## 목표

코스 수가 적은 초기 출시에서 유지 비용과 입력·상태 경계를 늘리는 코스 검색을 제품 기준, 화면, URL, HTTP 계약, 서버 조회, 생성 코드, 테스트와 Storybook에서 함께 제거한다. 카테고리·상태 필터, 페이지 이동과 학습자 더 보기는 유지한다.

## 확인된 사실과 범위 판단

- 학습자 코스 검색은 [학습자 코스 화면](../../../apps/web/src/features/course-catalog/ui/course-catalog-client.tsx), [학습자 조회 계약](../../../packages/shared/contracts/src/learning/learner-content.ts), [조회 mapper](../../../packages/modules/learning/src/interface/http/learning-http-mapper.ts), [학습자 read repository](../../../packages/modules/learning/src/infrastructure/persistence/learning-read-drizzle-repository.ts)에 걸쳐 구현돼 있다.
- 관리자 코스 검색은 [관리자 코스 화면](../../../apps/admin/src/features/course-catalog/ui/admin-courses-page.tsx), [관리자 조회 계약](../../../packages/shared/contracts/src/content/admin-routes.ts), [content port](../../../packages/modules/content/src/application/ports/content-ports.ts), [content repository](../../../packages/modules/content/src/infrastructure/persistence/content-drizzle-repository.ts)에 걸쳐 구현돼 있다.
- 검색 전용 dependency, DB column, FTS table 또는 검색용 index는 없다. 학습자는 발행 코스 배열을 메모리에서 부분 문자열로 거르고, 관리자는 parameterized `LIKE` 조건으로 조회한다. 따라서 migration, seed, package manifest와 lockfile은 변경하지 않는다.
- “전체 제거”는 두 코스 목록의 텍스트 검색을 뜻하는 것으로 해석한다. 이는 사용자 표현과 현재 두 구현을 함께 본 **범위 판단**이며, 사용자·레슨 분석 검색이나 학습 콘텐츠가 가르치는 정보 검색까지 없애야 한다는 증거는 없다.

## 포함과 제외

### 포함

- 학습자 `/app/courses`의 검색 입력, 300ms debounce, 지우기 행동, `query` URL 상태와 검색 결과 문구
- 관리자 코스 목록의 검색 입력·제출, `query` URL 상태와 제목·설명 검색
- 두 코스 목록 API의 `query` parameter, 내부 query type, cursor fingerprint와 filtering 조건
- 관련 제품·디자인·엔지니어링 문서, 테스트, fixture와 코스 검색 Storybook 예제
- OpenAPI와 HTTP client 재생성 및 잔여 식별자 검사

### 제외

- 코스 카테고리, 관리자 상태 필터, page/page size, 학습자 cursor와 더 보기
- 관리자 사용자 검색과 레슨 분석 검색
- 인증·레슨 route의 `searchParams`, 일반 `URLSearchParams`와 SEO의 검색 노출
- 공유 `SearchIcon`, `Input`, `FilterToolbar`: 다른 기능이 계속 사용하므로 제거하지 않는다.
- 학습 콘텐츠와 연구 문서의 “정보 검색” 의미
- `docs/archive`의 과거 기록: 현재 사실의 권위 소스가 아니므로 역사를 다시 쓰지 않는다.

## 선택한 접근과 trade-off

| 대안                               | 장점                                                | 비용·위험                                                          | 판정 |
| ---------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------ | ---- |
| UI만 숨김                          | 가장 작은 단기 diff                                 | API·서버·테스트와 유지 비용이 남고 “전체 제거”를 충족하지 못함     | 제외 |
| `query`를 무시하는 호환 shim 유지  | 기존 URL과 client가 깨지지 않음                     | 사용되지 않는 계약과 분기를 보존해 기술 부채가 됨                  | 제외 |
| 제품부터 persistence까지 수직 제거 | 동작·계약·유지 비용이 일치하고 재도입 판단이 명확함 | pre-release client를 같은 변경에서 재생성해야 하는 breaking change | 채택 |

초기 출시 전이라는 전제는 사용자 요청에서 도출한 **추론**이다. 외부 소비자가 이미 이 API를 사용한다는 증거가 발견되면 바로 제거하지 않고 별도 호환성 결정이 필요하다. 현재 저장소 내부 소비자만 기준으로는 원자적 제거가 가장 단순하고 되돌리기 쉽다.

## 실행 계획

### 1. 제품과 화면 권위 문서를 먼저 정리한다

1. [학습자 코스 선택 유저 스토리](../../../docs/product/user-stories/platform/us-lrn-3-start-first-course.md)와 [학습자 코스 탐색 요구사항](../../../docs/product/requirements/platform/req-lrn-3-course-discovery.md)에서 검색 가치, 인수 기준, UI와 확인 절차를 제거한다.
2. [관리자 콘텐츠 운영 유저 스토리](../../../docs/product/user-stories/admin/us-adm-3-operate-content.md)와 [관리자 콘텐츠 운영 요구사항](../../../docs/product/requirements/admin/req-adm-3-content-operations.md)을 검색 없는 카테고리·상태·페이지 탐색 기준으로 바꾼다.
3. [학습자 코스 목록 화면](../../../docs/design/screens/SCR-004-learner-courses.md)과 [관리자 코스 목록 화면](../../../docs/design/screens/SCR-103-admin-courses.md)에서 검색 입력, `query`, 검색 결과 문구와 레이아웃을 제거한다.
4. 다른 현재 제품 문서에 중복된 `코스 검색` 비범위 문구와 [프론트엔드 가이드](../../../docs/engineering/frontend-development.md)의 관리자 코스 검색 서술을 정리한다. 파일이나 화면 목록은 바뀌지 않으므로 product·design·engineering 인덱스 구조는 유지한다.

### 2. 공개 계약과 서버 책임을 제거한다

1. 학습자 `learnerCourseListQuerySchema`와 관리자 `adminCoursesQuerySchema`에서 `query`를 삭제한다.
2. `LearnerCourseReadQuery`, `ReadContentCoursesInput`과 앱이 생성 client에서 유도하는 코스 목록 입력 타입에서 `query`를 삭제한다.
3. 학습자 HTTP mapper의 decode·cursor fingerprint에서 검색어를 제거하되 category와 cursor 결합은 유지한다.
4. 학습자 repository의 제목·설명·카테고리 부분 문자열 filtering과 관리자 repository의 `lower(...) LIKE` 조건을 삭제한다. 이때만 쓰이던 normalization, `or` import와 지역 변수를 함께 제거한다.
5. API OpenAPI와 Orval client/MSW 코드를 canonical 생성 명령으로 다시 만든다. `.generated`는 파생 산출물이므로 수동 편집하거나 Git에 추가하지 않는다.

### 3. 학습자 코스 화면을 단순화한다

1. 코스 URL parser와 route에서 `query`를 제거하고 category만 API와 화면에 전달한다.
2. `CourseCatalogClient`에서 검색 입력, `SearchIcon`·`XIcon`, 검색어 state/ref, debounce effect와 검색 URL 조립을 제거한다.
3. category 전환과 더 보기 요청에는 category·cursor만 보존한다.
4. 빈 상태를 `전체 코스 없음`과 `선택한 카테고리에 코스 없음`으로만 구분하고 초기화 행동은 category 초기화 의미로 바꾼다.
5. 검색에 결합된 테스트를 삭제하거나 category, 더 보기, 인증·오류 같은 남은 관찰 가능 동작의 테스트로 축소한다. 단순히 삭제된 input의 부재만 고정하는 새 테스트는 만들지 않는다.

### 4. 관리자 코스 화면과 Storybook을 정리한다

1. 관리자 URL parser와 화면 입력 타입에서 `query`를 제거한다.
2. 검색 field, 아이콘, input과 검색 submit 버튼을 제거한다. category·status select의 자동 적용, page size와 pagination은 유지한다.
3. pagination link에서 검색어 전달을 없애고 빈 결과·header 문구를 남은 필터 의미에 맞춘다.
4. 관리자 filter·화면 테스트 fixture와 assertion을 줄이고 category·status·page 상태 보존 및 코스 생성·보관 회귀를 유지한다.
5. [관리자 패턴 Storybook](../../../apps/storybook/src/stories/components/admin-patterns.stories.tsx)의 코스 검색 예제를 검색 없는 코스 필터 예제로 바꾼다. 일반 input·검색 Story와 사용자·분석 검색 예제는 건드리지 않는다.

### 5. 잔여물과 회귀를 검증한다

1. 생성 후 learner `GET /courses`와 admin `GET /api/admin/courses`의 OpenAPI parameter 및 generated client 입력에 `query`가 없는지 확인한다.
2. 코스 검색 전용 문구와 식별자(`코스 검색`, `학습자 코스 검색`, `course-query`, `filters.query`, `normalizedQuery`, 코스 조회의 `queryCondition`)를 현재 권위 문서와 두 course-catalog 수직 경계에서 `rg`로 검사한다.
3. category, status, pagination, cursor와 더 보기 요청이 검색 제거 뒤에도 같은 정렬과 범위를 유지하는지 관련 workspace 테스트로 확인한다.
4. `bun run generate`, 관련 workspace 테스트, `bun lefthook run pre-commit`, `bun run typecheck`, `bun run build`를 순서대로 실행한다. 교차 package 계약 변경이므로 최종적으로 전체 `bun run test`도 통과시킨다.
5. `ENABLE_TEST_AUTH=true` 로컬 환경에서 학습자 코스 category 전환·더 보기와 관리자 category/status/page 전환·생성·보관을 브라우저 smoke로 확인한다. 기존 `?query=...` URL이 검색 UI나 검색 결과를 복원하지 않는지도 확인한다.

## 구현과 검증 결과

- 제품·디자인·엔지니어링 문서부터 learner/admin 계약, 애플리케이션 입력, HTTP mapper, repository, 웹 화면, 테스트와 Storybook까지 코스 검색 전용 입력·상태·분기를 제거했다.
- OpenAPI와 HTTP client를 재생성해 두 코스 목록 parameter에 `query`가 없음을 확인했고, 코스 검색 전용 식별자와 문구의 현재 경계 `rg` 검사 및 `git diff --check`가 통과했다.
- `bun run generate`, `bun run test`, `bun lint`, `bun typecheck`, `bun run format:check`, `bun lefthook run pre-commit`이 통과했다.
- production HTTPS 조건을 만족하는 검증용 content asset URL을 주입한 `bun run build`가 API, learner web, admin web과 Storybook에서 통과했다.
- 정적 Storybook의 관리자 코스 패턴을 Chromium으로 열어 검색 입력 없이 상태 필터와 코스 목록이 노출되는 접근성 tree를 확인했다.
- `bun run test:storybook`은 변경한 스토리를 포함한 다수의 기존 스토리에서 React `Invalid hook call`로 실패했다. 실패 stack이 잠금 파일의 Base UI 1.6이 아닌 `node_modules`의 Base UI 1.4 경로를 선택하고 기존 HEAD 스토리도 같은 `Button` 경로를 사용하는 것까지는 **확인된 사실**이다. 중복 React를 선택하는 정확한 원인은 이번 작업 범위를 벗어난 별도 조사 대상이라는 판단은 **추론**이다.
- `bun run test:e2e:pr`은 코스 화면 진입 전에 로그인 helper의 `getByLabel("비밀번호")`가 password input과 “비밀번호 표시” button을 함께 선택하는 오류 및 기존 CSP console 진단으로 실패했다. 따라서 학습자 실제 화면과 기존 `?query=...` URL의 브라우저 smoke는 완료하지 못했다.
- dependency, lockfile과 DB schema는 변경하지 않았다. 실행한 Storybook, Playwright, fixture 프로세스는 모두 종료했다.

## 위험과 통제

| 위험                                                    | 통제                                                                                                                                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| optional API parameter 제거로 기존 client가 영향을 받음 | 출시 전 원자적 계약 변경으로 처리하고 OpenAPI·client를 같은 변경에서 재생성한다. 외부 client가 확인되면 구현을 중단하고 호환성 계획을 분리한다.                                                        |
| 검색 제거 중 category/status/page까지 함께 깨짐         | 입력 타입을 검색 field만 삭제하고 남은 filter·cursor 테스트와 browser smoke를 유지한다.                                                                                                                |
| cursor가 과거 검색 fingerprint에 묶여 무효화됨          | cursor는 일시적 조회 토큰이므로 새 category-only fingerprint로 재발급한다. 배포 전 cursor 지속성 보장은 두지 않는다.                                                                                   |
| 공유 검색 UI까지 과도하게 삭제함                        | 사용처를 다시 검사하고 코스 전용 import·문구만 제거한다. 사용자·분석 검색 소비자가 남는 공유 코드는 유지한다.                                                                                          |
| 미래 코스 증가 시 탐색성이 낮아짐                       | 실제 코스 수, 탐색 실패와 category 사용 데이터를 근거로 새 요구사항을 승인한 뒤 재도입한다. 당시에는 현재의 메모리 scan·부분 `LIKE`를 복원하지 않고 규모와 언어 요구에 맞는 검색 경계를 다시 설계한다. |

## 완료 조건

- 현재 제품·디자인·엔지니어링 권위 문서에 코스 검색을 제공한다는 기준이 없다.
- 학습자와 관리자 코스 화면에 검색 입력·검색 결과 상태·검색 URL 상태가 없다.
- learner/admin 코스 목록 OpenAPI, 생성 client, 내부 타입과 repository에 검색어 입력이나 filtering 분기가 없다.
- 전용 테스트·fixture·Storybook 문구와 dead import가 남지 않는다.
- category·status·page size·pagination·cursor·더 보기·생성·보관 동작이 유지된다.
- dependency와 DB schema는 불필요하게 변경되지 않는다.
- 생성, 전체 정적 검사, 테스트, typecheck, build와 browser smoke가 통과한다.
- 구현과 검증 결과를 반영한 뒤 이 작업 디렉터리를 같은 이름의 `docs/archive`로 이동하고 `docs/work/_index.md`를 갱신한다.
