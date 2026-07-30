# 코드베이스 건강성 복구와 검증

## 목표

레거시 curriculum 데이터 보존, SQLite 종료 결정성, Web·Admin production runtime, AI provider 경계와 다중 운영체제 품질 게이트에서 확인된 결함을 수정한다. 실제 production에는 배포하지 않고 검증된 DB 사본과 disposable Ubuntu 배포 리허설까지 수행한다.

## 실행 순서

1. archived hierarchy와 학습자 참조를 보존하는 migration 및 schema-aware DB 진단을 완성한다.
2. SQLite statement를 결정적으로 finalize하고 Windows 파일 잠금 우회를 제거한다.
3. public origin 기반 CSP, Next standalone 실행과 stateless AI provider를 적용한다.
4. setup·doctor와 배포 사전 리허설을 fail-closed하게 만들고 세 운영체제 CI를 확장한다.
5. 전체 품질·사용자 흐름·복구 검증을 실행하고 결과를 이 작업 단위에 기록한다.

## 완료 조건

lint, format, typecheck, 전체 test·coverage, Storybook, build, browser E2E와 production runtime smoke가 통과해야 한다. 기존 로컬 DB는 검증 백업과 사본 migration이 성공한 뒤에만 변경하며, production VPS와 production DB는 이 작업에서 변경하지 않는다.

## 2026-07-23 검증 결과

- Windows에서 lint, format, typecheck, 캐시 없는 전체 workspace test 22개 task, 22개 runtime workspace coverage, Storybook 179개 test, script 169개 test와 28개 workspace build가 통과했다.
- 격리된 Web·Admin·API browser E2E 3개 흐름과 Web·Admin standalone production runtime, CSS sentinel·route bundle 예산이 통과했다.
- 기존 로컬 DB는 `data/backups/health-validation-20260723T105329257Z-api.sqlite`와 `data/backups/setup-20260723T105337166Z-api.sqlite` 검증 및 사본 migration 성공 뒤 현재 schema로 이관했다. `doctor`와 application reconciliation 결과는 `current/ok`, integrity `ok`, FK·dangling reference 0건이다.
- Compose·Ansible·image smoke의 정적·구조 계약은 통과했으며 실패 후 동일 입력 배포도 검증 성공 marker가 없으면 전체 안전 절차를 다시 실행한다.
- 현재 Windows 호스트에는 Linux Docker daemon, WSL 가상화와 Ansible이 없어 실제 Linux image smoke와 disposable Ubuntu bootstrap·deploy·restore 리허설은 실행하지 못했다. 이 동적 검증이 CI에서 통과할 때까지 작업 단위를 진행 중으로 유지하며 production에는 배포하지 않았다.
