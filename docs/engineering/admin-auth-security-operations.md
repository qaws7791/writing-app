# 관리자 인증 보안 운영

이 문서는 관리자 공개 가입 차단, 관리자 계정 감사와 세션 폐기, owner 계정 seed 안전화 작업의 운영 기준을 기록한다.

- 기준일: 2026-07-12
- 작업 상태: 구현 완료, 운영 실행 대기
- 관련 이슈: `SEC-01`, `SEC-01R`, `SEC-02`

## 작업 시작 기준

- 운영 데이터는 이 작업에서 직접 조회하거나 변경하지 않는다.
- 감사 도구는 비밀번호와 세션 토큰 원문을 출력하지 않는 읽기 전용 경로로 제공한다.
- 세션 폐기는 감사 결과를 검토한 운영자가 명시적으로 실행하는 별도 절차로 문서화한다.
- 공개 가입 차단과 seed 입력 검증은 DB 쓰기 전 실패하는 회귀 테스트로 고정한다.

## 폐쇄형 관리자 생성 정책

- `/api/auth/sign-up/email`은 공개하지 않으며 유효한 Origin에서도 `404`를 반환한다.
- 관리자는 승인된 운영자가 `seed:admin` 명령으로만 생성한다.
- seed에는 `ADMIN_SEED_EMAIL`과 강한 `ADMIN_SEED_PASSWORD`를 반드시 명시한다.
- 비밀번호는 16자 이상이고 소문자, 대문자, 숫자, 특수문자 중 세 종류 이상을 포함해야 하며 알려진 placeholder를 사용할 수 없다.
- 운영에서는 `ADMIN_SEED_PRODUCTION_APPROVED=true`와 실제 `DATABASE_URL`과 같은 `ADMIN_SEED_EXPECTED_DATABASE_URL`을 함께 제공한다.
- user와 credential account 저장은 한 트랜잭션에서 수행하며 account 저장 실패 시 user도 rollback한다.
- 비밀번호를 명령 인자나 로그에 넣지 않고 비밀 저장소가 주입하는 환경 변수로 전달한다.
- 최초 로그인 직후 일회성 전달 비밀번호를 별도의 강한 값으로 교체한다.
- owner 비밀번호 변경은 교체 발급된 현재 session을 포함한 모든 관리자 session을 서버에서 폐기하며, 새 비밀번호로 다시 로그인한다.

## 로컬 owner 생성

`apps/api/.env`에 다음 값을 직접 설정한다. `.env`는 커밋하지 않는다.

```dotenv
ADMIN_SEED_EMAIL=owner@example.com
ADMIN_SEED_NAME=관리자
ADMIN_SEED_PASSWORD=<16자 이상의 강한 로컬 비밀번호>
ADMIN_SEED_RESET_PASSWORD=true
```

그 다음 `bun run dev:admin:setup`을 실행한다. 기존 credential을 유지하려면 `ADMIN_SEED_RESET_PASSWORD=false`로 설정한다.

## 운영 감사 runbook

### 1. 사전 조건

1. SEC-01 공개 가입 차단 버전을 먼저 배포한다.
2. 운영 변경을 중지하고 감사 담당자와 승인된 관리자 명단을 확정한다.
3. DB 파일의 일관된 백업과 복구 지점을 만든다.
4. 승인 명단에는 이메일과 기대 role만 포함하고 비밀번호나 토큰을 기록하지 않는다.

### 2. 읽기 전용 인벤토리

감사 도구는 SQLite를 read-only 모드로 열고 `admin_user`, `admin_account`, `admin_session`에서 다음 정보만 집계한다.

- 이메일, role, 관리자 계정 생성 시각
- credential provider 종류와 account 생성 시각
- 세션 생성·만료 시각, 활성·만료 상태와 개수
- 승인 명단 누락, 미승인 계정, role 불일치

비밀번호 hash, access/refresh token, 세션 token, cookie 원문은 조회 결과에 포함하지 않는다.

PowerShell 예시:

```powershell
$env:DATABASE_URL = "file:D:/absolute/path/to/admin.sqlite"
$env:ADMIN_AUDIT_APPROVED_ADMINS_JSON = '[{"email":"owner@example.com","role":"owner"}]'
bun --filter @workspace/api audit:admin-auth
```

출력의 `differences`가 빈 배열이고 `missingApprovedAdmins`가 비어 있어야 승인 명단과 실제 row가 일치한다. `role_mismatch`는 owner 이메일 선점 또는 잘못된 역할 부여 가능성을 포함하므로 세션 폐기 전에 반드시 조사한다.

### 3. 차이 조치

1. 각 차이를 변경 티켓에 이메일, 현재 role, 생성 시각과 판단 근거만 기록한다.
2. 미승인 계정은 즉시 접근 차단 대상으로 분류한다. 현재 schema에는 비활성 상태가 없으므로 해당 사용자의 모든 `admin_session`을 먼저 삭제한 뒤 승인된 DB 운영 절차에서 `admin_user`를 이메일 기준으로 삭제한다. FK cascade가 연결된 `admin_account`와 잔여 세션을 함께 제거한다.
3. role 불일치는 승인자 확인 후 기대 role로 정정하거나 미승인 계정 절차로 삭제한다.
4. 누락된 승인 관리자는 owner seed 절차로 생성한다. 동일 이메일이 이미 있으면 먼저 선점 여부를 해결하며 unique 제약을 우회하지 않는다.
5. 읽기 전용 감사를 다시 실행해 차이가 0건인지 확인한다.

직접 SQL을 실행할 때는 이메일을 문자열 연결로 만들지 않고 운영 DB 도구의 parameter binding을 사용한다. 변경 전후 row 수를 기록하고 예상 건수와 다르면 rollback한다.

### 4. 전체 세션 폐기

차이가 0건인 감사 결과를 검토한 뒤 배포 직후 다음 명령을 한 번 실행한다.

```powershell
$env:DATABASE_URL = "file:D:/absolute/path/to/admin.sqlite"
$env:ADMIN_SESSION_EXPECTED_DATABASE_URL = $env:DATABASE_URL
$env:ADMIN_SESSION_REVOCATION_APPROVED = "true"
bun --filter @workspace/api revoke:admin-sessions
```

명령은 대상 DB 일치와 명시적 승인을 확인한 뒤 `admin_session`만 삭제하고 폐기 건수만 출력한다. 토큰 원문은 출력하지 않는다.

### 5. 사후 확인

1. 기존 cookie로 `GET /session`을 호출해 `401`인지 확인한다.
2. 미승인 계정으로 로그인이 실패하고 보호 route가 `401`인지 확인한다.
3. 새로 로그인한 승인 계정만 `GET /session`과 역할에 맞는 route를 사용할 수 있는지 확인한다.
4. 읽기 전용 감사를 다시 실행해 활성 세션이 새 승인 로그인 수와 일치하는지 확인한다.
5. 감사 결과, 조치 건수, 세션 폐기 건수와 확인 시각을 사고 기록에 남긴다. 비밀번호와 token은 기록하지 않는다.

## 회귀 검증

- 공개 가입은 일반 본문과 `role: owner` 조작 모두 `404`이며 인증 row를 만들지 않는다.
- seed owner 로그인은 계속 성공한다.
- 익명 fixture가 승인·미승인·role 불일치를 분류하고 비밀값을 출력하지 않는다.
- fault injection으로 account 저장을 실패시키면 user 저장도 rollback한다.
- 전체 세션 폐기 뒤 기존 cookie의 `/session` 요청은 `401`이다.
