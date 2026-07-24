# 개인정보와 AI 데이터 사용

## 목적

이 문서는 개인정보와 학습 데이터를 사용하는 목적, 데이터 흐름, 최소화와 보존 기준을 정의한다. 현재 저장 필드, 보존 class와 삭제 실행 경로는 module schema, 관찰 event 계약과 삭제 application source가 소유한다. 이 문서는 법률 자문이나 외부 법률 검토 결과가 아니다.

## 데이터 맵

| 데이터 범주    | 수집·생성 경로와 사용 목적                                                                                                                                                          | 보존 기준                                                                                                                                                                         | 파기·격리 방식                                                                                                                                                  | 외부 처리 경계                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 식별·인증      | 학습자 또는 인증 provider가 제공한 ID, 이메일, 이름, 이미지와 account·session을 로그인, 계정 관리, 메일 확인과 비밀번호 재설정에 사용한다.                                          | 회원 유지 기간. 삭제 요청 즉시 session을 폐기하고 active system의 사용자 소유 데이터는 요청 후 5일 경계에서 정리한다. 만료 session은 일일 정리 대상이다.                          | 명시적 SQLite transaction이 사용자 row를 삭제하고 account·session·profile을 cascade 삭제한다. 삭제 요청 전 private marker 기록에 실패하면 요청도 실패한다.      | Google OAuth와 Resend가 해당 흐름의 외부 검토 대상이다.                           |
| 답안·학습 상태 | 학습자가 작성한 답안·초안과 서버가 생성한 진도·활동을 학습 저장, 재개와 완료 표시 목적으로 사용한다.                                                                                | 회원 유지 기간과 삭제 요청 후 5일.                                                                                                                                                | 사용자 정리 transaction이 초안·답안·진도·활동을 물리 삭제한다. 콘텐츠 revision은 함께 삭제하지 않는다.                                                          | AI 코칭을 요청한 답안만 아래 OpenAI 경계로 전달한다.                              |
| AI 피드백      | 학습자 답안과 레슨 맥락으로 코칭을 만들고, attempt 상태·결과·quota·제한된 품질 metadata를 멱등 처리, 결과 표시, 비용·장애 관리에 사용한다.                                          | 사용자 식별 attempt·feedback은 답안과 함께 삭제 요청 후 5일 경계에서 삭제한다. pending attempt는 자체 만료 시각에 따라 정리한다. 원문 없는 AI usage event는 1년 class를 사용한다. | 사용자별 attempt·quota를 transaction으로 삭제한다. 만료 pending은 원문을 추가 기록하지 않고 실패 상태로 전환하며, 외부 log는 class 보존 정책으로 파기해야 한다. | OpenAI에는 레슨 제목, 코칭 초점과 대상 답안만 전달한다.                           |
| 요청·보안 신호 | 일반 요청은 route template, 결과와 지연을 운영 목적으로 기록한다. 검증된 IP와 제한된 User-Agent는 인증·인가·남용 판단의 security event에만 사용한다.                                | 일반 request log 30일, security log의 IP·User-Agent 90일.                                                                                                                         | 애플리케이션은 구조화 stdout event를 내보내며 일수 기반 파기는 외부 log sink가 집행해야 한다. 일반 request/security log를 SQLite에 복제하지 않는다.             | 실제 외부 log sink와 운영자는 배포 환경에서 확정해야 한다.                        |
| 관리자 감사    | opaque actor·target ID, action, request ID, outcome과 필요 시 검증된 IP를 개인정보 조회와 고위험 변경의 책임 추적에 사용한다. 이메일·이름·답안·prompt 원문은 payload에 넣지 않는다. | 개인정보 조회·콘텐츠 발행·보관 1년, 사용자 상태 변경·삭제 3년.                                                                                                                    | `retention_until` 경계의 bounded 일일 정리로 DB row를 물리 삭제한다.                                                                                            | 외부 log의 `audit.recorded`는 별도 class 정책을 따르며 DB 원장을 대체하지 않는다. |
| DB backup      | active SQLite snapshot 전체를 재해 복구와 무결성 검증에 사용한다.                                                                                                                   | 최대 30일.                                                                                                                                                                        | backup object lifecycle로 만료·삭제하고 복구 후보는 원본과 격리한다. 복구 뒤 snapshot 이후 삭제 marker를 재적용한다.                                            | S3 호환 private backup 저장소가 외부 검토 대상이다.                               |
| 삭제 marker    | user ID와 삭제 요청 시각만 저장해 오래된 backup 복원으로 탈퇴 사용자가 부활하는 것을 막는다.                                                                                        | backup 최대 수명인 30일보다 길게 보존한다. 정확한 기간은 외부 lifecycle 승인값이 소유한다.                                                                                        | 애플리케이션은 marker를 삭제하지 않는다. 승인된 private object lifecycle로만 만료한다.                                                                          | public 콘텐츠 asset과 분리한 private S3 호환 bucket·prefix를 사용한다.            |

