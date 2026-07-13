# 어드민 로컬 브라우저 테스트 보고서 (2026-07-14)

## 상태

- 완료
- 최초 판정: 일부 실패. 아래 발견 사항 7건은 최초 수동 검증 당시의 재현 기록이다.
- 복구 판정: 통과. A-01~A-11 구현과 회귀 검증을 완료했다.
- 대상: `apps/admin`, `apps/admin-api`
- 브라우저: Codex 인앱 브라우저
- 검증 런타임: Bun 1.3.10, Node.js 24.15.0, Next.js 16.2.6
- 복구 상태: 2026-07-14 완료. 계획의 A-01~A-11과 관련 문서·OpenAPI를 동기화했다.
- 착수 자동 검증: 고정 Bun 1.3.10 toolchain 검사와 어드민 API 121개 테스트 통과. 어드민 웹의 로그아웃 재시도 테스트는 전체 실행에서 1회 비동기 assertion 실패 후 단독 통과하여 안정화 대상으로 포함했다.

## 복구 완료 결과

| 발견 ID | 최종 결과                                       | 브라우저·계약 증거                                                                                  |
| ------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| A-01    | 검색 Enter 복구                                 | 코스·사용자 URL 단위 테스트와 Playwright 키보드 검색 통과                                           |
| A-02    | Select 새 값·중립값·첫 페이지 직렬화 복구       | component 테스트와 첫 선택 Playwright 통과                                                          |
| A-03    | mutation 직후 목록·상세 일관성 복구             | 성공 전용 `revalidatePath` 테스트와 코스 생성·보관, 사용자 상태 변경 Playwright 통과                |
| A-04    | 정지 사용자의 활성화와 삭제 읽기 전용 상태 제공 | exhaustive 상태 mapping과 정지→활성 Playwright 통과                                                 |
| A-05    | 빈 트리 생성과 revision/event 중복 수용 복구    | 빈 루트·선행 event·중복 revision 테스트와 폴더·문서 생성 Playwright 통과                            |
| A-06    | CORS 다운로드 헤더와 UTF-8 파일명 복구          | 실제 OPTIONS/GET, header parser, `한글 제목.md` 파일명·본문 Playwright 통과                         |
| A-07    | 로그인·MFA 뒤 보호 경로 복귀 복구               | 안전 경로·layout·MFA 테스트와 query 포함 원래 경로 복귀 Playwright 통과                             |
| A-08    | SSR 안전 runtime 기본값 복구                    | SSR import·production 필수값 테스트와 production build 통과                                         |
| A-09    | 잘못된 Bun의 개발 서버 사전 차단                | Bun 1.3.10 toolchain과 admin lifecycle 검사 통과                                                    |
| A-10    | 원자적 코스 전체 문서 저장 제공                 | `PUT /courses/{courseId}/editor`, transaction rollback·archive·409, 두 context 충돌 Playwright 통과 |
| A-11    | 실제 LCP 후보만 preload                         | Next.js 16.2.6 build와 console/LCP 경고 실패형 Playwright 통과                                      |

Playwright는 격리된 임시 SQLite와 다운로드 디렉터리에서 desktop owner, mobile operator, 키보드 조작, 실제 TOTP MFA를 검증했다. 예상하지 않은 console error/warn, hydration 오류, unhandled rejection, API 5xx, LCP 경고는 발생하지 않았다.

## 인증과 실행 기준

프로젝트의 `ENABLE_TEST_AUTH=true`는 학습자 로그인 전용이다. 어드민은 자동 세션 주입을 지원하지 않으므로 로컬 seed owner 계정과 Better Auth 세션으로 로그인했다. 개발 프로세스에는 프로젝트 지침에 맞춰 `ENABLE_TEST_AUTH=true`를 명시했다.

시스템 전역 Bun은 1.3.14였고 프로젝트 요구 버전은 1.3.10이었다. 전역 Bun으로 API를 실행하면 `@lexical/link` 모듈 초기화 중 `ReferenceError: Cannot access 'defineImportRule' before initialization`이 발생했다. 이후 `bunx bun@1.3.10`으로 웹과 API를 다시 실행해 테스트했다.

현재 `apps/admin/.env`에는 `ADMIN_API_BASE_URL`만 있다. 이 상태에서는 서버 렌더링 중 `readLearnerWebOrigin()`이 `window.location` fallback을 호출해 `window is not defined` 오류가 발생했다. 파일을 바꾸지 않고 아래 값을 프로세스 환경에 명시한 뒤 오류 없이 다시 검증했다.

