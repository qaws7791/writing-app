# 배포 절차와 안전 기준

## 목적

이 문서는 production 배포의 승인, 실행, 검증과 복구 절차를 정의한다. 현재 service, image, port, network, proxy와 release 입력은 Compose, proxy 설정, Ansible과 workflow가 소유한다.

## 배포 전제

- production 변경은 검증된 불변 image reference만 사용하고 대상 서버에서 build하지 않는다.
- application listener와 운영 제어 surface는 필요한 공개 경계 밖으로 노출하지 않는다.
- 데이터 저장소는 단일 writer·명시적 lifecycle·독립 복구가 가능한 위치를 사용한다.
- secret과 production 설정은 Git에 저장하지 않고 승인된 secret 관리 경계를 통해 제공한다.
- 현재 topology가 이 전제를 지키는지는 `deploy/compose/`와 proxy 설정을 직접 확인한다.

## 승인과 실행

1. 배포 대상 revision, image reference, 공개 origin과 대상 inventory의 일치 여부를 확인하고 production deploy 승인 입력을 명시한다. 승인 입력이 없으면 playbook은 호스트 변경 전에 중단해야 한다.
2. 실행 중 DB의 SQLite snapshot을 격리 디렉터리에 복제하고 candidate API image로 migration과 read-only application 진단을 리허설한다. 이 단계가 실패하면 기존 writer를 중지하지 않는다.
3. migration 호환성과 rollback 가능 여부를 판정한다. 이전 코드와 호환되지 않는 데이터 변경은 별도 승인 없이는 진행하지 않는다.
4. 리허설 성공 뒤 operation lock을 보존 상태로 전환하고 writer를 중지한다. 중지된 DB의 최종 검증 백업을 만든 뒤 실제 migration, DB 진단, 기동과 health·주요 읽기 smoke를 실행한다.
5. 성공한 revision과 검증 결과를 deployment record와 CI artifact에 남긴다.

## 실패와 복구

- health 또는 smoke가 실패하면 새 revision을 정상 상태로 기록하지 않는다.
- 렌더링된 배포 입력의 fingerprint는 DB 검증과 서비스 health가 모두 성공한 뒤에만 검증 성공 marker로 기록한다. marker가 없거나 현재 입력과 다르면 같은 설정의 재실행도 전체 리허설·백업·migration 경로를 다시 거치고, bind-mounted 설정까지 반영되도록 서비스를 재생성해야 한다.
- 실제 DB 변경이 시작된 뒤 실패하면 operation lock을 자동 해제하지 않고 배포별 backup 디렉터리에 실패 단계와 수동 복구 안내를 기록한다.
- 코드 rollback과 데이터 복구는 별도 절차다. 코드 rollback이 데이터를 과거 시점으로 되돌리는 근거가 되지 않는다.
- 복구는 현재 실행 중인 revision, backup source, migration 상태와 영향 범위를 기록한 뒤 승인된 runbook으로 실행한다.
- 실패한 배포와 복구 결과는 기준 commit, 환경, 명령, 결과를 고정한 검증 기록으로 남긴다.

## 검증 경계

정적 설정 검증, image smoke, host bootstrap, 실제 deploy와 복구 훈련은 서로 다른 위험 수준이다. 각 명령의 현재 이름·입력·실행 환경은 root task, CI workflow와 deployment automation source를 확인한다. 운영 서버나 개발자의 기존 데이터를 대상으로 destructive 검증을 실행하지 않는다.

runtime OpenAPI는 등록 route에서 생성하므로 정적 사본을 보존하지 않고 계약 테스트로 재생성 가능성을 검증한다. migration SQL은 application migration source를 Git에 보존한다. Storybook 정적 산출물은 source가 아니며 필요할 때 manifest의 build task로 재생성한다. 현재 source는 API route·migration directory와 Storybook manifest를 직접 확인한다.

## 변경 검토

- topology나 외부 연결 경계를 바꾸면 Compose·proxy·automation과 보안·관찰·rollback 문서를 함께 검토한다.
- image, base image, secret store, cloud provider 또는 데이터 저장소를 바꾸면 재현성·복구 가능성·비용·운영 복잡도를 ADR에서 비교한다.
- production 적용 성공은 실제 검증 보고서가 있을 때만 주장한다.
