# 마이그레이션

이 문서는 데이터, 스키마, 인프라 마이그레이션 절차와 롤백 조건을 설명하는 단일 진실 원천이다.

## 현재 마이그레이션 모델

- 현재 DB baseline은 `packages/db/src/migrations/0000-writing-app-baseline.sql`이다.
- 마이그레이션 실행 진입점은 `packages/db/src/migrations/migrate.ts`다.
- 현재 방식은 누적 migration 체인이 아니라 baseline SQL 적용 방식이다.
- 최종 자료실 트리·Markdown·Yjs·감사·FTS5 schema도 같은 baseline에 포함하며 별도 자료실 migration 명령은 두지 않는다.
- 운영 데이터 이전이 필요해지면 별도 migration 계획과 ADR을 작성한다.

## 명령

| 목적                    | 명령                                    | 사용 환경              |
| ----------------------- | --------------------------------------- | ---------------------- |
| baseline migration 적용 | `bun --filter @workspace/db db:migrate` | 로컬, 운영 배포 전     |
| 콘텐츠 seed 적용        | `bun --filter @workspace/db db:seed`    | 로컬, 명시적 운영 절차 |
| 학습자 앱 로컬 준비     | `bun run dev:app:setup`                 | 로컬                   |
| 개발 DB 초기화          | `bun run db:reset`                      | 저장소 `data/` 하위 DB |
| 깨끗한 학습자 앱 시작   | `bun run dev:app:fresh`                 | 로컬 전용              |

## 기본 절차

1. 변경 범위를 정한다.
2. DB schema와 baseline SQL이 같은 구조를 표현하는지 확인한다.
3. repository mapping 테스트를 추가하거나 갱신한다.
4. seed 데이터 변경이 기존 학습 진행/답변을 삭제하지 않는지 확인한다.
5. 로컬 또는 in-memory DB에 migration을 적용한다.
6. `bun --filter @workspace/db test`를 실행한다.
7. 영향을 받는 API/core 테스트를 실행한다.
8. 문서와 OpenAPI 계약이 영향을 받으면 함께 갱신한다.

## 자료실 전환 기록

- 기존 Tiptap 자료는 제품 결정에 따라 이전하지 않고 폐기했다.
- 전환 전 SQLite WAL checkpoint와 일관된 파일 백업을 만들고 원본·백업 모두 `PRAGMA integrity_check` 결과 `ok`를 확인했다.
- 명시적 일회성 전환으로 운영 개발 DB를 최종 자료실 schema로 바꾼 뒤, 최종 schema를 `0000-writing-app-baseline.sql`에 통합했다.
- 일회성 전환 코드와 명령은 제거했으며 이후 신규 DB와 로컬 준비는 baseline만 적용한다.

## 콘텐츠 seed 마이그레이션

콘텐츠 seed는 stable ID 기준으로 upsert한다.

- 기존 진행과 답변 row는 보존한다.
- 기존 코스 row의 `visual_key`는 최신 기준 콘텐츠 값으로 갱신한다.
- seed에서 빠진 콘텐츠는 `archived`로 전환한다.
- 콘텐츠 row를 실제 삭제하지 않는다.
- step type은 표준 10개 타입으로 변환한다.
- `summary_json`, `content_json`, `answer_json`, `result_json`은 schema/parser 테스트로 계약을 고정한다.

## 보존 가능한 baseline 보강

baseline SQL은 새 DB를 만들 때의 기준 구조를 제공한다. 이미 존재하는 로컬 DB가 현재 schema와 호환되지만 일부 additive column만 빠져 있으면, migration 진입점이 데이터를 보존한 채 컬럼을 추가한다.

- `courses.visual_key`는 기존 `courses` row에 기본값 `basic-sentence-writing`을 채워 추가한다.
- 상태 컬럼이 없는 기존 `ai_feedback_attempts`는 각 row의 attempt 번호와 결과를 보존한 채 `succeeded`로 변환하고 deterministic legacy ID와 idempotency key를 채운다.
- seed 재실행은 각 코스의 `visual_key`를 기준 콘텐츠 seed 값으로 다시 맞춘다.

## 레거시 DB 재생성

seed 실행 중 legacy DB 구조가 감지되면 DB 파일 재생성이 필요할 수 있다.

재생성 조건은 모두 만족해야 한다.

- `ALLOW_DATABASE_RESET=true`
- CLI `--force`
- DB 파일이 저장소 루트 `data/` 하위 경로

운영 DB에 이 절차를 적용하지 않는다. 운영 데이터 이전이 필요하면 별도 계획을 세운다.

## DB 초기화 안전장치

- 초기화 대상은 canonical path가 저장소 루트 `data/` 아래에 있는 일반 SQLite 파일이어야 한다. 상대 경로 탈출과 symlink 탈출은 거부한다.
- 삭제 전에 대상 DB와 존재하는 `-wal`, `-shm` sidecar를 같은 경계 안에 백업한다. 삭제 실패 시 백업에서 원래 파일을 복구한다.
- 대상 DB와 두 sidecar 외 파일은 삭제하지 않는다.
- production에서는 `ALLOW_DATABASE_RESET=true`, CLI `--force`, canonical 대상에서 계산한 fingerprint가 모두 일치해야 한다.
- 대상 fingerprint는 `bun run db:reset -- --print-fingerprint`로 얻고 `--target-fingerprint=<값>` 또는 `DATABASE_RESET_TARGET_FINGERPRINT`로 전달한다.
- 백업은 `data/backups/<DB 파일명>-<fingerprint 앞 12자>/`에 저장한다. 복구 확인 뒤 별도 보존 정책에 따라 정리한다.

## 운영 마이그레이션 원칙

- 서버 프로세스 시작이 DB 변경을 수행하지 않는다.
- 배포 전 또는 배포 단계에서 migration을 명시적으로 실행한다.
- SQLite 파일을 백업한 뒤 migration을 실행한다.
- 학습자 API와 어드민 API를 같은 DB 파일에 연결하므로, schema 변경은 두 API 호환성을 함께 확인한다.
- 마이그레이션 중에는 쓰기 트래픽을 제한하거나 maintenance window를 둔다.
- 운영 배포에서는 Ansible deploy playbook이 두 API를 중지한 뒤 Compose `database-migrate` 일회성 서비스를 실행한다.
- 컨테이너 기동 명령에는 migration을 포함하지 않으며 migration 실패 시 신규 애플리케이션을 기동하지 않는다.

## 롤백 조건

아래 상황에서는 배포를 중단하고 롤백 절차를 따른다.

- migration 적용 실패
- schema와 Drizzle schema 불일치
- seed가 기존 진행/답변 데이터를 삭제하거나 덮어씀
- 인증 테이블 또는 session table 손상
- API route 테스트에서 데이터 계약 실패
- 운영 smoke에서 주요 읽기/쓰기 경로 실패

## 마이그레이션 ADR 기준

다음 변경은 ADR을 남긴다.

- baseline migration에서 누적 migration 체인으로 전환
- SQLite에서 다른 DB로 이전
- 커리큘럼 버전/마이그레이션 모델 재도입
- 인증 provider schema 변경
- 사용자 데이터 삭제/익명화 정책 변경
- 운영 DB 직접 수정 절차 추가
