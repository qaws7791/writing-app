# ADR-0040: Cloudflare 로컬 실행과 D1 저장

상태: 채택

## 결정

Cloudflare runtime으로 실행 경계를 통합한다. API는 Worker binding을 주입받는다. 프론트엔드는 vinext로 기존 App Router API를 실행한다. 로컬 개발은 같은 Worker 실행 모델과 D1·R2 에뮬레이터를 사용한다.

D1을 선택한다. 동기식 SQLite transaction은 비동기 SQL batch로 전환한다. version 조건과 batch 내부 검사로 경합과 부분 저장을 방지한다. 운영 데이터가 없으므로 기존 SQLite 파일의 자동 이관은 구현하지 않는다.

## 대안과 영향

기존 VPS와 SQLite를 유지하면 Cloudflare 전환 요구를 충족하지 못한다. 별도 PostgreSQL은 데이터베이스 운영 경계를 남긴다. D1은 저장 코드를 변경해야 하지만 관리형 인프라와 로컬 에뮬레이터를 함께 제공한다.

vinext와 Miniflare의 현재 버전에는 출시 전 검증이 필요하다. 원격 인증·배포·복구는 보류한다. 현재 실행 절차의 권위는 [런타임 설정 원칙](../runtime-configuration.md)이다. 원격 재개 조건의 권위는 [배포 기준](../deployment.md)이다.