- `NEXT_PUBLIC_ADMIN_API_BASE_URL=http://localhost:4001`
- `ADMIN_API_BASE_URL=http://localhost:4001`
- `NEXT_PUBLIC_LEARNER_WEB_ORIGIN=http://localhost:3000`

## 기능별 결과

| 영역            | 결과      | 확인 내용                                                                                                                                                                 |
| --------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 로그인          | 통과      | 잘못된 비밀번호 오류, seed owner 로그인, TOTP MFA 등록, 복구 코드 발급, TOTP 재인증을 확인했다.                                                                           |
| 대시보드        | 통과      | 주요 지표, 최근 30일 가입, 일별 완료, 스트릭 분포, 최근 활동을 확인했다.                                                                                                  |
| 주요 내비게이션 | 통과      | 대시보드, 콘텐츠, 자료실, AI, 사용자, 분석, 설정, 보안 화면으로 이동했다. 현재 메뉴 표기도 확인했다.                                                                      |
| 콘텐츠 목록     | 일부 실패 | 생성과 보관 API는 성공했지만 즉시 목록이 갱신되지 않았다. 검색과 Select 필터도 기대대로 적용되지 않았다.                                                                  |
| 코스 상세       | 확인 필요 | 강의 정보는 disabled 입력이고 유닛·레슨 추가도 disabled인 읽기 전용 미리보기다. `BACKEND.md`의 현재 계약과는 일치하지만 제품 운영 문서의 저장형 편집 범위와는 불일치한다. |
| 스텝 디버그     | 통과      | READING, COMPARE, MULTIPLE_CHOICE, FILL_BLANK, SELECT, ORDER, MATCH, CATEGORIZE, WRITE, AI_FEEDBACK 전환을 모두 확인했다.                                                 |
| 자료실          | 일부 실패 | 새 문서 생성, 본문 저장 상태, 재접속 후 본문 복구는 통과했다. 폴더/문서가 트리에 나타나지 않았고 Markdown 내보내기는 실패했다.                                            |
| AI 에이전트     | 통과      | 새 메시지를 전송하고 SSE 응답, 대화 생성, 대화 목록 반영을 확인했다.                                                                                                      |
| 사용자 관리     | 일부 실패 | 목록과 상세는 통과했다. 정지 API는 성공했지만 목록이 즉시 갱신되지 않았고 정지 사용자를 다시 활성화할 UI가 없었다. 검색과 Select 필터도 기대대로 적용되지 않았다.         |
| 분석            | 통과      | 차트의 접근성 표, 이탈률 목록, 레슨 검색과 표 정렬을 확인했다.                                                                                                            |
| 운영 설정       | 통과      | 공지·배너와 약관 저장, 콘텐츠 초기화 확인 대화상자와 취소를 확인했다.                                                                                                     |
| 보안 설정       | 통과      | 잘못된 현재 비밀번호에 대한 변경 실패 상태를 확인했다. 실제 비밀번호 변경은 모든 세션을 폐기하므로 수행하지 않았다.                                                       |
| 로그아웃        | 통과      | 로그아웃 뒤 보호 라우트가 로그인 화면으로 이동하는 것을 확인했다.                                                                                                         |

## 발견 사항

### 1. 목록 검색을 Enter로 제출할 수 없다

- 영향: 콘텐츠 목록과 사용자 목록의 텍스트 검색이 실행되지 않는다.
- 재현:
  1. `/courses`의 `코스 검색` 또는 `/users`의 `사용자 검색`에 값을 입력한다.
  2. Enter를 누른다.
  3. URL과 결과 목록이 바뀌지 않는다.
- 근거: 각 GET form 안에 검색 입력 외에도 Select가 만든 textbox가 있어 명시적 submit control이 없는 implicit submit이 발생하지 않는다.

### 2. 콘텐츠와 사용자 Select 필터가 이전 값을 제출한다

- 영향: 상태·카테고리·정렬 필터를 선택해도 선택한 값이 적용되지 않는다.
- 재현:
  1. `/courses` 상태에서 `활성`을 선택한다.
  2. URL이 `status=active`가 아니라 `status=all`로 유지되는 것을 확인한다.
  3. `/users`에서도 같은 현상을 확인할 수 있다.
- 근거: `onValueChange`에서 `formRef.current?.requestSubmit()`을 즉시 호출하며 hidden input 반영 전 값을 제출한다.

### 3. 변경 성공 뒤 콘텐츠·사용자 목록이 즉시 갱신되지 않는다

- 영향: 성공 메시지와 화면의 실제 상태가 모순되어 동일 작업을 반복할 수 있다.
- 재현:
  1. 새 강의를 만들면 성공 메시지가 나오지만 강의 수와 행이 그대로다. 새로고침하면 새 강의가 보인다.
  2. 강의를 보관해도 행과 보관 버튼이 그대로다. 새로고침하면 보관 상태가 반영된다.
  3. 사용자를 정지해도 행은 `활성`으로 남는다. 새로고침하면 `정지`가 보인다.

