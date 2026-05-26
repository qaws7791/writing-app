# 프론트엔드 프로토타입 데이터 참조 조사

## 2026-05-27 조사 시작

- 범위는 `apps/web/src`로 한정하고 `/prototype` 디렉터리는 제외했다.
- 목표는 화면이 실제 API 데이터가 아니라 로컬 정적 데이터, fake API, mock 응답, 프로토타입 카탈로그를 바라보는 지점을 찾는 것이다.
- 테스트 파일의 fixture 사용은 제품 런타임 영향과 분리해 판단했다.

## 조사 결과

### API 모드 기본값

- `apps/web/src/lib/api/get-server-writing-app-api.ts`는 `WEB_API_MODE`가 없으면 fake 어댑터를 반환한다.
- `apps/web/src/lib/api/get-browser-writing-app-api.ts`는 `NEXT_PUBLIC_API_MODE`가 없으면 fake 어댑터를 반환한다.
- 따라서 실제 API 서버가 떠 있어도 두 환경 변수를 모두 `http`로 지정하지 않으면 서버 렌더링 데이터나 브라우저 mutation 중 일부가 fake 데이터로 흐를 수 있다.
- 특히 `WEB_API_MODE`가 fake이면 `/app` 보호 layout의 현재 사용자 조회도 fake 사용자로 성공한다.

### 홈

- `apps/web/src/app/app/page.tsx`는 API를 호출하지 않고 `HomePage`만 렌더링한다.
- `apps/web/src/features/home/home-page.tsx`는 `inProgressCourses`를 직접 import해 진행 중인 코스 수, 카드, 레슨 상태를 렌더링한다.
- `apps/web/src/features/home/home-data.ts`에는 진행률과 완료 레슨이 포함된 정적 코스 3개가 들어 있다.
- 이 때문에 새 사용자도 저장된 학습 진행과 무관하게 진행 중인 코스가 있는 것처럼 보인다.

### 코스 목록

- `apps/web/src/app/app/courses/page.tsx`는 `getServerWritingAppApi().listCourseCategories()`를 사용한다.
- 실제 API 모드에서는 백엔드 데이터를 사용하지만, 서버 API 모드 기본값이 fake라면 `apps/web/src/lib/api/fake/create-fake-writing-app-api.ts`가 `courseCategories`를 반환한다.
- fake 데이터 원본은 `apps/web/src/features/courses/course-data.ts`다.

### 코스 상세

- `apps/web/src/app/app/courses/[id]/page.tsx`의 본문 렌더링은 `getServerWritingAppApi().getCourseDetail()`을 사용한다.
- 같은 파일의 `generateStaticParams`와 `generateMetadata`는 `apps/web/src/features/courses/course-detail-data.ts`의 `getCourseDetailStaticParams`, `getCourseDetailById`를 직접 사용한다.
- 실제 API 모드에서도 정적 params와 메타데이터는 로컬 코스 상세 데이터 기준으로 계산된다.
- fake 모드에서는 코스 상세 본문과 진행률도 `course-detail-data.ts`의 `courseDetails`와 그 안의 완료 상태 계산값을 사용한다.

### 레슨

- `apps/web/src/app/app/lesson/page.tsx`의 본문 렌더링은 `getServerWritingAppApi().getLesson()`을 사용한다.
- 다만 `lesson_id` 쿼리가 없을 때 기본 레슨 ID를 `apps/web/src/features/lessons/lesson-data.ts`의 `getDefaultLesson()`에서 가져온다.
- `lesson-data.ts`는 `course-detail-data.ts`의 `courseDetails`를 기반으로 전체 레슨 카탈로그를 생성한다.
- fake 모드에서는 레슨 조회, 레슨 진행 초기값, 레슨 완료의 마지막 스텝 계산이 모두 이 로컬 레슨 카탈로그를 기준으로 동작한다.

### 레슨 저장, 답변 저장, 완료, AI 피드백

- `apps/web/src/features/lessons/lesson-page.tsx`는 `LessonExperience`에 API를 주입하지 않는다.
- `LessonExperience`는 브라우저에서 `getBrowserWritingAppApi()`를 직접 만들고, 기본값이 fake인 경우 fake 어댑터를 사용한다.
- fake 어댑터의 레슨 진행과 답변은 브라우저 메모리 `Map`에만 저장된다.
- fake 어댑터의 AI 피드백은 `apps/web/src/features/lessons/lesson-logic.ts`의 `getMockAiFeedback()` 결과를 사용한다.
- 서버는 실제 API 모드이고 브라우저 환경 변수만 빠진 경우, 화면에 표시된 레슨은 실제 API에서 왔어도 저장, 완료, AI 피드백은 fake로 처리될 수 있다.

