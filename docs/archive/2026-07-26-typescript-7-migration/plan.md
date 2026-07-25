# TypeScript 7 마이그레이션

## 목표

모든 workspace의 타입 검사를 TypeScript 7 native compiler로 실행하고, 제거된 설정과 변경된 기본 동작을 현재 저장소 계약에 맞게 전환한다.

## 작업

- `baseUrl` 제거와 상대 `paths`, ambient type, side-effect import 계약을 정리한다.
- Next route type 생성과 architecture graph처럼 programmatic TypeScript API가 필요한 도구에만 TypeScript 6 호환 API를 격리한다.
- 전체 정적 검사, 테스트와 production build를 실행해 결과를 고정한다.
