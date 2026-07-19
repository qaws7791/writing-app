# 어드민 개발 서버 브라우저 검증

## 문서 정보

- 실행일: 2026-07-18
- 대상: `apps/admin`, `apps/api`
- 상태: 결함 수정 및 재검증 완료

## 검증 환경

- 저장소 표준 명령인 `bun run dev:admin`으로 어드민과 통합 API 개발 서버를 함께 실행한다.
- 어드민 웹은 `http://127.0.0.1:3001`, 어드민 API는 `http://127.0.0.1:4000`을 사용한다.
- 로컬 브라우저 테스트 중 학습자 인증 경계는 `ENABLE_TEST_AUTH=true`를 유지하며 Google OAuth를 호출하지 않는다.
- 관리자 인증은 별도의 이메일·비밀번호 세션을 사용한다.

## 검증 범위

- API와 어드민 health 및 보호 경로의 인증 경계
- 관리자 로그인 성공·실패와 안전한 다음 경로 이동
- 대시보드, 콘텐츠, 사용자, 분석, 설정, 자료실, AI 채팅 내비게이션
- 주요 조회·필터·변경 작업의 API 연동
- 브라우저 콘솔 오류, 페이지 오류, 실패한 HTTP 응답

## 실행 결과

### 적용한 수정

- 관리자 로컬 웹/API Host를 `127.0.0.1`로 통일해 `*.localhost` DNS 의존성을 제거한다.
- 학습자 로컬 Host는 `localhost`로 유지해 단일 API process의 Host·cookie 경계를 보존한다.
- setup이 기존 값을 보존하면서 누락된 필수 환경 변수만 보완하고, 이전 기본 Host 값만 새 계약으로 이전한다.
- doctor가 환경 파일 존재 여부가 아니라 필수 key, 비밀값 분리, 로컬 URL·Host 계약을 검증한다.
- 개발 수명주기와 E2E가 OS resolver에 의존하지 않는 loopback Host 조합을 사용한다.

### 종합 판정

확인된 환경 변수 진단 누락과 Windows Host 해석 결함을 수정했다. 실제 로컬 환경은 필수 변수, 비밀값 분리, URL·Host 계약과 DB 검사를 모두 통과했고, 표준 `bun run dev:admin`의 API health와 어드민 로그인 화면이 각각 `200`을 반환했다. 보호 경로는 브라우저에서 `/login?next=%2F`로 이동했으며 콘솔 warning/error는 0건이었다. 전체 판정은 통과다.

### 통과한 항목

- 비인증 보호 경로의 로그인 이동, 잘못된 비밀번호 오류, owner/operator 로그인, 안전한 `next` 경로 복귀와 로그아웃
- 대시보드 지표와 차트, 콘텐츠 목록 검색, 코스 생성·편집·보관
- 사용자 목록과 상세, 분석, owner 운영 설정 저장
- 자료실 폴더·문서 생성, 제목·본문 저장과 새로고침 후 영속성
- AI 대화 응답과 새로고침 후 대화 영속성
- operator의 운영 설정 조회와 변경 요청 `403` 거부, 거부된 값의 미저장
- 어드민 API health `200`, 비인증 session `401`, 허용하지 않은 Host `421`
- 브라우저 콘솔 warning/error 0건, 서버 `5xx` 0건

서버에서 관찰한 응답은 `200` 58건, `204` 6건, 의도한 `401` 7건, 의도한 `403` 1건이다.

### 해결한 결함

#### 현재 API 환경 변수 누락

수정 전 `apps/api/.env`로 API를 직접 실행하면 `ADMIN_BETTER_AUTH_SECRET` 누락으로 시작 전에 실패했다. `ADMIN_BETTER_AUTH_URL`, `ADMIN_ORIGIN`, 관리자·학습자 Host allowlist도 없었지만 당시 `bun run doctor`는 통과했다.

