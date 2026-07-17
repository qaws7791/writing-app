# IA 명세

이 문서는 정보 구조, 라우팅 계층, 네비게이션 구조의 단일 진실 원천이다.

## 앱 구조

```text
writing-app
  학습자 웹 apps/web
    공개 영역
    보호된 학습 영역
    몰입형 레슨 영역
  어드민 웹 apps/admin
    관리자 로그인
    운영 콘솔
```

target 구성에서 학습자 웹과 어드민 웹은 각각의 public API Host를 통해 하나의 `apps/api` 안 learner/admin Host sub-app을 호출한다. `apps/api`는 content·identity·dashboard/analytics·settings·AI chat·자료실의 여섯 관리자 capability route·adapter를 소유한다.

로컬 `bun run dev:admin`은 어드민 웹과 `apps/api`를 시작하고 관리자 API는 `admin-api.localhost:4000` Host로 접근한다. Compose/Caddy source도 admin public Host를 같은 통합 API로 전달한다.

## 학습자 라우트

```text
/
/login
/app
/app/courses
/app/courses/[id]
/app/lesson?lesson_id=...
/app/profile
[404 Not Found] (정의되지 않은 모든 경로)
```

### `/`

공개 랜딩이다. 제품 가치, 학습 방식, CTA를 제공한다.

### `/login`

학습자 로그인이다. Google 인증을 사용하며 성공 후 `next` 또는 `/app`으로 이동한다.

### `/app`

학습 홈이다. 진행 중 코스, 다음 레슨, 연속 학습일, 완료 레슨 수를 보여준다.

### `/app/courses`

코스 탐색이다. 카테고리와 코스 카드를 제공한다.

### `/app/courses/[id]`

코스 상세다. 코스 설명, 진행률, 다음 레슨 CTA, 유닛별 커리큘럼을 제공한다.

### `/app/lesson?lesson_id=...`

몰입형 레슨이다. `lesson_id` query가 필요하다. 글로벌 nav를 숨기고 레슨 shell을 사용한다.

### `/app/profile`

프로필이다. 사용자 정보, 학습 요약, 테마 전환, 로그아웃을 제공한다.

### 404 (Not Found)

정의되지 않은 모든 경로로 접근 시 표시되는 공통 에러 페이지이다. 현재 접속을 시도한 URL 경로에 따라 복귀 링크를 다르게 제공한다:

- `/app`으로 시작하는 경로의 404: "대시보드로 돌아가기" (`/app` 이동)
- 그 외의 경로의 404: "홈으로 돌아가기" (`/` 이동)

## 학습자 네비게이션

데스크톱:

```text
글결. | 홈 | 배우기 | 프로필 메뉴
```

모바일:

```text
하단 nav: 홈 | 배우기 | 프로필
```

활성 상태:

- `/app`은 홈만 활성화한다.
- `/app/courses`와 `/app/courses/[id]`는 배우기를 활성화한다.
- `/app/profile`은 프로필을 활성화한다.
- `/app/lesson`은 몰입형 화면이므로 글로벌 nav를 렌더링하지 않는다.

## 어드민 라우트

```text
/login
/
/dashboard
/courses
/courses/[id]
/users
/users/[id]
/analytics
/resources
/resources/[id]
/resources/trash
/settings
```

`/`는 현재 대시보드 역할을 한다. 문서와 화면에서 `/dashboard`가 병기될 수 있으나, 현재 구현된 주 운영 진입점은 `/`이다.

### `/login`

관리자 로그인이다. 아이디/패스워드 기반 인증을 사용한다.

### `/` 또는 `/dashboard`

운영 대시보드다. 총 사용자, 최근 활성, 가입, 완료 레슨, 콘텐츠 상태, 최근 활동을 보여준다.

### `/courses`

콘텐츠 관리다. 코스 검색, 카테고리 필터, 페이지 크기, 새 코스, 보관을 제공한다.

### `/courses/[id]`

코스 편집이다. 코스 정보, 커리큘럼 맵, 레슨 작업대, 스텝 작업대, 저장 상태, 학습자 미리보기를 표시한다.

### `/users`

사용자 관리다. 검색, 상태 필터, 정렬, 목록, 정지, 삭제 요청 처리를 제공한다.

### `/users/[id]`

사용자 상세다. 가입일, 최근 접속, 완료 레슨, 전체 진도, 상태 변경을 보여준다.

### `/analytics`

분석이다. 가입/완료 추이, 연속 학습일 분포, 레슨별 완료율과 이탈률을 보여준다.

### `/resources`

관리자 자료실이다. 왼쪽 자료 트리, 전역 검색, 새 폴더·문서 생성, Markdown 가져오기를 제공한다. 문서를 선택하지 않은 상태에서는 최근 문서 목록 없이 선택 안내와 새 문서 행동을 표시한다.

### `/resources/[id]`

자료 문서 편집이다. 공통 자료 트리와 breadcrumb, 제목, 동기화 상태, Lexical GFM 편집기를 표시한다.

### `/resources/trash`

자료실 휴지통이다. 직접 휴지통으로 이동한 최상위 폴더와 문서를 표시하고 전체 하위 트리 복원을 제공한다.

### `/settings`

운영 설정이다. 배너, 공지, 약관, 개인정보처리방침, 콘텐츠 초기화를 관리한다.

## 어드민 네비게이션

사이드바 메뉴:

```text
글결 관리자
  대시보드 -> /
  콘텐츠 관리 -> /courses
  사용자 관리 -> /users
  분석 -> /analytics
  자료실 -> /resources
  운영 설정 -> /settings
```

활성 상태는 현재 경로가 메뉴 href와 같거나 해당 href로 시작할 때 적용한다. 단 `/`는 정확히 `/`일 때만 활성화한다.

정식 어드민 내비게이션은 데스크톱 또는 노트북 화면의 사이드바를 기준으로 한다. 모바일 전용 어드민 상단 bar나 탭 내비게이션은 제품 범위에 포함하지 않는다.

## 사이트맵

```text
공개
  랜딩 /
  로그인 /login
  404 Not Found (정의되지 않은 경로)

학습자 앱
  홈 /app
  코스 목록 /app/courses
    코스 상세 /app/courses/[id]
      레슨 /app/lesson?lesson_id=...
  프로필 /app/profile

어드민
  로그인 /login
  대시보드 /
  콘텐츠 관리 /courses
    코스 편집 /courses/[id]
  사용자 관리 /users
    사용자 상세 /users/[id]
  분석 /analytics
  자료실 /resources
    자료 편집 /resources/[id]
    휴지통 /resources/trash
  운영 설정 /settings
```

학습자와 어드민은 별도 Next.js 앱이므로 같은 `/login` 경로를 각 앱 컨텍스트에서 해석한다.
