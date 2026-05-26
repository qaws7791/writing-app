# 프론트엔드 API 클라이언트 전환

## 2026-05-27 계획 수립 시작

- `openapi-typescript`와 `openapi-fetch`를 사용해 백엔드 OpenAPI 계약 기반 API 클라이언트를 만드는 계획을 수립한다.
- 프론트엔드는 실제 백엔드 없이도 테스트할 수 있도록 외부 HTTP 의존성을 교체 가능한 경계 뒤에 둔다.
- 기존 `apps/web` 정적 데이터 구조, `FRONTEND.md`의 API 레이어 원칙, `apps/api` OpenAPI 생성 파이프라인을 함께 검토한다.

## 2026-05-27 계획 수립 완료

- 설계 문서는 `docs/superpowers/specs/2026-05-27-web-api-client-design.md`에 작성했다.
- 구현 계획은 `docs/superpowers/plans/2026-05-27-web-api-client.md`에 작성했다.
- 권장 구조는 `apps/web` 내부에 API 포트, `openapi-fetch` 기반 HTTP 어댑터, 정적 데이터 기반 fake 어댑터를 함께 두는 방식이다.
- 생성 타입은 `apps/docs/openapi/writing-app-api.json`에서 `apps/web/src/lib/api/generated/writing-app-api.d.ts`로 만든다.
- 화면과 도메인 로직은 생성 타입과 HTTP 클라이언트에 직접 의존하지 않고, 프론트 내부 모델과 API 포트만 사용한다.
- 테스트는 fake 어댑터로 외부 없이 실행하고, HTTP 어댑터는 주입된 `fetch`로 요청 모양과 오류 매핑을 검증한다.

## 2026-05-27 구현 시작

- `codex/web-api-client` 브랜치에서 웹 API 클라이언트 전환 구현을 시작한다.
- 구현 순서는 `docs/superpowers/plans/2026-05-27-web-api-client.md`의 Task 1부터 Task 8까지 따른다.
- 시작 시점의 주요 범위는 `apps/web` API 포트, HTTP/fake 어댑터, 페이지 연결, 레슨 mutation 연결, 관련 문서 갱신이다.

## 2026-05-27 구현 완료

- `apps/web`에 OpenAPI 타입 생성 스크립트와 `openapi-fetch` 기반 HTTP 어댑터를 추가했다.
- 프론트 화면은 `WritingAppApi` 포트를 통해 데이터에 접근하며, fake 어댑터로 백엔드 없이 테스트할 수 있다.
- 코스 목록, 코스 상세, 레슨 조회, 진행 저장, 답변 저장, 레슨 완료, AI 피드백 호출 경로를 API 포트로 연결했다.
- 검증 명령은 test, typecheck, lint, build를 실행했다.