수정 후 setup은 `.env.example`의 활성 key를 기준으로 기존 파일의 누락값을 안전하게 보충한다. doctor도 같은 예제 계약의 필수 key와 공통 로컬 런타임 값을 검사하므로 파일만 존재하는 불완전한 환경을 실패로 판정한다. 실제 환경에는 분리된 인증·cursor 비밀값을 생성했고 원문은 출력하지 않았다.

전체 빌드 검증에서는 웹 서버가 production build에 요구하는 `WEB_ORIGIN`이 `apps/web/.env.example`에 없어 setup과 doctor가 채우지 못하는 누락도 확인했다. 웹 환경 계약에 이 값을 추가하고 실제 로컬 환경을 다시 보충했다.

#### Windows의 `admin-api.localhost` 호환성

수정 전 이 실행 환경의 Windows resolver는 `admin-api.localhost`를 해석하지 못했고 Chrome 직접 접근도 차단했다. 그 결과 기본 URL을 사용한 서버 렌더링은 관리자 서비스 불가 화면을 표시하며, `bun run test:admin-dev-lifecycle`은 API readiness에서 90초 후 실패했다.

수정 후 관리자는 `127.0.0.1`, 학습자는 `localhost`를 사용한다. 두 값은 모두 OS resolver나 hosts 파일 변경 없이 loopback으로 해석되며, hostname이 달라 하나의 API process에서 Host dispatcher와 host-only session cookie 경계를 유지한다. 운영 public Host 계약은 변경하지 않았다.

같은 수명주기 테스트는 수정 후 약 10초 안에 API health `200`, 로그인 화면 `200`, 종료 후 3001·4000 port와 Next lock 해제를 모두 통과했다.

#### Windows의 아키텍처 검사 경로 구분자

전체 lint에서 legacy runtime 제거 검사가 역사 기록인 ADR의 이전 관리자 API 경로를 현재 source 잔여물로 오판했다. 검사에는 ADR 제외 규칙이 있었지만 `/` 경로만 처리해 Windows의 `adr\\...` 경로에는 적용되지 않았다. scan 입력과 판정 경로를 `/`로 정규화하고 Windows 경로 회귀 테스트를 추가했다.

### 검증 제한

사용자 정지 버튼의 브라우저 기본 확인창이 표시되는 것까지 확인했지만, Chrome 자동화 연결이 확인창 승인 단계에서 중단됐다. 새 탭에서 재조회한 사용자는 계속 활성 상태였으며 변경 API는 실행되지 않았다. 따라서 사용자 상태 변경의 브라우저 완료 흐름은 이번 수동 실행에서 미검증이다. 이는 제품 실패가 아니라 자동화 도구 제한으로 분류하며, 저장소의 기존 API·UI 회귀 테스트 결과를 대신 수동 통과로 간주하지 않는다.

### 비차단 경고

API 시작 시 Mastra가 명시적 storage 없이 in-memory store를 사용한다는 경고가 출력됐다. 이번 실행에서는 어드민 AI 대화가 앱 DB에 저장되어 새로고침 후 유지됐으므로 사용자 흐름 실패는 아니지만, 프로세스 재시작이 필요한 Mastra 내부 상태의 영속성 요구가 생기면 별도 저장소 경계를 검토해야 한다.

### 실행한 검증 명령

```bash
bun run dev:admin
bun run doctor
bun run test:admin-dev-lifecycle
bun run test:e2e
bun run test
bun run typecheck
bun run lint
bun run build
bun run format:check
```

위 명령은 모두 통과했다. 전체 단위 테스트는 API 309개, 어드민 107개를 포함한 11개 workspace task를 통과했고, E2E는 학습자 UI style·학습 완료와 관리자 owner/operator 권한 시나리오 3개를 실제 Chromium에서 검증했다. 전체 build는 학습자·관리자 Next.js와 Storybook을 생성했다. 종료 후 3001·4000·3100·3101·4100·4199 port와 Next lock은 모두 해제됐다.
