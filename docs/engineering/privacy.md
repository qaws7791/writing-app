# 개인정보와 AI 데이터 사용

## 목적

이 문서는 개인정보와 학습 데이터를 사용하는 목적, 데이터 흐름, 최소화와 보존 기준을 정의한다. 현재 저장 필드, 보존 class와 삭제 실행 경로는 module schema, 관찰 event 계약과 삭제 application source가 소유한다. 이 문서는 법률 자문이나 외부 법률 검토 결과가 아니다.

## 데이터 맵

| 데이터 범주    | 수집·생성 경로와 사용 목적                                                                                                                                                                                                                                            | 보존 기준                                                                                                                                                | 파기·격리 방식                                                                                                                                                                                      | 외부 처리 경계                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 식별·인증      | 학습자 또는 인증 provider가 제공한 ID, 이메일, 이름, 이미지와 account·session을 로그인, 계정 관리, 메일 확인과 비밀번호 재설정에 사용한다.                                                                                                                            | 회원 유지 기간. 삭제 요청 즉시 session을 폐기하고 active system의 사용자 소유 데이터는 요청 후 5일 경계에서 정리한다. 만료 session은 일일 정리 대상이다. | 명시적 SQLite transaction이 사용자와 연결된 verification을 삭제한 뒤 사용자 row를 삭제하고 account·session·profile을 cascade 삭제한다. 삭제 요청 전 private marker 기록에 실패하면 요청도 실패한다. | Google OAuth와 Resend가 해당 흐름의 외부 검토 대상이다.                              |
| 답안·학습 상태 | 학습자가 작성한 레슨 답안·초안·독립 글과 서버가 생성한 진도·활동, 쓰기 점검을 저장, 재개, 완료 표시와 과제 점검 목적으로 사용한다.                                                                                                                                    | 회원 유지 기간과 삭제 요청 후 5일.                                                                                                                       | 사용자 정리 transaction이 초안·답안·글·점검·고지 확인·쓰기 event·진도·활동을 물리 삭제한다. 콘텐츠 revision과 쓰기 과제 발행본은 함께 삭제하지 않는다.                                              | 쓰기 점검 시 저장한 본문만 OpenAI에 전달한다. 레슨 답안은 외부 AI로 전달하지 않는다. |
| 요청·보안 신호 | 일반 요청은 route template, 결과와 지연을 운영 목적으로 기록한다. 검증된 IP와 제한된 User-Agent는 인증·인가·남용 판단의 security event에만 사용한다.                                                                                                                  | 일반 request log 30일, security log의 IP·User-Agent 90일.                                                                                                | 애플리케이션은 구조화 stdout event를 내보내며 일수 기반 파기는 외부 log sink가 집행해야 한다. 일반 request/security log를 SQLite에 복제하지 않는다.                                                 | 실제 외부 log sink와 운영자는 배포 환경에서 확정해야 한다.                           |
| 관리자 감사    | opaque actor·target ID, action, request ID, outcome과 필요 시 검증된 IP를 개인정보 조회와 고위험 변경의 책임 추적에 사용한다. MCP 변경은 실행 ID, nullable 승인 ID, 입력 digest와 MCP credential ID를 추가한다. 이메일·이름·답안·prompt 원문은 payload에 넣지 않는다. | 개인정보 조회·콘텐츠 생성·초안 저장·발행·보관·복원 1년, 사용자 상태 변경·삭제 3년.                                                                       | `retention_until` 경계의 bounded 일일 정리로 DB row를 물리 삭제한다.                                                                                                                                | 외부 log의 `audit.recorded`는 별도 class 정책을 따르며 DB 원장을 대체하지 않는다.    |
| MCP credential | Credential ID, SHA-256 digest, owner 관리자 ID, scope, 생성·만료·폐기 시각과 발급·폐기 lifecycle을 인증, 최소 권한, 즉시 폐기와 책임 추적에 사용한다. Raw token은 저장하지 않는다.                                                                                    | Credential row와 append-only lifecycle event는 감사 provenance를 위해 영속 보존한다.                                                                     | 발급 CLI는 raw token을 한 번만 반환한다. 폐기는 credential을 즉시 무효화하며 row와 lifecycle event는 삭제하지 않는다.                                                                               | Credential과 lifecycle event는 외부 처리자에게 전달하지 않는다.                      |
| DB backup      | active SQLite snapshot 전체를 재해 복구와 무결성 검증에 사용한다.                                                                                                                                                                                                     | 최대 30일.                                                                                                                                               | backup object lifecycle로 만료·삭제하고 복구 후보는 원본과 격리한다. 복구 뒤 snapshot 이후 삭제 marker를 재적용한다.                                                                                | S3 호환 private backup 저장소가 외부 검토 대상이다.                                  |
| 삭제 marker    | user ID와 삭제 요청 시각만 저장해 오래된 backup 복원으로 탈퇴 사용자가 부활하는 것을 막는다.                                                                                                                                                                          | backup 최대 수명인 30일보다 길게 보존한다. 정확한 기간은 외부 lifecycle 승인값이 소유한다.                                                               | 애플리케이션은 marker를 삭제하지 않는다. 승인된 private object lifecycle로만 만료한다.                                                                                                              | public 콘텐츠 asset과 분리한 private S3 호환 bucket·prefix를 사용한다.               |

