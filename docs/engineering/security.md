# 보안

이 문서는 인증, 인가, 민감 데이터 처리, 보안 요구사항을 설명하는 단일 진실 원천이다.

- 기준일: 2026-07-10

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
- Better Auth 세션은 `learner_session_token` 쿠키를 사용한다.
- `BETTER_AUTH_SECRET`은 32자 이상 랜덤 문자열이어야 한다.
- 웹과 API가 다른 서브도메인에 있으면 `BETTER_AUTH_COOKIE_DOMAIN`을 명시한다.
- API는 `WEB_ORIGIN`을 trusted origin/CORS 기준으로 사용한다.
- 로컬 자동화용 `ENABLE_TEST_AUTH`는 non-production에서만 동작하며, 운영 인증 경로로 사용하지 않는다.

### 관리자

- 관리자 아이디와 패스워드 로그인을 사용한다.
- 관리자 아이디는 이메일 주소 형식이다.
- 관리자 세션은 `admin_session_token` 쿠키를 사용한다.
- 관리자 인증 테이블은 `admin_*` prefix를 사용한다.
- 관리자 비밀값은 학습자 비밀값과 공유하지 않는다.
- API는 `ADMIN_ORIGIN`을 trusted origin/CORS 기준으로 사용한다.
- 어드민 보호 layout은 쿠키 존재 여부만 보지 않고 `GET /session`으로 실제 관리자 세션과 역할을 확인한다.
- 어드민 웹은 환경 변수의 세션 token을 방문자에게 자동 주입하는 개발용 fallback을 지원하지 않는다.

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
- CORS 응답 header는 CSRF 방어로 사용하지 않는다.
- 쿠키가 포함된 `POST`, `PUT`, `PATCH`, `DELETE` 요청은 공통 middleware가 `Origin`과 Fetch Metadata를 검사하고 신뢰하지 않은 요청을 side effect 전에 `403`으로 종료한다.
- Server Action과 Next.js Route Handler는 공개 HTTP 진입점으로 취급한다. 어드민 AI chat proxy도 요청 origin, 세션, 본문 크기를 직접 검증한다.

## 학습 진행 무결성

- 레슨 시작은 첫 스텝 답안 row와 진행 index `0`을 함께 저장한다.
- 진행 index는 저장값과 같거나 정확히 `1` 증가할 때만 저장한다. 감소하거나 여러 스텝을 건너뛰는 요청은 거부한다.
- 답변 가능 스텝은 앞선 답변 가능 스텝의 유효한 답안이 저장된 뒤에만 답안을 저장한다.
- 레슨 완료 요청은 클라이언트의 현재 index를 받지 않는다. 서버가 마지막 index 도달, 시작 기록과 모든 필수 답안 저장을 확인하고 마지막 index를 계산한다.
- 반복 완료는 최초 완료 시각과 완료 카운트를 중복 변경하지 않는다.

## 입력과 요청 크기

- 학습자 API와 어드민 API는 요청 본문을 최대 `1 MiB`로 제한하고 초과 요청을 `413 PAYLOAD_TOO_LARGE`로 거부한다.
- AI 답안, 학습 답안 배열과 텍스트, 공지, 법적 문구, 자료실 문서는 contracts schema에서 용도별 최대 길이와 개수를 검증한다.
- 자료실 문서는 개별 node뿐 아니라 문서 전체 텍스트 길이도 제한한다.
- 일반 JSON 값은 깊이, 전체 node 수, 배열·객체 크기와 문자열 길이를 반복 방식으로 검증한다.

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
- AI 요청 답안과 provider 구조화 출력의 문자열·배열 크기는 provider 호출 전후에 각각 검증한다.

## 브라우저 보안

- 두 Next.js 앱은 CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`를 모든 경로에 적용한다.
- production 응답에는 HSTS를 적용하고 `X-Powered-By` header를 비활성화한다.
- CSP는 `frame-ancestors 'none'`으로 clickjacking을 차단하고 앱별 API origin만 `connect-src`에 추가한다.
- 내부 이동 경로는 URL parser로 같은 origin의 절대 경로인지 확인하고 역슬래시, 외부 origin과 로그인 순환 경로를 거부한다.
- 레슨 초안은 version이 포함된 localStorage key와 최대 길이를 사용한다. 저장소 접근 실패 시 메모리 값으로 후퇴하며 token이나 서버 응답 전체를 저장하지 않는다.

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
- 쿠키 인증 mutation이 신뢰한 origin만 side effect 전에 허용하는가?
- 외부 문자열, 배열, JSON 문서와 전체 요청 본문에 최대 크기가 있는가?
- 새로운 Next.js 경로에도 공통 보안 header가 적용되는가?