### 4. 정지 사용자를 다시 활성화할 UI가 없다

- 영향: 운영자가 실수로 정지한 계정을 화면에서 복구할 수 없다.
- 재현:
  1. 활성 사용자를 정지하고 목록을 새로고침한다.
  2. 상태는 `정지`지만 작업 열에는 disabled `정지` 버튼과 `삭제 요청`만 표시된다.
- 테스트로 변경한 seed 학습자 상태는 작업 종료 전에 `db:seed`로 `active`로 복원했다.

### 5. 자료 트리가 생성 결과를 표시하지 않는다

- 영향: 만든 폴더와 문서를 트리에서 선택, 이름 변경, 이동, 휴지통 처리할 수 없다.
- 재현:
  1. 비어 있는 `/resources`에서 새 폴더를 만든다.
  2. API 로그에서 `POST /resources/folders` 200과 후속 `GET /resources/tree` 200을 확인한다.
  3. 화면에는 계속 `첫 자료를 만들어 보세요.`가 보인다.
  4. 새 문서는 생성되어 `/resources/{documentId}` 편집기로 이동하고 본문 저장·재접속도 성공하지만 트리는 계속 비어 있다.

### 6. Markdown 내보내기가 성공 응답을 처리하지 못한다

- 영향: 자료 문서를 `.md` 파일로 내려받을 수 없다.
- 재현:
  1. 저장된 자료 문서에서 `Markdown 내보내기`를 누른다.
  2. API는 `GET /resources/documents/{documentId}/export`에 200을 반환한다.
  3. 다운로드가 시작되지 않고 화면에 `API 응답을 해석할 수 없습니다.`가 표시된다.

### 7. 보호 라우트의 로그인 복귀 경로가 루트로 고정된다

- 영향: `/users` 같은 보호 화면에 직접 접근한 사용자가 로그인 후 원래 화면으로 돌아가지 못한다.
- 재현:
  1. 로그아웃한 상태에서 `/users`에 접근한다.
  2. `/login?next=%2F`로 이동한다.
- 근거: 상위 `(admin)/layout.tsx`가 인증 실패 시 항상 `createAdminLoginPath("/")`를 사용한다. 자료실 layout의 `/resources` 복귀 경로도 상위 layout에서 먼저 가려진다.

## 자동 검증

고정 Bun 1.3.10으로 아래 검증을 수행했다.

| 명령                                                 | 결과                         |
| ---------------------------------------------------- | ---------------------------- |
| `bunx bun@1.3.10 run test`                           | 14개 workspace 작업 통과     |
| `bunx bun@1.3.10 --filter @workspace/admin test`     | 52개 파일, 224개 테스트 통과 |
| `bunx bun@1.3.10 --filter @workspace/admin-api test` | 20개 파일, 124개 테스트 통과 |
| `bunx bun@1.3.10 run typecheck`                      | 15개 workspace 작업 통과     |
| `bunx bun@1.3.10 run lint`                           | 문서·API drift 포함 통과     |
| `bunx bun@1.3.10 run format:check`                   | 1,120개 파일 통과            |
| `bunx bun@1.3.10 run build`                          | 4개 build 작업 통과          |
| `bunx bun@1.3.10 run test:e2e`                       | 3개 Playwright 테스트 통과   |
| 어드민 로그아웃 재시도 단위 테스트 5회 반복          | 5회 모두 통과                |

최초 E2E는 수동 테스트용 Next.js dev server의 `.next/dev` 잠금과 충돌했고 학습자 코스 썸네일 LCP 경고가 있었다. 복구 후 wrapper가 서버 종료와 lock 해제를 기다리고 임시 artifact를 `finally`에서 제거하며, 같은 3개 Playwright 테스트가 경고 없이 통과했다.

## 종료 상태

- 최초 수동 테스트에 사용한 3001, 4001, 3100, 3101, 4100, 4101 포트의 프로세스를 모두 종료하고 seed 학습자 상태를 `db:seed`로 복원했다.
- 최초 수동 테스트가 만든 보관 강의, 자료 문서·폴더, AI 대화와 owner MFA 설정은 기존 사용자 로컬 DB 변경으로 보존했다.
- 복구 E2E는 OS 임시 디렉터리의 전용 SQLite와 다운로드 경로만 사용했다. 종료 뒤 서버, 대상 포트, `.next/dev/lock`, 임시 DB와 다운로드 파일이 남지 않음을 확인했다.
