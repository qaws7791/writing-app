# Monorepo Structure

## 최상위 구조

- `apps`: 실행 가능한 애플리케이션
- `packages`: 재사용 가능한 내부 패키지

## 앱 책임

- `apps/web`: 사용자 대상 제품 UI
- `apps/api`: 서버 로직과 HTTP 인터페이스
- `apps/storybook`: 디자인 시스템 검증과 시각적 문서화

## 패키지 책임

- `packages/ui`: 공용 컴포넌트, 스타일, 훅
- `packages/eslint-config`: 린트 규칙
- `packages/typescript-config`: 타입스크립트 설정 프리셋

## 의존 방향

- 앱은 패키지를 의존할 수 있다.
- UI는 제품 정책이나 인프라 세부사항을 직접 알지 않아야 한다.
- 공용 설정 패키지는 실행 로직을 포함하지 않는다.