현재 schema와 실행 경로는 [identity schema](../../packages/modules/identity/src/infrastructure/persistence/schema.ts), [learning schema](../../packages/modules/learning/src/infrastructure/persistence/schema.ts), [operations schema](../../packages/modules/operations/src/infrastructure/persistence/schema.ts), [관찰 event 계약](../../packages/infra/observability/src/events.ts), [일일 정리 명령](../../apps/api/src/scripts/maintenance-daily.ts), [삭제 marker adapter](../../apps/api/src/adapters/identity/deletion-marker-store.ts)와 [복구 재적용 명령](../../apps/api/src/scripts/reapply-deletion-markers.ts)에서 확인한다.

## 외부 처리자 검토 목록

| 후보                   | 전달 범위                                                                                        | 저장소에서 확인된 제한                                                                            | 출시 전 외부 검토가 필요한 사실                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Resend                 | 수신 이메일과 확인·재설정 메일                                                                   | API key, 메일 본문과 provider 원문을 log에 남기지 않는다.                                         | 계약 주체, 처리 지역, 재위탁, 보존·삭제, 국외 이전 고지와 계약                  |
| OpenAI                 | 쓰기 점검에 필요한 고정 과제 브리프와 학습자 본문                                                | 본문·prompt·점검 원문을 log·event·감사에 남기지 않는다. 모델 학습 사용을 제품 계약으로 금지한다.  | 계약 주체, 처리 지역, 보존·삭제, 학습 사용, 재위탁, 국외 이전과 고지            |
| 관리자 MCP client·모델 | 코스 콘텐츠, 운영 집계, 콘텐츠 변경 결과, opaque 사용자 ID·상태와 IP를 제외한 opaque 감사 식별자 | 사용자 목록·상세와 이미지 변경을 제공하지 않으며 token·tool 입력·tool 출력을 log에 남기지 않는다. | 계약 주체, 처리 지역, 보존·삭제, 학습 사용, 재위탁, 국외 이전과 관리자 승인     |
| S3 호환 storage        | public 콘텐츠 이미지, private 삭제 marker, private DB backup을 서로 다른 접근 경계로 저장        | marker에는 user ID와 요청 시각만 허용하고 public asset bucket과 분리한다.                         | 실제 사업자, region, 암호화·접근 통제, lifecycle, 삭제 증거, 재위탁과 국외 이전 |

표의 “처리자”는 기술적 데이터 흐름을 정리한 검토 후보 명칭이다. 한국 법령상 위탁·제3자 제공·국외 이전 중 어느 분류인지와 적법 근거는 저장소만으로 확인할 수 없으며 외부 법률 검토가 결정해야 한다. 실제 production 계약, region, DPA, subprocessor와 lifecycle 적용 증거도 현재 저장소에서 확인되지 않았다.

## 관리자 MCP 외부 처리

