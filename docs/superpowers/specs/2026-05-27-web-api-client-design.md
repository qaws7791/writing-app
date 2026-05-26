# 웹 API 클라이언트 설계

## 배경

현재 백엔드는 `apps/api`에서 Hono 기반 OpenAPI 3.1 문서를 제공하고, `apps/docs/openapi/writing-app-api.json`로 정적 산출물을 생성한다. 프론트엔드 `apps/web`는 코스, 코스 상세, 레슨 화면을 정적 데이터 파일에서 조립한다. `FRONTEND.md`는 API 계약 우선, 생성 타입 분리, 교체 가능한 API 클라이언트 포트, 백엔드 없이 테스트 가능한 외부 어댑터 격리를 이미 원칙으로 정하고 있다.

이번 설계의 목적은 `openapi-typescript`로 API 계약 타입을 생성하고, `openapi-fetch`로 실제 HTTP 어댑터를 만들며, 프론트 화면은 동일한 포트를 통해 HTTP 어댑터와 fake 어댑터를 바꿔 사용할 수 있게 하는 것이다.

## 공식 문서 확인

- `openapi-fetch`는 `openapi-typescript`가 생성한 `paths` 타입을 `createClient<paths>()`에 전달해 경로, 파라미터, 요청 본문, 응답 타입을 추론한다.
- `openapi-fetch`의 `createClient`는 `baseUrl`, 커스텀 `fetch`, 표준 fetch 옵션을 받을 수 있다.
- 테스트에서는 `fetch` 옵션에 spy를 주입하거나 MSW를 사용해 요청과 응답을 격리할 수 있다.
- middleware는 요청, 응답, fetch 오류 처리를 공통화할 수 있지만, 첫 구현에서는 쿠키 인증을 위한 `credentials: "include"`와 명시적 응답 매핑만 사용한다.

## 목표

- `apps/docs/openapi/writing-app-api.json`에서 프론트용 OpenAPI 타입을 생성한다.
- 프론트 화면은 생성 타입과 `openapi-fetch`를 직접 import하지 않는다.
- 실제 HTTP 어댑터와 백엔드 없는 fake 어댑터가 같은 `WritingAppApi` 포트를 구현한다.
- 코스 목록, 코스 상세, 레슨 상세는 API 기반 데이터로 전환하되 fake 어댑터로 기존 정적 화면 테스트가 유지된다.
- 학습 진행, 답변 저장, 레슨 완료, AI 피드백은 레슨 클라이언트 컴포넌트에서 호출 가능한 애플리케이션 서비스로 분리한다.
- 인증이 필요한 API는 쿠키 기반 요청을 전제로 `credentials: "include"`를 사용한다.

## 제외 범위

- 백엔드 API 계약 변경은 포함하지 않는다.
- Better Auth 로그인 UI 전체 구현은 포함하지 않는다.
- TanStack Query 도입은 포함하지 않는다. 현재 앱은 의존성이 없고, 첫 연결은 서버 컴포넌트 조회와 클라이언트 컴포넌트 내부 mutation 호출로 충분하다.
- 별도 `packages/api-client` 패키지는 만들지 않는다. 현재 소비자가 `apps/web` 하나뿐이므로 앱 내부 경계로 시작한다.
- MSW 도입은 첫 구현에 포함하지 않는다. fake 어댑터와 주입 fetch 테스트로 백엔드 격리를 달성한다.

## 접근 대안

### 대안 A: `apps/web` 내부 포트와 두 어댑터

`apps/web/src/lib/api`에 생성 타입, API 포트, HTTP 어댑터, fake 어댑터를 둔다. 화면은 포트만 사용한다. 기존 정적 데이터는 fake 어댑터의 seed로 재사용한다.

장점은 변경 범위가 작고 현재 앱 구조에 맞으며, 백엔드 없이 테스트 가능한 요구를 가장 직접적으로 만족한다. 단점은 다른 앱이 같은 클라이언트를 쓰게 되는 시점에 패키지 추출 작업이 추가된다는 점이다.

### 대안 B: `packages/api-client` 패키지 생성

OpenAPI 타입과 HTTP 클라이언트를 별도 패키지로 만든다. 앱은 패키지를 import한다.

장점은 재사용성이 좋고 모노레포 경계가 명확하다. 단점은 현재 소비자가 하나뿐인데 패키지 exports, 빌드, 테스트 설정까지 늘어나 초기 복잡도가 크다.

