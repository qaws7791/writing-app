# P0·P1 아키텍처 정리

## 목표

코스 스텝 편집을 실제 draft 저장 경로에 연결하고, 소비자가 없는 이벤트 배관을 제거한다. 서버와 container의 cleanup 소유권을 하나로 만들고, application migration을 유일한 배포 이력 권위자로 정리한 뒤 단일 SQLite 경계의 참조 무결성 정책을 명시적으로 확정한다.

## 실행 순서

1. 고립된 스텝 폼을 reducer와 전체 editor 문서 저장에 연결된 구현으로 교체한다.
2. 프로덕션 subscriber가 없는 event bus, event contract와 module 발행 배관을 제거한다.
3. server lifecycle은 drain과 stop만, container는 resource cleanup만 소유하도록 통합한다.
4. module migration 공개 entrypoint를 제거하고 repository test의 current schema 생성 경로를 통일한다.
5. cross-module FK 정책을 ADR로 확정하고 append-only migration과 진단 경계를 갱신한다.

## 완료 조건

- 코스 편집에서 확정 스텝 타입을 추가·수정·삭제·정렬하고 저장 결과를 다시 읽을 수 있다.
- 프로덕션 event publisher, subscriber와 event 전용 workspace가 남지 않는다.
- 정상 종료와 초기화 실패가 같은 container cleanup coordinator를 사용하며 DB와 logger cleanup이 항상 시도된다.
- 배포 migration 이력의 권위자는 application migration 하나다.
- FK 복원 전 orphan 검사가 통과하고 관계별 삭제 정책과 supporting index가 테스트로 고정된다.
- lint, format, typecheck, 관련 unit·integration test와 build가 통과한다.

## 보류 조건

운영 DB와 보존 backup inventory로 현재 schema 상태가 확인되기 전에는 legacy migration 호환 경로를 삭제하지 않는다.

## 결과

- 스텝 폼은 제품 문서의 편집 요구를 근거로 삭제하지 않고 실제 course editor reducer와 draft 저장 경로에 연결했다.
- 프로덕션 subscriber가 없음을 전체 검색으로 확인한 뒤 event bus, event contract와 module 발행 배관을 제거했다.
- server lifecycle은 요청 drain·취소·server stop을, container는 AI·DB·logger 정리를 소유하도록 통합했다.
- module별 TypeScript migration을 제거하고 application SQL migration을 유일한 배포 이력 권위자로 정리했다.
- `0002-cross-module-reference-integrity.sql`에서 관계별 `CASCADE`·`RESTRICT` 정책으로 cross-module FK를 복원하고 수동 dangling-reference 전체 스캔을 제거했다.
- 운영 DB와 보존 backup inventory는 이 작업 환경에서 검증하지 못했다. 따라서 legacy migration 호환 경로는 유지했으며, production 적용 전 inventory 조회와 backup restore rehearsal이 필요하다.

## 검증

- `bun run lint`
- `bun run format:check`
- `bun run typecheck`
- `bun run test`
- `bun run build`
