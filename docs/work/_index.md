# 진행 중 작업 인덱스

## 목적

`docs/work`는 구현 계획, 조사, 감사와 검증처럼 한시적 효력을 가진 문서를 작업 단위로 관리한다. 이 디렉터리의 문서는 현재 제품이나 시스템 사실의 권위 소스가 아니다.

## 이름과 생명주기

- 작업 디렉터리는 `yyyy-mm-dd-name` 형식을 사용한다.
- 하나의 작업에 계획, 조사와 결과가 함께 있으면 같은 디렉터리에 둔다.
- 영구적으로 유지할 결론은 완료 전에 관련 `product`, `design`, `engineering` 문서나 ADR에 반영한다.
- 작업이 끝나거나 폐기되면 디렉터리 전체를 같은 이름의 `docs/archive/<yyyy-mm-dd-name>/`로 이동한다. 복사본을 남기지 않는다.

## 진행 중 작업

| 작업                                 | 문서                                                                                                                                                                                                                                                                                                                                             | 상태                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| 확정 제품 기준선 전환                | [`plan.md`](./2026-07-24-confirmed-product-baseline/plan.md), [`session-handoff.md`](./2026-07-24-confirmed-product-baseline/session-handoff.md), [`validation-report.md`](./2026-07-24-confirmed-product-baseline/validation-report.md), [`privacy-legal-review-gate.md`](./2026-07-24-confirmed-product-baseline/privacy-legal-review-gate.md) | 저장소 내부 완료, 외부 승인·실환경 gate 대기    |
| 코드베이스 건강성 복구와 검증        | [`2026-07-23-codebase-health-validation/plan.md`](./2026-07-23-codebase-health-validation/plan.md)                                                                                                                                                                                                                                               | 구현과 검증 진행 중                             |
| 저장소 온보딩과 프로덕션 배포 자동화 | [`2026-07-16-repository-onboarding-production-deployment/plan.md`](./2026-07-16-repository-onboarding-production-deployment/plan.md)                                                                                                                                                                                                             | 일부 구현 완료, 외부 검증과 후속 자동화 진행 중 |
| 코드베이스 재구축 수준 진단          | [`2026-07-30-codebase-rebuild-diagnosis/00-summary.md`](./2026-07-30-codebase-rebuild-diagnosis/00-summary.md) 및 같은 디렉터리의 `01`~`07` 문서                                                                                                                                                                                                 | 조사·설계 완료, 실행 착수 대기                  |

## 사용 기준

- 현재 사실은 먼저 `docs/authority-map.md`의 권위 소스에서 확인한다.
- 작업 문서가 영구 문서와 충돌하면 작업 문서를 현재 구현의 근거로 사용하지 않는다.
- 새 작업을 추가하거나 archive로 이동할 때 이 인덱스를 갱신한다.
