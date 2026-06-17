# WA-17 인증 설정과 프로필 생성 결합 분석

## 2026-06-17 시작

- Notion 이슈: `WA-17 비즈니스 로직과 설정(Config)의 결합`
- 출처: `writing-app 이슈 관리` 데이터베이스의 WA-17 페이지
- 조사 범위: `apps/api/src/auth/auth.ts`, 학습자 프로필 schema, 보호 route 세션 해석, 관리자 사용자 운영, 관련 도메인 문서
- 목표: Better Auth 설정 내부의 `learnerProfiles` 생성 side effect가 실제 구조 문제인지 판단하고, 회원 가입 후처리 경계를 더 명시적으로 만드는 개선 방안을 도출한다.

## 이슈 요약

WA-17은 `createLearnerAuth()`의 Better Auth 설정 객체 안에 있는 `databaseHooks.user.create.after`가 `learnerProfiles` row를 직접 생성하는 점을 지적한다. 인증 라이브러리 설정 내부에 앱 도메인 로직이 숨어 있다는 문제다.

## 코드 조사

### 현재 구현

`apps/api/src/auth/auth.ts`는 Better Auth 설정 안에서 다음 작업을 수행한다.

- Better Auth Drizzle adapter schema 연결
- Google social provider 설정
- session cookie 고급 옵션 설정
- `databaseHooks.user.create.after`에서 `learnerProfiles` insert

hook에서 생성하는 profile 값은 다음과 같다.

- `userId: user.id`
- `displayName: user.name`
- `status: learnerAccountStatuses.active`
- `deletedAt: null`

### 도메인 영향

`learnerProfiles`는 단순 표시 데이터가 아니다.

- `resolveActiveSession()`은 session user status가 `active`가 아니면 보호 route를 차단한다.
- 관리자 repository는 learner profile status를 기준으로 사용자 목록, 정지, 삭제 전환을 처리한다.
- `DOMAIN.md`는 사용자 삭제 요청 시 Better Auth provider 테이블을 훼손하지 않고 앱 소유 profile 상태를 `deleted`로 전환한다고 정한다.

즉 profile row 생성은 인증 설정의 부가 동작이 아니라 학습자 계정 lifecycle의 도메인 유스케이스다.

### 테스트의 빈틈

`apps/api/src/auth/auth.test.ts`는 Better Auth adapter schema와 session 변환만 검증한다. `databaseHooks.user.create.after`가 profile을 생성하는지, 실패 시 어떤 일이 일어나는지, 중복 생성이 안전한지에 대한 테스트는 없다.

## 판단

WA-17은 타당하다. 현재 구현은 인증 provider 설정, OAuth profile mapping, 앱 소유 learner profile 생성이 한 함수에 섞여 있다.

Better Auth hook을 완전히 쓰지 말아야 한다는 뜻은 아니다. 외부 라이브러리가 user 생성 이벤트를 hook으로만 제공한다면 hook은 사용할 수 있다. 그러나 hook 안에서 DB insert를 직접 수행하지 않고, 명명된 application service 또는 port를 호출해야 도메인 의도가 드러난다.

## 해결 방안

### 방안 1. Learner onboarding service를 만든다

`packages/core` 또는 `apps/api/src/auth` 주변에 `LearnerOnboardingService`를 정의한다.

예상 interface:

```ts
type LearnerOnboardingService = {
  readonly ensureLearnerProfile: (input: {
    readonly displayName: string
    readonly userId: string
  }) => Promise<void>
}
```

Better Auth hook은 이 service를 호출만 하고, profile 생성 규칙은 service와 repository adapter가 담당한다.

장점은 회원 가입 후처리의 이름과 테스트 표면이 생긴다는 점이다.

추천 강도: 높음.

### 방안 2. profile repository port를 명시한다

`learnerProfiles` insert를 `apps/api/src/auth/auth.ts`에서 직접 하지 않고, `LearnerProfileRepository.ensureActiveProfile()` 같은 포트로 옮긴다.

예상 책임:

- user id 기준 profile이 없으면 생성한다.
- 이미 있으면 덮어쓰지 않는다.
- deleted/suspended profile을 가입 hook이 다시 active로 되돌리지 않는다.
- display name 초기값 정책을 명시한다.

장점은 관리자 사용자 운영과 인증 가입 후처리가 같은 profile 저장 규칙을 공유할 수 있다는 점이다.

추천 강도: 높음.

### 방안 3. Auth runtime factory와 domain hook adapter를 분리한다

