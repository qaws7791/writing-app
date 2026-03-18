# Development Setup

## 전제 조건

- Bun `1.3.10`
- Node.js `20+`

## 루트 스크립트

- `bun dev`: 전체 개발 서버 실행
- `bun build`: 전체 빌드
- `bun lint`: 전체 린트
- `bun typecheck`: 전체 타입 검사
- `bun storybook`: Storybook 실행
- `bun build-storybook`: Storybook 빌드

## 현재 개발 방식

- 워크스페이스는 `apps/*`, `packages/*`로 구성됩니다.
- 루트 오케스트레이션은 `turbo.json`이 담당합니다.
- `prepare` 스크립트로 `lefthook`를 설치합니다.

## 문서화 원칙

- 새로운 앱이나 패키지를 추가하면 이 문서와 `monorepo-structure.md`를 함께 갱신합니다.
- 실제 구현되지 않은 인프라 선택은 별도 계획 문서로 구분합니다.
