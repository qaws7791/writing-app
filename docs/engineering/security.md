# 보안

이 문서는 인증, 인가, 민감 데이터 처리, 보안 요구사항을 설명하는 단일 진실 원천이다.

## 보안 원칙

- 인증 경계를 학습자와 관리자로 분리한다.
- 권한 확인은 변경성 작업 전에 수행한다.
- 비밀값과 OAuth 비밀값은 저장소에 커밋하지 않는다.
- 사용자에게 raw parser 오류, provider 오류, 내부 예외를 그대로 노출하지 않는다.
- 세션 쿠키는 브라우저 JavaScript로 읽지 않는다.
- 운영 데이터 변경 명령은 명시적으로 실행한다.

## 인증 보안

### 학습자

- Google OAuth를 사용한다.
- Better Auth 세션은 `kwep_session` 쿠키를 사용한다.
- `BETTER_AUTH_SECRET`은 32자 이상 랜덤 문자열이어야 한다.
- 웹과 API가 다른 서브도메인에 있으면 `BETTER_AUTH_COOKIE_DOMAIN`을 명시한다.
- API는 `WEB_ORIGIN`을 trusted origin/CORS 기준으로 사용한다.

### 관리자

- email/password 로그인을 사용한다.
- 관리자 세션은 `admin_session_token` 쿠키를 사용한다.
- 관리자 인증 테이블은 `admin_*` prefix를 사용한다.
- 관리자 비밀값은 학습자 비밀값과 공유하지 않는다.
- API는 `ADMIN_ORIGIN`을 trusted origin/CORS 기준으로 사용한다.

## 인가 보안

- 관리자 `operator`는 조회 중심 업무만 수행한다.
- 관리자 `owner`만 변경성 업무를 수행한다.
- unknown role은 세션 없음처럼 처리한다.
- 권한 부족 응답은 서비스 호출 전에 반환한다.
- 학습자 profile 상태가 `active`가 아니면 보호 API를 사용할 수 없다.

## CORS와 origin

- 학습자 API는 `WEB_ORIGIN`만 credentials 포함 요청 origin으로 허용한다.
- 어드민 API는 `ADMIN_ORIGIN`만 credentials 포함 요청 origin으로 허용한다.
- `Authorization`, `Content-Type` header를 허용한다.
- origin 값은 환경 변수 파서와 앱별 env 변환에서 URL로 검증한다.

## 민감 데이터 처리

저장소에 커밋하면 안 되는 값은 다음과 같다.

- `BETTER_AUTH_SECRET`
- `ADMIN_BETTER_AUTH_SECRET` 또는 관리자용 `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`
- 운영 `DATABASE_URL` 중 민감 경로나 credential이 포함된 값
- 최초 관리자 비밀번호
- 운영 SQLite DB 파일과 백업 파일

## 오류 응답 보안

- JSON 파싱 실패는 `malformed_json` 같은 안전한 detail code로만 구분한다.
- schema 검증 실패는 `invalid_body`로 구분한다.
- raw request body와 parser stack trace는 응답에 노출하지 않는다.
- 내부 예외는 표준 500 오류 응답으로 변환한다.
- 사용자 노출 메시지는 한국어로 작성한다.

## AI provider 보안

- OpenAI API key는 환경 변수로만 주입한다.
- API key가 없으면 unavailable provider를 사용해 호출하지 않는다.
- provider 실패는 사용자 재시도 횟수를 소모하지 않는 오류로 처리한다.
- 프롬프트와 구조화 출력 정책은 core AI feedback module에서 관리한다.

## 데이터 보존과 삭제

- 사용자 삭제 요청은 Better Auth provider row를 직접 훼손하지 않는다.
- 앱 소유 `learner_profiles.status`를 `deleted`로 전환한다.
- 학습 진행, 답변, 피드백 row는 감사와 복구 판단을 위해 보존한다.
- 콘텐츠 삭제는 기본적으로 `archived` 상태 전환으로 처리한다.

## DB 안전장치

- 서버 프로세스 시작은 마이그레이션, seed, reset을 수행하지 않는다.
- 마이그레이션과 seed는 명시 명령으로 실행한다.
- `db:reset`과 `dev:app:fresh`는 로컬 개발 DB 초기화용이며 운영에서 사용하지 않는다.
- seed 중 legacy DB 파일 재생성이 필요하면 `ALLOW_DATABASE_RESET=true`와 `--force`가 필요하다.

## 검토 체크리스트

- 새 endpoint가 인증/인가 요구사항을 명시했는가?
- 변경성 관리자 route가 owner guard를 사용하는가?
- 새 환경 변수가 `turbo.globalEnv`와 문서에 반영되었는가?
- 비밀값이 `.env.example`에는 placeholder로만 존재하는가?
- 오류 응답에 내부 예외나 민감 데이터가 포함되지 않는가?
- 로그에 비밀번호, 토큰, OAuth 비밀값, API key가 남지 않는가?
