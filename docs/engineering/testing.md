# 테스트 전략

## 목적

이 문서는 테스트 우선순위, 격리 원칙과 품질 판단 기준을 정의한다. 현재 test workspace, 명령, coverage 기준, fixture와 CI job은 root task와 각 workspace의 test 설정이 소유한다.

## 원칙

- 사용자에게 보이는 동작과 보안·데이터 경계를 먼저 검증한다.
- 순수 정책은 단위 테스트로, I/O와 transaction은 통합 테스트로, 공개 HTTP·UI 흐름은 경계 테스트로 검증한다.
- 테스트 편의를 위해 production 동작을 우회하거나 제품 코드에 조건문을 추가하지 않는다.
- 테스트 fixture는 명시적으로 만들고, 개발자 데이터·설정·실행 중 process를 재사용하거나 삭제하지 않는다.
- 실패 재현에 필요한 입력과 assertion은 test source에 두고, 특정 실행의 결과는 archive 보고서에 남긴다.

## 테스트 계층

| 계층     | 검증 대상                                                          |
| -------- | ------------------------------------------------------------------ |
| 단위     | 도메인 정책, parser, mapper, schema와 오류 변환                    |
| 서비스   | use case와 port의 성공·거부·재시도 의미                            |
| 통합     | persistence adapter, transaction, migration, 외부 provider adapter |
| HTTP     | request 검증, 인증·인가, response·header·오류 계약                 |
| UI       | 사용자 상태, 접근성, 오류와 loading·empty state                    |
| 브라우저 | 실제 runtime 조립에서의 핵심 사용자 흐름                           |
| 배포     | 설정 정합성, image smoke, bootstrap·복구 절차                      |

## 테스트 데이터와 인증

- DB fixture는 각 테스트가 열고 닫으며, 실패 경로에서도 자원을 정리한다.
- SQLite fixture는 추적 중인 statement를 모두 finalize한 뒤 strict close하고 파일을 즉시 제거한다. 강제 GC, 지연 또는 삭제 재시도로 수명주기 결함을 숨기지 않는다.
- browser와 E2E 테스트는 production OAuth가 아니라 테스트 전용 인증 설정을 사용한다.
- 테스트 전용 인증은 non-production 환경과 명시적 test 설정에서만 활성화한다.
- secret, 실제 사용자 데이터, production endpoint와 공유 storage를 fixture에 사용하지 않는다.

## 품질 기준

- 권한, 인증, migration, backup·restore, transaction, 입력 검증, 민감 데이터 보호 변경에는 회귀 테스트를 추가한다.
- coverage는 실행 가능한 source 전체를 대상으로 측정하되, 수치와 대상 목록은 coverage 설정과 CI 결과가 소유한다.
- 새 실행 경로는 baseline을 낮추는 방식으로 통과시키지 않는다.
- UI markup만 바뀐 경우에도 접근성 또는 해당 화면의 사용자 흐름 영향을 확인한다.
- flaky 실패는 재시도로 숨기지 않고 원인을 분리·기록한다.

## 실행과 검증

공개 검증 명령은 root `package.json`이 소유한다. 변경 범위에 맞는 lint, typecheck, test, build와 배포 검증을 선택하고, 실제 명령·입력·지원 환경은 manifest와 CI workflow를 확인한다.

개발자가 사용하는 이식 가능한 품질 gate와 generated frontend production runtime smoke는 Linux, Windows와 macOS에서 검증한다. Linux container·Ansible에 종속된 배포 검증은 Ubuntu 격리 환경에서 별도로 실행한다.

`check:document-drift`는 문서의 현재 코드 사실을 강제하지 않는다. 문서 구조, 내부 링크, 공개 실행 명령과 workspace import 참조를 검사하며, 제품 정책과 충돌하는 자료실 설명만 별도 회귀 대상으로 둔다.

## 검증 기록

특정 날짜의 실행 시간, toolchain, coverage 수치, CI 결과와 production 적용 여부는 living guide에 기록하지 않는다. 재현 가능한 검증 보고서는 기준 commit, 실행 시각·환경, 명령, 결과와 artifact 위치를 포함해 작업 완료 후 archive에 보관한다.
