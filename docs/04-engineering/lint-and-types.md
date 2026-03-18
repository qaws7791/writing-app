# Lint and Types

## 패키지 역할

- `packages/eslint-config`: ESLint 규칙 프리셋
- `packages/typescript-config`: TypeScript 설정 프리셋

## 현재 의도

- 루트와 각 앱, 패키지에서 공통 기준을 재사용한다.
- 형식보다 경계, 의미, 의존성 구조를 강제하는 데 초점을 둔다.

## 확인해야 할 것

- 새 앱과 패키지가 추가되면 공통 설정을 재사용하는지 확인한다.
- React, Next.js, 내부 패키지용 규칙이 책임에 맞게 분리되어 있는지 확인한다.

## 문서 갱신 시점

- 새 규칙 추가
- 경계 규칙 강화
- 타입스크립트 프리셋 변경
