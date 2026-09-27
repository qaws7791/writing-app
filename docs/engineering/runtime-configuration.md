# 런타임 설정 원칙

환경 변수는 실행 경계에서 검증한다. 비밀 값은 Git에 저장하지 않는다. 설정의 권위 소스는 [API parser](../../apps/api/src/config/env.ts), [Worker 설정](../../apps/api/wrangler.jsonc), [로컬 환경 예시](../../apps/api/.dev.vars.example)다.

## 로컬 개발

1. 저장소 루트에서 `bun run setup`을 실행한다.
2. 저장소 루트에서 `bun run dev`를 실행한다.
3. 앱 주소는 각 앱의 [package.json](../../apps/web/package.json)과 [로컬 기본값](../../packages/config/env/src/local-runtime-defaults.ts)에서 확인한다. 브라우저는 `localhost`로 연다. `127.0.0.1`은 설정된 origin과 달라 로그인 요청이 거절된다.
4. 개발 서버를 종료할 때 터미널에서 Ctrl+C를 누른다.

`setup`은 잠금 파일 기준 설치, 코드 생성, 환경 보충, 로컬 D1 migration, seed와 진단을 순서대로 실행한다. 기존 환경 값은 보존한다. 재실행한 seed는 기존 계정을 덮어쓰지 않는다. 관리자 계정은 Git에서 제외된 `apps/api/.dev.vars`에서 확인한다. 학습자는 실제 이메일 가입·로그인 흐름으로 생성한다.

API는 로컬 Workers 런타임을 사용한다. D1과 R2 상태는 [local-bindings.ts](../../apps/api/src/scripts/local-bindings.ts)의 영속 경로에 저장한다. 개발 서버 재시작은 상태를 유지한다. Cloudflare 로그인은 필요하지 않다. Docker와 외부 DB는 필요하지 않다.

인증 메일은 로컬 R2 mailbox에 저장한다. 확인 링크는 API의 `/__dev/mail?email=<URL 인코딩한 이메일>`에서 조회한다. 이 경로는 개발 모드의 loopback 요청만 허용한다. 메일 링크에는 인증 토큰이 있으므로 공유하거나 로그에 붙여 넣지 않는다.

로컬 AI binding은 구성하지 않는다. AI 점검은 미설정 오류를 반환한다. 로컬 실행은 원격 AI 호출이나 실제 이메일 발송을 수행하지 않는다. Google OAuth 대신 이메일 인증을 사용한다.

`bun run doctor`는 도구, 환경 계약과 로컬 DB 무결성을 검사한다. `setup` 잠금을 강제로 지우면 동시에 실행한 migration이 경합할 수 있다. 잠금 파일의 소유 PID가 종료된 것을 확인한 뒤 잠금을 제거한다.

## 원격 실행

Cloudflare CLI 인증과 원격 배포는 보류 상태다. 환경별 Worker 선언은 운영 검증 완료를 뜻하지 않는다. [배포 기준](./deployment.md)을 따른다.
