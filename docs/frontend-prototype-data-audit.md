# 프론트엔드 프로토타입 데이터 참조 조사

## 2026-05-27 조사 시작

- 범위는 `apps/web/src`로 한정하고 `/prototype` 디렉터리는 제외했다.
- 목표는 화면이 실제 API 데이터가 아니라 로컬 정적 데이터, fake API, mock 응답, 프로토타입 카탈로그를 바라보는 지점을 찾는 것이다.
- 테스트 파일의 fixture 사용은 제품 런타임 영향과 분리해 판단했다.

## 2026-05-31 최신 상태

- 제품 실행 경로의 runtime fake 모드는 제거되었다.
- `getServerWritingAppApi`와 `getBrowserWritingAppApi`는 항상 HTTP 어댑터를 생성하며, `WEB_API_MODE`와 `NEXT_PUBLIC_API_MODE`를 읽지 않는다.
- `apps/web/src/lib/api/api-mode.ts`와 `apps/web`의 `dev:fake` 스크립트는 제거되었다.
- 코스 상세 metadata와 레슨 기본 ID fallback은 로컬 카탈로그를 참조하지 않는다.
- `/app/profile`, `WritingAppApi.getProfile`, `WritingAppApi.searchCourses`, 공개 코스 검색 API 의존성은 제거되었다.
- 레거시 `/home`, `/courses`, `/courses/[id]`, `/lesson` 리다이렉트 route는 제거되었다.
- 레슨 UI의 생명, XP, 연속 학습, 색종이, 공유 문구, 완료 통계는 더 이상 렌더링하지 않는다.
- fake 어댑터와 정적 카탈로그는 테스트에서 명시적으로 import해 사용하는 격리 도구로만 남아 있다.

## 2026-06-15 코스 이미지와 hydration 보정 조사 시작

- 웹 앱의 코스 목록과 코스 상세 이미지는 외부 랜덤 이미지 서비스가 아니라 `public/course-thumbnails`의 로컬 정적 썸네일을 사용하도록 점검한다.
- 루트 레이아웃에서 inline style을 전역으로 재작성하는 hydration 보정 컴포넌트를 제거하고, 실제 불일치 원인을 코드 경계 안에서 해결한다.

## 2026-06-15 코스 이미지와 hydration 보정 완료

- 코스 이미지 URL helper는 코스 ID를 로컬 `public/course-thumbnails` asset 경로로 매핑하고, 알 수 없는 코스는 기본 로컬 썸네일로 대체한다.
- 코스 목록과 코스 상세 화면은 `next/image`를 사용해 로컬 썸네일을 렌더링한다.
- 루트 레이아웃에서 body 전체 inline style을 재작성하던 전역 hydration 보정 컴포넌트를 제거했다.

## 2026-05-27 조사 결과

### API 모드 기본값

- 당시 `apps/web/src/lib/api/get-server-writing-app-api.ts`는 `WEB_API_MODE`가 없으면 fake 어댑터를 반환했다.
- 당시 `apps/web/src/lib/api/get-browser-writing-app-api.ts`는 `NEXT_PUBLIC_API_MODE`가 없으면 fake 어댑터를 반환했다.
- 따라서 실제 API 서버가 떠 있어도 두 환경 변수를 모두 `http`로 지정하지 않으면 서버 렌더링 데이터나 브라우저 mutation 중 일부가 fake 데이터로 흐를 수 있었다.
- 특히 `WEB_API_MODE`가 fake이면 `/app` 보호 layout의 현재 사용자 조회도 fake 사용자로 성공했다.

### 홈

- `apps/web/src/app/app/page.tsx`는 API를 호출하지 않고 `HomePage`만 렌더링한다.
- `apps/web/src/features/home/home-page.tsx`는 `inProgressCourses`를 직접 import해 진행 중인 코스 수, 카드, 레슨 상태를 렌더링한다.
- `apps/web/src/features/home/home-data.ts`에는 진행률과 완료 레슨이 포함된 정적 코스 3개가 들어 있다.
- 이 때문에 새 사용자도 저장된 학습 진행과 무관하게 진행 중인 코스가 있는 것처럼 보인다.