### 대안 C: 화면에서 `openapi-fetch` 직접 사용

각 페이지와 컴포넌트가 생성 타입 기반 클라이언트를 직접 호출한다.

장점은 빠르다. 단점은 생성 타입이 UI에 퍼지고, fake 전환이 어려워지며, `FRONTEND.md`의 API 포트 원칙과 어긋난다.

## 권장안

대안 A를 채택한다. 첫 소비자는 `apps/web` 하나이고, 핵심 요구는 백엔드 없는 테스트 가능성이다. 앱 내부에 포트와 어댑터를 두면 변경 범위를 좁게 유지하면서도 재사용 요구가 실제로 생겼을 때 `packages/api-client`로 옮길 수 있다.

## 구조

```text
apps/web/src/lib/api/
  api-error.ts
  api-result.ts
  get-browser-writing-app-api.ts
  get-server-writing-app-api.ts
  writing-app-api.ts
  generated/
    writing-app-api.d.ts
  http/
    create-http-writing-app-api.ts
    openapi-client.ts
  fake/
    create-fake-writing-app-api.ts
```

```text
apps/web/src/features/courses/
  course-api-mappers.ts
  course-data.ts
  course-detail-data.ts
```

```text
apps/web/src/features/lessons/
  lesson-api-mappers.ts
  lesson-data.ts
  lesson-experience.tsx
```

`lib/api`는 외부 연결 경계다. `features`는 생성 타입을 직접 알지 않고 내부 모델과 mapper만 사용한다. `fake` 어댑터는 기존 정적 데이터와 동일한 내부 모델을 반환해 UI 테스트와 로컬 개발을 백엔드에서 분리한다.

## API 포트

첫 구현의 포트는 화면 연결에 필요한 메서드만 제공한다.

```ts
export interface WritingAppApi {
  listCourseCategories(): Promise<ApiResult<readonly CourseCategory[]>>
  searchCourses(query: string): Promise<ApiResult<readonly Course[]>>
  getCourseDetail(courseId: CourseId): Promise<ApiResult<CourseDetail>>
  getLesson(lessonId: LessonId): Promise<ApiResult<Lesson>>
  getCurrentUser(): Promise<ApiResult<CurrentUser>>
  getProfile(): Promise<ApiResult<ProfileSummary>>
  getCourseProgress(courseId: CourseId): Promise<ApiResult<CourseProgress>>
  getLessonProgress(lessonId: LessonId): Promise<ApiResult<LessonProgress>>
  saveLessonProgress(
    lessonId: LessonId,
    input: SaveLessonProgressInput
  ): Promise<ApiResult<LessonProgress>>
  saveLessonAnswer(
    lessonId: LessonId,
    input: SaveLessonAnswerInput
  ): Promise<ApiResult<{ saved: true }>>
  completeLesson(lessonId: LessonId): Promise<ApiResult<CompleteLessonResult>>
  createAiFeedback(
    input: CreateAiFeedbackInput
  ): Promise<ApiResult<AiFeedbackResult>>
}
```

결과 타입은 모호한 성공 플래그를 쓰지 않는다.

```ts
export type ApiResult<TValue> =
  | { status: "ok"; value: TValue }
  | { status: "error"; error: ApiError }
```

## HTTP 어댑터

HTTP 어댑터는 `openapi-fetch`만 알고 있다. `createClient<paths>()`는 `baseUrl`, `credentials: "include"`, 주입 가능한 `fetch`를 받는다. 각 메서드는 `data`를 내부 모델로 매핑하고, `error` 또는 네트워크 실패를 `ApiError`로 변환한다.

동적 경로는 `openapi-fetch` 타입 추론을 유지하기 위해 OpenAPI 문서의 literal path를 그대로 사용한다.

```ts
client.GET("/courses/{courseId}", {
  params: { path: { courseId } },
})
```

## Fake 어댑터

Fake 어댑터는 기존 `course-data.ts`, `course-detail-data.ts`, `lesson-data.ts`에서 가져온 데이터를 사용한다. 진행 상태와 답변은 factory 내부의 `Map`에 저장한다. 테스트마다 새 fake를 만들면 상태가 격리된다.

Fake 어댑터는 실제 백엔드와 동일하게 없는 코스/레슨에 대해 `status: "error"`를 반환한다. AI 피드백은 기존 `getMockAiFeedback()` 기반 응답을 새 `AiFeedbackResult` 내부 모델로 변환한다.