- 관리자 MCP server는 승인된 client가 요청한 조회 결과를 반환한다.
- 관리자 MCP server는 제한적 자동 콘텐츠 변경 결과를 반환한다.
- 관리자 MCP server는 owner가 서버에서 승인한 콘텐츠·사용자 변경 결과를 반환한다.
- 관리자 MCP server는 access token을 기존 관리자 HTTP API나 외부 모델에 전달하지 않는다.
- 운영자는 개인과 장치 조합마다 별도 credential을 발급하고 공유하지 않는다.
- 발급 CLI가 반환한 raw token은 승인된 개인 secret store로 즉시 옮긴다.
- 서버는 raw token 대신 SHA-256 digest만 저장한다.
- raw token과 digest는 request log, security audit, lifecycle event와 영속 변경 감사에 넣지 않는다.
- 감사 이벤트 결과는 `clientIp`를 제외한다.
- 사용자 변경 입력과 결과는 opaque 사용자 ID와 상태만 포함한다.
- 승인 요청은 access token, tool 원문, 이메일과 이름을 저장하지 않는다.
- 승인 요청은 대상 제목 또는 opaque 식별자, 상태, MCP credential ID, 입력 digest와 시각만 저장한다.
- 자동 실행 영수증은 실행 ID, owner 관리자 ID, MCP credential ID, Tool, 멱등 키, 입력 digest와 최소 결과 metadata만 저장한다.
- 승인 요청과 실행 영수증의 보존·삭제 기간이 승인되기 전에는 staging 변경 기능을 활성화할 수 없다.
- 외부 client 또는 모델은 처리 지역, 보존, 삭제, 학습 사용과 재위탁 조건을 owner 관리자가 승인하기 전 운영 데이터에 연결할 수 없다.
- 관리자 MCP 구현은 production 연결을 거부한다.

## 보존과 삭제

- 학습자 데이터 삭제는 자기 table을 소유한 module이 실행한다([ADR-0027](./adr/ADR-0027-learner-data-purge-module-ports.md)). 각 module이 `LearnerDataPurgePort` 구현을 공개하고 조립 지점이 FK 의존 순서를 고정한 배열로 순회하며, 전체가 하나의 SQLite transaction에서 원자적으로 실행된다. writing module은 글 원문, 점검, 고지 확인과 쓰기 event를 함께 삭제한다. 조립 지점 밖에서 다른 module의 table을 지우는 경로는 architecture 검사가 차단한다.
- 학습자 삭제 유예가 끝나면 사용자 소유 학습 데이터를 다른 module과 함께 정리한다.
- 보존 기간이나 provider 사용 목적을 바꾸려면 제품·보안·법률 검토와 사용자 고지 영향을 함께 확인한다.
- 현재 Compose의 Docker `json-file` 크기 회전은 30일·90일 class 파기의 증거가 아니다. production의 실제 일일 정리는 sink, class별 기간, 검증 시각과 유효기간을 가진 외부 증거 파일이 없으면 실패한다. 외부 sink 설정과 실제 삭제 증거가 마련되기 전에는 이 보존 요구를 충족했다고 판정하지 않는다.
- private 삭제 marker의 lifecycle이 backup 최대 수명보다 길다는 외부 설정·실행 증거도 별도로 확인해야 한다.

## 출시 법률 검토 gate

- 외부 법률 검토 결과, 승인된 서비스 약관·개인정보처리방침과 필요한 변경 티켓이 모두 확정될 때까지 production launch는 차단한다.
- 현재 외부 검토 결과는 없으며 완료로 표시하지 않는다. 검토 항목 목록은 [보관된 법률 검토 gate 기록](../archive/2026-07-24-confirmed-product-baseline/privacy-legal-review-gate.md)에 남아 있고, 그 작업 단위의 진행 추적은 중단됐다.
- 법률 검토가 AI 데이터 처리에 별도 동의를 요구하면 현재 범위를 조용히 넓히지 않는다. 별도 제품 요구·UI·철회·증거 저장 티켓을 승인받기 전까지 새로운 동의나 데이터 사용을 추가하지 않는다.