현재 schema와 실행 경로는 [identity schema](../../packages/modules/identity/src/infrastructure/persistence/schema.ts), [learning schema](../../packages/modules/learning/src/infrastructure/persistence/schema.ts), [AI feedback schema](../../packages/modules/ai-feedback/src/infrastructure/persistence/schema.ts), [operations schema](../../packages/modules/operations/src/infrastructure/persistence/schema.ts), [관찰 event 계약](../../packages/infra/observability/src/events.ts), [일일 정리 명령](../../apps/api/src/scripts/maintenance-daily.ts), [삭제 marker adapter](../../apps/api/src/adapters/identity/deletion-marker-store.ts)와 [복구 재적용 명령](../../apps/api/src/scripts/reapply-deletion-markers.ts)에서 확인한다.

## 외부 처리자 검토 목록

| 후보            | 전달 범위                                                                                 | 저장소에서 확인된 제한                                                                             | 출시 전 외부 검토가 필요한 사실                                                  |
| --------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Resend          | 수신 이메일과 확인·재설정 메일                                                            | API key, 메일 본문과 provider 원문을 log에 남기지 않는다.                                          | 계약 주체, 처리 지역, 재위탁, 보존·삭제, 국외 이전 고지와 계약                   |
| OpenAI          | 레슨 제목, 코칭 초점, 대상 답안과 생성 결과                                               | 다른 profile·학습 기록·browser 요청 원문은 전달하지 않고 모델 학습 데이터셋으로 재사용하지 않는다. | API 데이터 사용 조건, 처리 지역, 보존·삭제, 재위탁, 국외 이전과 필요한 동의·고지 |
| S3 호환 storage | public 콘텐츠 이미지, private 삭제 marker, private DB backup을 서로 다른 접근 경계로 저장 | marker에는 user ID와 요청 시각만 허용하고 public asset bucket과 분리한다.                          | 실제 사업자, region, 암호화·접근 통제, lifecycle, 삭제 증거, 재위탁과 국외 이전  |

표의 “처리자”는 기술적 데이터 흐름을 정리한 검토 후보 명칭이다. 한국 법령상 위탁·제3자 제공·국외 이전 중 어느 분류인지와 적법 근거는 저장소만으로 확인할 수 없으며 외부 법률 검토가 결정해야 한다. 실제 production 계약, region, DPA, subprocessor와 lifecycle 적용 증거도 현재 저장소에서 확인되지 않았다.

## AI 코칭

- 저장된 쓰기 답안은 학습자가 요청한 코칭을 생성하는 목적으로만 사용하며 모델 학습 데이터로 재사용하지 않는다.
- provider에는 해당 레슨 제목, 코칭 초점과 대상 쓰기 답안만 전달한다. 다른 profile·학습 기록과 브라우저 요청 원문은 전달하지 않는다.
- 코칭 attempt는 멱등 재생, 성공 횟수·일일 quota, 장애 복구와 학습자 결과 표시를 위해 저장한다.
- 사용자별·전체 일일 quota counter는 비용 폭주와 남용 방지 목적으로만 사용한다. 설정 가능한 현재 기본값은 실제 traffic·비용 근거 전의 엔지니어링 추론이며 사용자 등급이나 제품 entitlement로 해석하지 않는다.
- 서비스 품질 분석은 model, prompt policy version, 결과·실패 code, latency, token과 재시도 횟수만 사용한다. 답안, prompt와 피드백 원문은 분석 log와 품질 조회에 포함하지 않는다.
- 품질 조회를 외부 운영 interface로 제공할 때는 owner 인증, private no-store와 최소 권한을 적용한다.

## 보존과 삭제

- AI usage log는 관찰 event의 보존 class를 따르고 원문을 포함하지 않는다.
- 학습자 삭제 유예가 끝나면 사용자 식별자가 있는 AI attempt와 사용자별 quota를 다른 사용자 소유 학습 데이터와 함께 정리한다. 사용자 식별자가 없는 전체 quota 집계는 보존할 수 있다.
- 보존 기간이나 provider 사용 목적을 바꾸려면 제품·보안·법률 검토와 사용자 고지 영향을 함께 확인한다.
- 현재 Compose의 Docker `json-file` 크기 회전은 30일·90일 class 파기의 증거가 아니다. production의 실제 일일 정리는 sink, class별 기간, 검증 시각과 유효기간을 가진 외부 증거 파일이 없으면 실패한다. 외부 sink 설정과 실제 삭제 증거가 마련되기 전에는 이 보존 요구를 충족했다고 판정하지 않는다.
- private 삭제 marker의 lifecycle이 backup 최대 수명보다 길다는 외부 설정·실행 증거도 별도로 확인해야 한다.

## 출시 법률 검토 gate

- 외부 법률 검토 결과, 승인된 서비스 약관·개인정보처리방침과 필요한 변경 티켓이 모두 확정될 때까지 production launch는 차단한다.
- 검토 항목과 미확인 증거는 [법률 검토 gate 작업 문서](../work/2026-07-24-confirmed-product-baseline/privacy-legal-review-gate.md)에서 추적한다. 현재 외부 검토 결과는 없으며 완료로 표시하지 않는다.
- 법률 검토가 AI 데이터 처리에 별도 동의를 요구하면 현재 범위를 조용히 넓히지 않는다. 별도 제품 요구·UI·철회·증거 저장 티켓을 승인받기 전까지 새로운 동의나 데이터 사용을 추가하지 않는다.
