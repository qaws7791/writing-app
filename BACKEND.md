# 백엔드 개발 가이드

## 아키텍처

백엔드는 모듈러 모놀리스로 구성한다. 런타임은 하나의 API 프로세스로 시작하지만, 도메인 규칙, 데이터 접근, 로깅, 프로세스 조립 책임을 패키지 단위로 분리한다. 첫 번째 백엔드 슬라이스는 작성된 학습 콘텐츠 조회만 다루며 인증, 진행 상태, 답변 저장, AI 피드백, 파일 업로드, 관리자 기능은 범위에 포함하지 않는다.

## 앱과 패키지 책임

### `apps/api`

`apps/api`는 백엔드 조립 루트다. Hono 앱 생성, 라우트 등록, 환경 변수 파싱, 데이터베이스 열기, 서비스 구성, 프로세스 시작을 이곳에서 수행한다.

현재 API 라우트는 버전 접두사 없이 노출한다.

- `GET /health`
- `GET /openapi.json`
- `GET /courses`
- `GET /courses/:courseId`
- `GET /lessons/:lessonId`

로컬 실행 기본값은 포트 `4000`, SQLite 파일 `data/api.sqlite`이다.

```bash
bun --filter @workspace/api dev
```

### `packages/core`

`packages/core`는 도메인 중심 계약을 담는다. 콘텐츠 DTO, `CourseId`와 `LessonId` 같은 브랜드 ID, 저장소 포트, 명시적 결과 변형, 읽기 서비스를 제공한다. 외부 런타임이나 데이터베이스 구현에 의존하지 않고 API와 데이터베이스 패키지가 공유하는 도메인 경계를 정의한다.

### `packages/db`

`packages/db`는 Drizzle SQLite 기반 영속성 패키지다. 콘텐츠 스키마, 마이그레이션 SQL, 시드 데이터, 데이터베이스 클라이언트 생성, 저장소 구현을 제공한다. 첫 번째 슬라이스의 과정과 레슨 조회 데이터는 시드된 작성 콘텐츠에서 가져온다.

### `packages/logger`

`packages/logger`는 Pino 로거 생성과 요청 로그 필드 헬퍼를 제공한다. API 조립 루트와 라우트 주변부에서 공통 로그 형식을 재사용할 수 있게 한다.