### 코스 목록

- `apps/web/src/app/app/courses/page.tsx`는 `getServerWritingAppApi().listCourseCategories()`를 사용한다.
- 현재는 항상 HTTP API 데이터를 사용한다. 2026-05-27 당시 서버 API 모드 기본값이 fake라면 `apps/web/src/lib/api/fake/create-fake-writing-app-api.ts`가 `courseCategories`를 반환했다.
- fake 데이터 원본은 `apps/web/src/features/courses/course-data.ts`다.

### 코스 상세

- `apps/web/src/app/app/courses/[id]/page.tsx`의 본문 렌더링은 `getServerWritingAppApi().getCourseDetail()`을 사용한다.
- 현재 `generateStaticParams`는 빈 배열을 반환하고, `generateMetadata`는 API의 `getCourseDetail` 결과를 사용한다.
- 2026-05-27 당시 같은 파일의 `generateStaticParams`와 `generateMetadata`는 `apps/web/src/features/courses/course-detail-data.ts`의 `getCourseDetailStaticParams`, `getCourseDetailById`를 직접 사용했다.
- 당시 fake 모드에서는 코스 상세 본문과 진행률도 `course-detail-data.ts`의 `courseDetails`와 그 안의 완료 상태 계산값을 사용했다.

### 레슨

- `apps/web/src/app/app/lesson/page.tsx`의 본문 렌더링은 `getServerWritingAppApi().getLesson()`을 사용한다.
- 현재 `lesson_id` 쿼리가 없으면 not found로 처리하며, 로컬 기본 레슨 ID를 사용하지 않는다.
- `lesson-data.ts`는 `course-detail-data.ts`의 `courseDetails`를 기반으로 전체 레슨 카탈로그를 생성한다.
- fake 어댑터를 직접 사용하는 테스트에서는 레슨 조회, 레슨 진행 초기값, 레슨 완료의 마지막 스텝 계산이 모두 이 로컬 레슨 카탈로그를 기준으로 동작한다.

### 레슨 저장, 답변 저장, 완료, AI 피드백

- `apps/web/src/features/lessons/lesson-page.tsx`는 `LessonExperience`에 API를 주입하지 않는다.
- `LessonExperience`는 브라우저에서 `getBrowserWritingAppApi()`를 직접 만들고, 현재는 항상 HTTP 어댑터를 사용한다.
- fake 어댑터의 레슨 진행과 답변은 브라우저 메모리 `Map`에만 저장된다.
- fake 어댑터의 AI 피드백은 `apps/web/src/features/lessons/lesson-logic.ts`의 `getMockAiFeedback()` 결과를 사용한다.
- fake 어댑터는 제품 런타임에서 선택되지 않으므로, 서버 조회와 브라우저 mutation의 데이터 소스가 API 모드 환경 변수 불일치로 갈라지지 않는다.

### 프로필

- 2026-05-31 BSSN 6순위 단순화로 `/app/profile` 페이지와 `getProfile` API 포트를 제거했다.
- 학습 현황은 홈과 코스 상세의 진행 정보로만 노출한다.

### 매퍼와 타입 경계의 런타임 결합

- `apps/web/src/features/lessons/lesson-api-mappers.ts`는 ID 브랜딩 함수만 쓰기 위해 `lesson-data.ts`를 런타임 import한다.
- 이 import는 실제 API 응답 매핑 시에도 로컬 레슨 카탈로그 생성 코드가 모듈 평가되는 구조다.
- `apps/web/src/features/courses/course-api-mappers.ts`도 `courseId`를 쓰기 위해 `course-data.ts`를 런타임 import한다.
- 현재 결과값은 API DTO를 기준으로 만들지만, ID helper와 프로토타입 데이터가 같은 모듈에 있어 실제 API 경로와 로컬 카탈로그의 결합이 남아 있다.

