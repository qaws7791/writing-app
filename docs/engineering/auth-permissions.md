# 인증과 권한

이 문서는 인증 경계, 역할별 접근 범위, 리소스별 허용 행위를 설명하는 단일 진실 원천이다.

## 인증 경계

| 영역   | 사용자         | 인증 방식                   | API              | 쿠키/테이블                                                                        |
| ------ | -------------- | --------------------------- | ---------------- | ---------------------------------------------------------------------------------- |
| 학습자 | 일반 학습자    | Better Auth Google OAuth    | `apps/api`       | `learner_session_token`, `user/session/account/verification`                       |
| 관리자 | 운영자, 소유자 | Better Auth 아이디/패스워드 | `apps/admin-api` | `admin_session_token`, `admin_user/admin_session/admin_account/admin_verification` |

학습자와 관리자는 인증 테이블, 쿠키 이름, 로그인 방식, API origin을 공유하지 않는다.

## 학습자 권한

학습자 API의 보호 route는 활성 세션이 필요하다. 세션이 없으면 `401`, 학습자 profile 상태가 `active`가 아니면 `403`을 반환한다.

| 리소스                    | active 학습자 | suspended/deleted 학습자 | 비인증 |
| ------------------------- | ------------- | ------------------------ | ------ |
| 세션 조회 `/auth/session` | 허용          | 거부                     | 거부   |
| 코스 목록/상세            | 허용          | 거부                     | 거부   |
| 레슨 조회                 | 허용          | 거부                     | 거부   |
| 진행 조회                 | 허용          | 거부                     | 거부   |
| 답변 저장                 | 허용          | 거부                     | 거부   |
| 레슨 완료                 | 허용          | 거부                     | 거부   |
| AI 피드백 생성            | 허용          | 거부                     | 거부   |

현재 코드의 학습자 콘텐츠 API는 보호 route다. 공개 콘텐츠 조회가 필요해지면 route별 공개/보호 정책을 이 문서와 OpenAPI에 먼저 반영한다.

## 관리자 역할

관리자 role 값의 단일 출처는 `packages/core/src/modules/admin/domain/admin-role.ts`다.

| 역할       | 의미                                       |
| ---------- | ------------------------------------------ |
| `operator` | 조회 중심 운영자                           |
| `owner`    | 변경성 작업을 수행할 수 있는 소유자 관리자 |

unknown role은 관리자 세션 resolver에서 유효하지 않은 세션으로 처리한다.

## 관리자 권한 매트릭스

| 리소스/행위                | operator | owner |
| -------------------------- | -------- | ----- |
| 대시보드 조회              | 허용     | 허용  |
| 코스 목록 조회             | 허용     | 허용  |
| 코스 상세/편집 문서 조회   | 허용     | 허용  |
| 코스 생성                  | 거부     | 허용  |
| 코스 정보 저장             | 거부     | 허용  |
| 유닛/레슨/스텝 변경        | 거부     | 허용  |
| 코스 보관                  | 거부     | 허용  |
| 사용자 목록 조회           | 허용     | 허용  |
| 사용자 상세 조회           | 허용     | 허용  |
| 사용자 상태 변경           | 거부     | 허용  |
| 사용자 삭제 상태 전환      | 거부     | 허용  |
| 분석 조회                  | 허용     | 허용  |
| 설정 조회                  | 허용     | 허용  |
| 공지/배너 저장             | 거부     | 허용  |
| 약관/개인정보처리방침 저장 | 거부     | 허용  |
| 콘텐츠 초기화              | 거부     | 허용  |

변경성 route는 `resolveOwnerAdminSession()`을 사용해 서비스 호출 전에 차단한다.

## API별 권한 기준

### 학습자 API

- 인증 처리는 Better Auth handler가 `/api/auth/*`에서 담당한다.
- Google 로그인 시작은 웹 클라이언트가 학습자 API base URL의 Better Auth endpoint를 직접 호출한다.
- 로컬 자동화용 테스트 로그인은 `ENABLE_TEST_AUTH=true`와 non-production 환경에서만 `/api/auth/test/sign-in`을 연다.
- 테스트 로그인은 기본 학습자와 Google account row를 보장한 뒤 실제 학습자와 같은 `learner_session_token` Better Auth 세션 쿠키를 발급한다.
- 보호 route는 `requireActiveSession` middleware를 사용한다.
- 브라우저 JavaScript가 세션 쿠키를 읽어 Bearer token으로 변환하지 않는다.

### 어드민 API

- 인증 처리는 Better Auth handler가 `/api/auth/*`에서 담당한다.
- 관리자 로그인은 `POST /api/auth/sign-in/email`을 사용한다.
- 조회 route는 관리자 세션만 요구한다.
- 변경 route는 owner 세션을 요구한다.

## 오류 정책

| 상황           | HTTP status | 코드                                   |
| -------------- | ----------- | -------------------------------------- |
| 세션 없음      | `401`       | `unauthorized` 또는 표준 오류 응답     |
| 계정 사용 불가 | `403`       | `ACCOUNT_UNAVAILABLE` 또는 `forbidden` |
| 권한 부족      | `403`       | `forbidden`                            |
| 요청 형식 오류 | `400`       | `invalid_request`                      |
| 대상 없음      | `404`       | `not_found`                            |

## 권한 변경 절차

- 새 role 또는 capability를 추가하기 전에 `admin-role.ts`를 먼저 변경한다.
- DB enum, Better Auth additional field, seed, route guard, 테스트 fixture가 같은 role source를 사용해야 한다.
- route에 문자열 literal로 role을 직접 비교하지 않는다.
- 변경성 작업은 route에서 권한 확인을 끝낸 뒤 service를 호출한다.
