# ADR-0022: 현재 스키마 시대와 단일 baseline

## 상태

채택됨

## 날짜

2026-07-24

## 맥락

런타임 migration은 baseline, module 소유권 전환, FK 복원, curriculum·자료실·MFA legacy와 부분 schema를 모두 판별했다. 이미 최종 schema가 DB 제약으로 불변식을 소유하는데도 API 기동·진단·backup·로컬 setup과 테스트가 과거 상태를 계속 재현해 변경 비용과 오판 표면을 키웠다.

저장소 fixture로 최종 schema 동등성은 검증할 수 있지만 운영·스테이징 DB와 보존 backup의 실제 상태는 이 작업에서 확인할 수 없다. 따라서 운영 전환 성공은 추론하지 않는다.

## 결정

- 현재 최종 schema를 신규 DB용 baseline 하나로 만든다. 과거 migration SQL과 legacy 데이터 변환기는 현재 runtime 계보에서 제거한다.
- baseline migration ID와 checksum을 현재 schema era 선언으로 사용한다. runtime은 빈 DB와 이 선언으로 시작하는 연속된 append-only 계보만 지원한다.
- runtime 진단은 migration 이력, `integrity_check`와 `foreign_key_check`를 신뢰한다. 과거 schema 모양을 판별하거나 모든 table·FK 정의를 별도 목록으로 재검증하지 않는다.
- 최종 이전 계보를 현재 era로 바꾸는 작업은 application 기동과 분리한 일회성 도구가 소유한다. 이 도구는 정확한 이전 계보, SQLite 검사와 검증 백업을 요구하고 migration 이력만 transaction으로 교체한다.
- 운영 인벤토리와 복구 증적이 확인되면 일회성 도구와 배포 surface를 제거한다.

## 대안과 트레이드오프

과거 append-only 계보를 영구 보존하면 기존 DB를 한 binary로 계속 올릴 수 있지만, 모든 신규 변경이 과거 상태 판별과 회귀 fixture 비용을 부담한다. runtime에서 최종 schema를 자동 채택하면 전환은 편하지만 변조되거나 부분적인 DB를 정상으로 선언할 위험이 있다. DB를 새로 만들고 데이터를 재적재하면 계보는 단순하지만 사용자 데이터 보존과 복구 위험이 가장 크다.

선택한 방식은 정상 기동 경로와 테스트 규모를 줄여 유지보수성과 시작 성능을 높이고, 자동 채택을 없애 보안·데이터 안전성을 높인다. 대신 첫 전환에 운영 조정과 code-only rollback 제한이 생긴다. 단일 SQLite 배포 경계에서는 이 비용이 지속적인 legacy 호환 비용보다 작다고 판단했다.

## 검증과 후속

fresh baseline 생성, DB 제약, 현재 schema backup·독립 application read, 이전 최종 계보의 원자적 era 전환과 변조 거부를 자동화한다. 실제 대상별 전환은 operation lock, writer 중지, backup 경로와 복원 smoke를 포함한 archive 보고서가 필요하다.

이 결정은 ADR-0019의 과거 계보 영구 보존과 known-state adoption, ADR-0021의 운영 inventory 확인 전 legacy runtime 유지 결정을 대체한다. 두 문서의 역사적 맥락은 유지한다.