## Next.js 연결 방식

서버 컴포넌트는 `getServerWritingAppApi()`를 통해 API 포트를 얻는다. 이 factory는 서버 전용 환경 변수인 `WEB_API_MODE`, `WEB_API_BASE_URL`만 읽는다. 기본은 fake 어댑터이며, 백엔드 연동 검증 때 명시적으로 HTTP 어댑터를 선택한다.

클라이언트 컴포넌트인 `LessonExperience`는 서버에서 함수 prop을 받지 않는다. 레슨 페이지는 직렬화 가능한 초기 레슨 데이터만 전달한다. 저장, 완료, AI 피드백 같은 클라이언트 mutation은 `getBrowserWritingAppApi()`를 클라이언트 컴포넌트 내부에서 호출해 처리한다. 테스트는 `LessonExperience`를 직접 렌더링할 때 fake API를 prop으로 주입해 외부와 격리한다.

## 환경 변수

- `WEB_API_BASE_URL`: 서버에서 백엔드 API를 호출할 때 사용하는 URL. 예시는 `http://localhost:4000`.
- `NEXT_PUBLIC_API_BASE_URL`: 브라우저에서 인증 쿠키 포함 요청을 보낼 때 사용하는 URL. 예시는 `http://localhost:4000`.
- `WEB_API_MODE`: `http` 또는 `fake`. 서버 렌더링 데이터 소스를 고른다.
- `NEXT_PUBLIC_API_MODE`: `http` 또는 `fake`. 브라우저 mutation 데이터 소스를 고른다.

기본 로컬 개발값은 `fake`로 두어 백엔드 없이 웹 앱을 띄울 수 있게 한다. 백엔드 연동 검증 시 명시적으로 `http`를 선택한다.

## 오류 처리

`ApiError`는 인증, 찾을 수 없음, 검증 실패, 재시도 제한, 외부 서비스 불가, 네트워크 실패, 계약 위반을 구분한다.

```ts
export type ApiError =
  | { code: "unauthorized"; message: string }
  | { code: "not-found"; message: string }
  | { code: "invalid-request"; message: string }
  | { code: "retry-limit-exceeded"; message: string }
  | { code: "unavailable"; message: string }
  | { code: "network-error"; message: string }
  | { code: "contract-error"; message: string }
```

페이지 단위 조회에서 `not-found`는 `notFound()`로 연결한다. 인증 오류는 로그인 UI가 생기기 전까지 인증 필요 상태로 표현한다. AI 피드백과 저장 mutation 오류는 레슨 화면의 인라인 오류 상태로 표시한다.

## 테스트 전략

- API 타입 생성 스크립트는 OpenAPI JSON에서 `.d.ts`를 생성하는지 확인한다.
- HTTP 어댑터 테스트는 주입된 `fetch`로 요청 URL, method, body, credentials를 검증한다.
- fake 어댑터 테스트는 백엔드 없이 코스 조회, 레슨 조회, 진행 저장, 답변 저장, 완료, AI 피드백을 검증한다.
- mapper 테스트는 백엔드 DTO가 프론트 내부 모델로 변환되는지 검증한다.
- 페이지 테스트는 fake 어댑터로 렌더링 가능한 최소 경로를 검증한다.

## 검증 명령

```bash
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web api:generate
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web test
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web typecheck
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web lint
PATH="/Users/mac/.bun/bin:$PATH" bun --filter @workspace/web build
PATH="/Users/mac/.bun/bin:$PATH" bunx prettier --check docs/frontend-api-client.md docs/superpowers/specs/2026-05-27-web-api-client-design.md docs/superpowers/plans/2026-05-27-web-api-client.md
```

## 완료 기준

- `apps/web`가 백엔드 없이 fake 모드로 코스 목록, 코스 상세, 레슨 화면을 렌더링한다.
- HTTP 모드에서 공개 콘텐츠 API와 인증 필요 API 호출 함수가 타입 안전하게 컴파일된다.
- 생성 타입이 UI 컴포넌트로 퍼지지 않는다.
- fake 어댑터와 HTTP 어댑터 테스트가 외부 서버 없이 통과한다.
- OpenAPI 문서가 바뀌면 타입 생성 결과가 타입체크에서 영향을 드러낸다.