`createLearnerAuth()`는 Better Auth runtime 설정만 담당하고, `createLearnerAuthHooks({ onboardingService })` 같은 adapter가 Better Auth hook 모양으로 변환하게 한다.

예상 구조:

- `learner-auth-options.ts`: Better Auth provider, cookie, adapter 설정
- `learner-auth-hooks.ts`: Better Auth hook에서 application service 호출
- `learner-onboarding.service.ts`: profile 생성 도메인 유스케이스

장점은 설정과 side effect의 경계가 파일 이름으로 드러난다는 점이다.

추천 강도: 중간 이상.

### 방안 4. 가입 후처리 실패 정책을 정한다

현재 hook 안의 profile insert가 실패하면 Better Auth user 생성 흐름에 어떤 영향을 주는지 명확하지 않다. 정책을 정해야 한다.

선택지:

- profile 생성 실패 시 가입 전체를 실패시킨다.
- 가입은 성공시키되 첫 session resolve에서 missing profile을 self-healing한다.
- outbox나 재시도 queue를 둔다.

현재 구조에서는 profile이 없으면 session status가 기본 `active`로 처리된다. 운영 안정성을 위해서는 session resolve에서 profile이 없을 때도 `ensureLearnerProfile()`을 한 번 호출하는 self-healing 전략을 함께 고려할 수 있다.

추천 강도: 중간.

## 권장 순서

1. `LearnerProfileRepository.ensureLearnerProfile()` 포트를 만들고 Drizzle adapter에서 `onConflictDoNothing()`으로 구현한다.
2. `LearnerOnboardingService`를 추가해 신규 user의 앱 소유 profile 생성 정책을 테스트한다.
3. Better Auth hook은 직접 DB를 만지지 않고 onboarding service만 호출하게 바꾼다.
4. session resolve에서 profile이 없을 때의 self-healing 또는 실패 정책을 정하고 테스트한다.
5. 인증 설정 파일을 provider/cookie 설정과 domain hook adapter로 분리한다.

## 검증 계획

- `bun --filter @workspace/api test src/auth/auth.test.ts`
- `bun --filter @workspace/api test src/routes/auth.route.test.ts`
- `bun --filter @workspace/api test src/app.test.ts`
- `bun --filter @workspace/db test src/repositories/admin.repository.test.ts`
- `bun --filter @workspace/api typecheck`

## 2026-06-17 완료

- Notion `WA-17` 내용을 확인했다.
- Better Auth 설정, learner profile schema, 보호 route의 active status 검증, 관리자 사용자 운영, 도메인 문서를 조사했다.
- WA-17은 타당하다고 판단했다.
- onboarding service, profile repository port, auth hook adapter 분리, 가입 후처리 실패 정책 정리의 4가지 개선 방안을 도출했다.

## 2026-06-17 구현 완료

- `apps/api/src/auth/learner-onboarding.ts`를 추가해 `LearnerProfileRepository`, `LearnerOnboardingService`, Drizzle repository adapter, Better Auth hook adapter를 한 경계에 모았다.
- `createLearnerAuth()`는 더 이상 Better Auth 설정 내부에서 `learnerProfiles`를 직접 insert하지 않는다. user create hook은 `createLearnerAuthHooks()`가 만든 adapter를 통해 onboarding service를 호출한다.
- `LearnerProfileRepository.ensureActiveProfile()`은 `onConflictDoNothing()`을 사용해 이미 존재하는 profile을 덮어쓰지 않는다. 따라서 기존 `suspended` 또는 `deleted` 상태를 가입 hook이 `active`로 되돌리지 않는다.
- `createLearnerSessionResolver()`는 profile 조회를 repository 포트로 위임한다. Better Auth session은 있지만 profile row가 누락된 경우 active profile을 한 번 생성하고, 기존 profile 상태가 있으면 그대로 세션에 반영한다.
- `apps/api/src/auth/learner-onboarding.test.ts`를 추가해 onboarding service와 Better Auth hook adapter의 위임 경계를 검증했다.
- `apps/api/src/auth/auth.test.ts`는 구조 없는 fake DB query chain 대신 profile repository 포트를 주입해 active self-healing과 suspended 상태 보존을 검증한다.
- `BACKEND.md`에 학습자 가입 후처리와 profile 누락 복구 정책을 기록했다.

## 검증 결과

- `bun --filter @workspace/api test src/auth/auth.test.ts src/auth/learner-onboarding.test.ts`
- `bun --filter @workspace/api test src/auth/auth.test.ts src/auth/learner-onboarding.test.ts src/routes/auth.route.test.ts src/app.test.ts`
- `bun --filter @workspace/api typecheck`
