# P6 구현 증거

## 경계와 소유권

| 구분                                      | P6 이후 소유자                                          | 협력 경계                                                                |
| ----------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| prompt·provider 결과·attempt 정책         | `@workspace/ai-feedback` domain·application             | learning이 제공한 저장 답안 문맥만 `requestFeedback`에 전달              |
| attempt table·repository·provider adapter | ai-feedback infrastructure                              | DB·OpenAI primitive만 사용하고 다른 module table은 조회하지 않음         |
| AI 코칭 HTTP·wire contract                | ai-feedback HTTP와 `@workspace/contracts/ai-feedback/*` | 기존 step-scoped path를 유지하고 독립 `/ai-feedback` route는 만들지 않음 |
| 답안·lesson 문맥과 학습 진행              | legacy learning capability                              | P7 전까지 API composition이 prepare·complete port를 연결                 |

기존 core ai-feedback, API 소유 repository·provider·route와 DB infra의 feedback schema는 제거했다. package interface 검사는 이 source와 schema 재공개, ai-feedback의 다른 비즈니스 module 직접 의존, learning repository의 attempt table 접근을 다시 허용하지 않는다.

## 검증된 구현

- domain은 provider에 레슨 제목·coaching 초점·저장 답안만 전달하고, 응답 필드·길이·점수 `0..100`, 완료 attempt 상한, pending lease와 terminal 전이를 검증한다. application 오류는 quota, in-progress, unavailable, timeout, abort, invalid response와 persistence 실패를 구분한다.
- attempt 예약·완료는 짧은 transaction이고 provider I/O 동안 write transaction을 열지 않는다. OpenAI SDK retry는 이 흐름에서 0으로 고정해 provider 재시도가 quota·idempotency 의미를 우회하지 않는다.
- provider 성공 결과를 attempt에 먼저 저장하고 learning 진행을 뒤에서 전이한다. 후자가 실패해도 AI 결과는 유지되며 동일 key 재시도는 provider를 다시 호출하지 않고 저장 결과를 재생해 learning 전이만 다시 시도한다.
- 기존 table row·index를 보존하면서 cross-module FK를 제거하는 idempotent migration을 API migration·seed·runtime composition에 연결했다. runtime repository는 branded 참조 ID만 저장한다.
- 기존 공개 path·method·응답은 유지했다. pending lease는 실제 남은 초를 `Retry-After`로 반환하고, 시간 경과로 해소되지 않는 완료 상한에는 잘못된 header를 넣지 않는다. provider 원문·prompt는 typed 오류, HTTP body와 관측 event에 포함되지 않는다.

## 자동 검증

권위 도구인 Bun 1.3.10과 Node.js 24.x에서 확인한 결과다.

| 검증                   | 결과                                                                           |
| ---------------------- | ------------------------------------------------------------------------------ |
| install                | 921 installs·1159 packages, frozen lockfile 통과                               |
| ai-feedback            | domain·application·repository·provider·HTTP 6 files·28 tests 통과              |
| 관련 회귀              | AI infra 1 file·6 tests, contracts 12·56, core 12·83, DB 5·28, API 47·232 통과 |
| root test·typecheck    | test 20 tasks, typecheck 25 tasks 통과                                         |
| architecture·interface | 26-workspace graph, dead-code, package interface와 document drift 통과         |
| root build             | 공개 검증 origin으로 Web·Admin Turbopack과 Storybook 3 tasks 통과              |
| root lint·format       | 전체 정적 검사·Oxlint와 Oxfmt 통과                                             |

Storybook의 vendor `use client`, circular chunk와 기존 chunk-size warning은 종료 코드를 실패시키지 않았고 P6 source에서 생긴 warning은 아니다.

## 선택과 trade-off

- provider I/O를 DB transaction 밖으로 분리하면 lock 시간과 장애 전파는 줄지만 AI 결과와 learning 진행을 단일 ACID transaction으로 묶을 수 없다. 저장 결과 우선·동일 key 재생은 이 불일치를 복구 가능하게 만들며, 장기적으로 P7 learning module도 같은 application port를 직접 주입받아 현재 API bridge를 제거한다.
- SDK 자동 retry를 0으로 두면 한 요청의 비용·quota 의미가 결정적이지만 일시 오류 성공률은 낮아질 수 있다. 재시도는 새 사용자 요청과 명시적 idempotency 정책으로만 수행한다.
- cross-module FK 제거는 module 독립성과 migration 순서를 개선하지만 DB가 참조 무결성을 대신 보장하지 않는다. migration 사전 검사와 learning prepare port가 현재 방어선이며, 주기적 무결성 감사가 필요해질지는 운영 데이터로 판단한다.

## 추론과 제한

전체 계약·회귀 test와 production build를 근거로 기존 사용자 동작이 유지됐다는 결론은 강한 추론이지만 production traffic 검증은 아니다. 실제 OpenAI 호출, 운영 DB migration, 부하·지연, process crash 직후 replay와 다중 API instance 경쟁은 수행하지 않았으므로 검증된 사실로 간주하지 않는다.