### 프로필

- `apps/web/src/app/app/profile/page.tsx`는 `getServerWritingAppApi().getProfile()`을 사용한다.
- 실제 API 모드에서는 백엔드 프로필 요약을 사용한다.
- fake 모드에서는 fake 어댑터가 완료 레슨 수를 메모리 진행 상태에서 계산하고, 진행 중인 코스 수를 `courseDetails.length`로 반환한다.

### 매퍼와 타입 경계의 런타임 결합

- `apps/web/src/features/lessons/lesson-api-mappers.ts`는 ID 브랜딩 함수만 쓰기 위해 `lesson-data.ts`를 런타임 import한다.
- 이 import는 실제 API 응답 매핑 시에도 로컬 레슨 카탈로그 생성 코드가 모듈 평가되는 구조다.
- `apps/web/src/features/courses/course-api-mappers.ts`도 `courseId`를 쓰기 위해 `course-data.ts`를 런타임 import한다.
- 현재 결과값은 API DTO를 기준으로 만들지만, ID helper와 프로토타입 데이터가 같은 모듈에 있어 실제 API 경로와 로컬 카탈로그의 결합이 남아 있다.

## 전환 우선순위

1. `/app` 홈을 `/progress` 기반 실제 사용자 진행 목록으로 바꾸고, 빈 진행 목록 화면을 추가한다.
2. `WritingAppApi`에 진행 목록 조회 포트를 추가해 서버 홈에서 사용한다.
3. `LessonPage` 또는 route에서 브라우저 mutation API를 명시적으로 주입하거나, 서버와 브라우저 API 모드가 불일치하지 않도록 환경 검사를 추가한다.
4. 코스 상세 metadata와 static params를 로컬 상세 데이터에서 분리하거나, 실제 API 기반 라우팅 전략으로 정리한다.
5. `courseId`, `lessonId`, `lessonStepId` 같은 브랜드 helper를 데이터 파일에서 분리해 API 매퍼가 프로토타입 카탈로그를 런타임 import하지 않게 한다.
6. fake 어댑터는 테스트와 백엔드 없는 개발 용도로 유지하되, 실제 API 모드 검증 문서와 실행 스크립트에서 `WEB_API_MODE`, `NEXT_PUBLIC_API_MODE`를 동시에 지정한다.

## 2026-05-27 조사 완료

- 제품 런타임에서 직접 프로토타입 데이터를 렌더링하는 확정 지점은 홈 화면이다.
- 실제 API 모드에서도 남는 직접 정적 참조는 코스 상세 metadata/static params와 레슨 기본 ID 선택이다.
- API 포트 경유 화면은 환경 변수 기본값 때문에 fake 데이터를 볼 수 있으며, 서버와 브라우저 모드가 따로 설정되어 불일치할 수 있다.
- fake 어댑터는 코스, 코스 상세, 레슨, 프로필, 진행 저장, 답변 저장, 완료, AI 피드백까지 대부분의 학습 흐름을 로컬 데이터와 메모리 상태로 대체한다.

## 2026-05-27 API 모드 실제 데이터 전환 완료

- `/app` 홈은 `WritingAppApi.listProgress()`로 백엔드 `/progress`를 조회한 뒤 각 코스 상세를 API에서 가져와 렌더링한다.
- 진행 목록이 비어 있으면 정적 코스 대신 빈 상태를 보여준다.
- 서버와 브라우저 API 모드 판정은 `apps/web/src/lib/api/api-mode.ts`로 분리했다.
- 코스 상세의 `generateStaticParams`와 fake metadata는 fake 모드에서만 로컬 코스 상세 데이터를 동적 import한다.
- API 모드의 코스 상세 metadata는 백엔드 `getCourseDetail` 결과로 만든다.
- 레슨 라우트는 API 모드에서 `lesson_id`가 없으면 로컬 기본 레슨을 쓰지 않고 not found로 처리한다.
- `courseId`, `lessonId`, `lessonStepId` helper를 로컬 데이터 파일에서 분리해 API 매퍼가 프로토타입 카탈로그를 런타임 import하지 않게 했다.
- API 클라이언트 factory는 fake 어댑터를 정적 import하지 않고, fake 모드에서만 동적 import한다.
- fake 어댑터는 기존 개발 경험을 위해 별도 `home-fake-data.ts`와 기존 로컬 카탈로그를 계속 사용한다.