## 전환 우선순위

1. `/app` 홈을 `/progress` 기반 실제 사용자 진행 목록으로 바꾸고, 빈 진행 목록 화면을 추가한다.
2. `WritingAppApi`에 진행 목록 조회 포트를 추가해 서버 홈에서 사용한다.
3. 완료: 제품 runtime fake 모드를 제거해 서버와 브라우저 API 모드가 불일치할 수 없게 했다.
4. 완료: 코스 상세 metadata와 static params를 로컬 상세 데이터에서 분리했다.
5. `courseId`, `lessonId`, `lessonStepId` 같은 브랜드 helper를 데이터 파일에서 분리해 API 매퍼가 프로토타입 카탈로그를 런타임 import하지 않게 한다.
6. 완료: fake 어댑터는 테스트용으로 유지하고, 백엔드 없는 제품 개발 실행 모드는 제거했다.

## 2026-05-27 조사 완료

- 제품 런타임에서 직접 프로토타입 데이터를 렌더링하는 확정 지점은 홈 화면이다.
- 실제 API 모드에서도 남는 직접 정적 참조는 코스 상세 metadata/static params와 레슨 기본 ID 선택이다.
- API 포트 경유 화면은 환경 변수 기본값 때문에 fake 데이터를 볼 수 있으며, 서버와 브라우저 모드가 따로 설정되어 불일치할 수 있다.
- fake 어댑터는 코스, 코스 상세, 레슨, 진행 저장, 답변 저장, 완료, AI 피드백까지 대부분의 학습 흐름을 로컬 데이터와 메모리 상태로 대체한다.

## 2026-05-27 API 모드 실제 데이터 전환 완료

- `/app` 홈은 `WritingAppApi.listProgress()`로 백엔드 `/progress`를 조회한 뒤 각 코스 상세를 API에서 가져와 렌더링한다.
- 진행 목록이 비어 있으면 정적 코스 대신 빈 상태를 보여준다.
- 당시 서버와 브라우저 API 모드 판정은 `apps/web/src/lib/api/api-mode.ts`로 분리했다.
- 당시 코스 상세의 `generateStaticParams`와 fake metadata는 fake 모드에서만 로컬 코스 상세 데이터를 동적 import했다.
- 당시 API 모드의 코스 상세 metadata는 백엔드 `getCourseDetail` 결과로 만들었다.
- 레슨 라우트는 API 모드에서 `lesson_id`가 없으면 로컬 기본 레슨을 쓰지 않고 not found로 처리한다.
- `courseId`, `lessonId`, `lessonStepId` helper를 로컬 데이터 파일에서 분리해 API 매퍼가 프로토타입 카탈로그를 런타임 import하지 않게 했다.
- 당시 API 클라이언트 factory는 fake 어댑터를 정적 import하지 않고, fake 모드에서만 동적 import했다.
- 당시 fake 어댑터는 백엔드 없는 개발 경험을 위해 별도 `home-fake-data.ts`와 기존 로컬 카탈로그를 계속 사용했다.

## 2026-05-31 runtime fake 모드 제거 완료

- 웹 API factory는 서버와 브라우저 모두 HTTP 어댑터만 생성한다.
- 레거시 `WEB_API_MODE`, `NEXT_PUBLIC_API_MODE` 값이 설정되어도 factory는 fake 어댑터로 전환하지 않는다.
- `apps/web/src/lib/api/api-mode.ts`와 `dev:fake` 스크립트를 제거했다.
- 코스 상세 `generateStaticParams`는 빈 배열을 반환하고, metadata는 백엔드 API 조회 결과로만 만든다.
- 레슨 라우트의 `lesson_id` 누락 fallback을 제거해 제품 런타임이 로컬 기본 레슨을 선택하지 않게 했다.
