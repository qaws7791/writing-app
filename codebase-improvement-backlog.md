# 글결 코드베이스 개선 작업 계획

- 문서 상태: 확정
- 기준일: 2026-07-24
- 대상 저장소: `writing-app`
- 실행 방식: 단일 통합 브랜치에서 원자적 티켓 단위로 작업하고, 전체 릴리스 게이트 통과 후 기본 브랜치에 일괄 반영
- 제품 단계: 1차 개발 중, 실사용자·프로덕션 데이터 없음
- 팀 구성: 기획 1명, 디자인 1명, 개발 1명
- 구현 상태: 저장소 내부 완료 58개, 외부 승인·실환경 증거 대기 14개, 내부 미완료 0개
- 검증 증거: [`docs/work/2026-07-24-confirmed-product-baseline/validation-report.md`](./docs/work/2026-07-24-confirmed-product-baseline/validation-report.md)

체크박스는 수용 기준 원문이며 티켓 상태 필드가 아니다. 현재 완료 판정은 위 검증 보고서와 코드 권위 소스를 사용한다.

## 1. 확정된 제품 및 기술 결정

### 제품

글결은 **듀오링고 스타일의 한국어 글쓰기 능력 향상 서비스**다. 주요 사용자는 한국어 글쓰기를 잘하고 싶은 일반 성인이다. 핵심 제품 지표는 첫 레슨 시작과 7일 내 재방문이다.

유지하는 핵심 기능은 공개 랜딩, Google 및 이메일 인증, 학습자 홈, 코스 목록·상세, 10개 활동 유형의 레슨, 서버 임시 저장, 학습자 프로필, 다크 모드, AI 피드백, 관리자 코스·사용자 관리다.

### 제거

다음 기능은 비활성화가 아니라 코드·계약·DB·테스트·문서까지 완전히 제거한다.

- 관리자 자료 라이브러리 전체
- Lexical 자료 문서 편집기와 `@workspace/resource-document`
- 관리자 AI 채팅과 SSE
- AI 코스·레슨 초안 생성
- Mastra
- 관리자 화면의 콘텐츠 초기화 기능
- PWA manifest와 설치 기능
- 근거 없는 마케팅 통계
- 범용 학습 플랫폼처럼 보이는 카테고리·카피
- pointer glow, parallax, marquee, scroll listener 기반 장식 모션
- 브라우저 `localStorage` 기반 레슨 초안
- legacy API 오류·legacy draft key·schema-era adoption

자료실이 제거되므로 “자료 soft delete 30일” 결정은 적용 대상이 없어 폐기한다.

### 아키텍처

- Bun workspace + Turborepo를 유지한다.
- `web`, `admin`, `api`, `storybook` 앱을 분리 유지한다.
- Hono API runtime은 하나로 유지한다.
- 모듈러 모놀리스와 workspace package 경계를 유지한다.
- 비즈니스 모듈은 `content`, `learning`, `identity`, `ai-feedback`, `operations` 다섯 개다.
- 각 모듈은 `domain/application/infrastructure/interface` 계층을 유지한다.
- application이 요구하는 repository, 외부 provider, 다른 모듈 capability, clock, ID generator에는 단일 구현이어도 Port를 둘 수 있다.
- application service, mapper, presenter, 순수 함수, React feature에는 테스트 fake만을 이유로 Port를 만들지 않는다.
- 예상 가능한 실패만 `Result`로 표현하고, DB driver 오류·프로그래밍 오류·손상된 내부 데이터는 throw 후 중앙 오류 처리기로 보낸다.
- HTTP wire schema는 `@workspace/contracts`가 소유한다.
- Hono OpenAPI 문서를 Scalar로 제공하고, Orval로 admin·learner 클라이언트를 생성한다.
- 수동 DAL·endpoint wrapper·generic JSON transport는 제거한다.
- Bun SQLite + Drizzle, 단일 API instance를 유지한다.
- cross-module FK를 허용한다.
- `operations`의 read-only reporting SQL에 한해 cross-module join을 허용한다.
- 다른 모듈의 application code가 타 모듈 table·repository를 직접 사용하는 것은 계속 금지한다.

### 인증·AI·스토리지

- 학습자는 Google과 이메일·비밀번호 로그인을 지원한다.
- 이메일 확인과 비밀번호 재설정을 지원한다.
- 이메일 발송은 Resend를 Port를 통해 연결한다.
- 관리자는 별도 인증 체계와 별도 admin subdomain을 사용한다.
- 관리자 역할은 owner 하나뿐이다. operator 개념은 제거한다.
- AI 피드백에는 숫자 점수를 생성·저장·표시하지 않는다.
- AI 데이터는 운영·품질 분석에만 사용하며 모델 학습 데이터셋으로 전환하지 않는다.
- 사용자 프로필 이미지 직접 업로드는 첫 출시에서 제외한다. Google 이미지 또는 기본 avatar만 사용한다.
- S3 호환 Object Storage Port는 학습 콘텐츠 이미지 때문에 유지한다.
- iOS Safari 최신·직전 주요 버전과 Chromium 최신·직전 주요 버전을 지원 대상으로 삼는다.
- 정식 WCAG AA 인증을 출시 gate로 두지는 않지만 semantic HTML, keyboard 조작, focus, label, 오류 알림은 핵심 흐름에서 유지한다.

## 2. 확정 보존 정책

아래 값은 현재 제품 정책이며 `GG-905`의 출시 전 법률 검토 결과에 따라 더 엄격하게 조정할 수 있다. 검토 전에는 임의로 완화하지 않는다.

| 데이터                                          | 보존 정책                                                         |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| 사용자 이메일·이름                              | 회원 유지 기간, 탈퇴 요청 후 5일 이내 active system에서 삭제      |
| 학습 답안                                       | 회원 유지 기간, 탈퇴 요청 후 5일 이내 삭제                        |
| AI 피드백                                       | 원본 답안과 동일하게 보존하고 원본 삭제 시 연쇄 삭제              |
| 일반 application request log                    | 30일                                                              |
| 보안 로그의 IP·User-Agent                       | 90일                                                              |
| 관리자 개인정보 접근 기록                       | 최소 1년                                                          |
| 사용자 상태 변경·삭제 등 고위험 관리자 mutation | 3년                                                               |
| 콘텐츠 발행 audit                               | 1년                                                               |
| AI usage 집계                                   | 1년, 답안·피드백 원문 미포함                                      |
| 애플리케이션 DB backup                          | 최대 30일                                                         |
| 삭제 marker                                     | backup 최대 수명보다 길게 보존하고 PII는 user ID 외 저장하지 않음 |

## 3. 목표 저장소 구조

```text
apps/
  web/
  admin/
  api/
  storybook/

packages/
  modules/
    content/
    learning/
    identity/
    ai-feedback/
    operations/

  infra/
    ai/
    auth/
    db/
    http-client/      # Orval 생성물과 얇은 fetch mutator만 소유
    http-platform/
    observability/
    storage/

  shared/
    contracts/
    kernel/
    types/
    ui/

  config/
    env/
    nextjs-config/
    typescript-config/
```

삭제되는 workspace package:

```text
@workspace/resource-library
@workspace/resource-document
```

`@workspace/http-client`는 삭제하지 않고 **generic transport package에서 Orval 생성 클라이언트 호스트로 재구성**한다. `@workspace/operations`는 관리자 AI 기능을 제거하고 reporting·audit 조회만 소유한다. `@workspace/ai`는 Mastra를 제거하고 OpenAI SDK runtime과 오류 정규화만 소유한다.

## 4. 실행 원칙

1. `refactor/confirmed-product-baseline` 통합 브랜치를 사용한다.
2. 새 구조와 기존 구조를 장기간 병행하지 않는다.
3. 실사용자와 운영 DB가 없으므로 compatibility adapter와 data migration bridge를 만들지 않는다.
4. 각 티켓은 독립 커밋 또는 명확한 커밋 묶음으로 남긴다.
5. 완료된 티켓은 관련 production code, test, export, dependency, 문서를 동시에 정리한다.
6. 새 추상화는 제거되는 코드보다 명확한 책임과 실제 소비자를 가져야 한다.
7. 테스트는 사용자 행동, 보안 경계, 데이터 불변식, 비싼 회귀만 보호한다.
8. LOC 감소량은 참고 지표일 뿐 완료 기준이 아니다.

## 5. 공통 Definition of Done

모든 개발 티켓은 별도 명시가 없는 한 다음을 만족해야 한다.

- [ ] 구현 범위와 비범위가 티켓 설명과 일치한다.
- [ ] 불필요한 compatibility layer와 임시 re-export가 남아 있지 않다.
- [ ] 관련 `/docs`와 ADR이 갱신됐다.
- [ ] `bun run format:check`
- [ ] `bun run lint`
- [ ] `bun run typecheck`
- [ ] 영향 범위의 Vitest·Hono integration test가 통과한다.
- [ ] OpenAPI 변경이 있으면 문서 생성과 Orval client 생성이 통과한다.
- [ ] `knip`에서 새 dead code가 발견되지 않는다.
- [ ] dependency-cruiser 규칙을 우회하는 import가 없다.
- [ ] 사용자 답안, 이메일, provider raw response, secret이 로그에 기록되지 않는다.
- [ ] 티켓에서 명시한 E2E 또는 smoke 검증이 통과한다.

## 6. 우선순위 정의

| 우선순위 | 의미                                                        |
| -------- | ----------------------------------------------------------- |
| P0       | 이후 작업의 기반이거나 출시를 막는 구조·데이터·보안 작업    |
| P1       | 첫 출시 핵심 사용자 흐름                                    |
| P2       | 운영 안정성, 분석, 품질 자동화                              |
| P3       | 출시 후 최적화 후보. 이번 계획에는 원칙적으로 포함하지 않음 |

## 7. 실행 웨이브

| 웨이브 | 목적                                  | 포함 Epic    |
| ------ | ------------------------------------- | ------------ |
| W0     | 결정과 작업 기준 고정                 | E0           |
| W1     | 폐기 범위 일괄 삭제                   | E1           |
| W2     | 목표 DB baseline과 핵심 불변식 확립   | E2           |
| W3     | HTTP·OpenAPI·생성 클라이언트 전환     | E3           |
| W4     | 인증, 학습 상태, AI 피드백 구현       | E4, E5, E6   |
| W5     | 콘텐츠 이미지와 운영 제품 화면 완성   | E7, E8       |
| W6     | 개인정보·관측·테스트·배포 게이트 완성 | E9, E10, E11 |

### 권장 critical path

```text
GG-001 → GG-002 → GG-003
  ├─ GG-101 / GG-102 / GG-103 / GG-104
  │    └─ GG-201
  │         ├─ GG-301 → GG-302 → GG-303 → GG-304 → GG-305
  │         │                                      ├─ GG-306
  │         │                                      └─ GG-307
  │         ├─ GG-204 → GG-502 → GG-503 → GG-504
  │         ├─ GG-205 → GG-601 → GG-602 → GG-603
  │         ├─ GG-206 → GG-702 → GG-703 → GG-704
  │         └─ GG-207 → GG-902 → GG-903 → GG-904
  ├─ GG-801 → GG-802 → GG-803 → GG-804 → GG-805
  └─ GG-105 → GG-806 → GG-807 → GG-808 → GG-809

GG-1006와 GG-1106이 최종 통합 gate다.
```

기획과 디자인은 개발 critical path와 병렬로 `GG-801`, `GG-806`, 다크 모드·반응형 검수를 진행할 수 있다. 개발 담당자는 DB baseline, HTTP/client, 학습 draft 순서의 구조적 critical path를 우선한다.

## 8. Epic 요약

| Epic | 이름                    | 목표                                                |
| ---- | ----------------------- | --------------------------------------------------- |
| E0   | 계획·문서·작업 통제     | 결정이 다시 흔들리거나 병행 구조가 생기는 것을 방지 |
| E1   | 폐기 기능 완전 삭제     | 자료실, 관리자 AI, 호환성, 과도한 랜딩 기능 제거    |
| E2   | 데이터 모델 재기준화    | 새 `0000` baseline과 핵심 DB 불변식 확립            |
| E3   | HTTP·OpenAPI·클라이언트 | direct Hono route와 Orval client로 단일화           |
| E4   | 인증과 이메일           | Google + credentials + Resend, owner-only admin     |
| E5   | 학습 상태와 서버 초안   | 서버 canonical progress와 복구 가능한 draft         |
| E6   | AI 피드백               | 점수 없는 구조화 피드백과 비용 보호                 |
| E7   | 콘텐츠와 이미지         | 관리자 코스 편집과 S3 호환 콘텐츠 이미지            |
| E8   | 분석·디자인·프런트      | 핵심 지표, 짧은 랜딩, 다크 모드, 반응형             |
| E9   | 개인정보·관측           | 감사 기록, 보존, 삭제·복원 안전성                   |
| E10  | 테스트·CI               | 제품 행동 중심 테스트와 10분 PR 게이트              |
| E11  | 배포·운영               | Ubuntu VPS의 최소 Compose·Ansible·Litestream 운영   |

## 9. 티켓 인덱스

| ID      | Epic | 제목                                                           | 우선순위 |  SP | 주 담당                      | 선행 티켓                       |
| ------- | ---- | -------------------------------------------------------------- | -------: | --: | ---------------------------- | ------------------------------- |
| GG-001  | E0   | 제품 범위와 권위 문서 확정                                     |       P0 |   3 | 기획 주도 / 디자인·개발 공동 | 없음                            |
| GG-002  | E0   | 모듈러 모놀리스와 DB 경계 ADR 작성                             |       P0 |   5 | 개발                         | GG-001                          |
| GG-003  | E0   | 통합 브랜치, 기준 지표, 릴리스 게이트 설정                     |       P0 |   3 | 개발                         | GG-001, GG-002                  |
| GG-101  | E1   | 자료 라이브러리 전체 제거                                      |       P0 |  13 | 개발                         | GG-003                          |
| GG-102  | E1   | Lexical 자료 문서 패키지와 의존성 제거                         |       P0 |   8 | 개발                         | GG-101                          |
| GG-103  | E1   | 관리자 AI 채팅과 Mastra 제거                                   |       P0 |  13 | 개발                         | GG-003                          |
| GG-104  | E1   | 관리자 콘텐츠 초기화 UI와 호환성 코드 제거                     |       P0 |   8 | 개발                         | GG-003                          |
| GG-105  | E1   | 랜딩 과장 요소와 PWA 제거                                      |       P1 |   8 | 디자인·개발                  | GG-001                          |
| GG-201  | E2   | 목표 스키마 기준 새 0000 baseline 생성                         |       P0 |  13 | 개발                         | GG-101, GG-102, GG-103, GG-104  |
| GG-202  | E2   | owner-only 관리자 identity 모델로 축소                         |       P0 |   8 | 개발                         | GG-201                          |
| GG-203  | E2   | 학습자 deleted 상태와 5일 purge lifecycle 구현                 |       P0 |  13 | 개발                         | GG-201                          |
| GG-204  | E2   | 서버 레슨 draft 테이블과 불변식 추가                           |       P0 |   8 | 개발                         | GG-201                          |
| GG-205  | E2   | 점수 없는 AI 피드백·quota 데이터 모델 확정                     |       P0 |   8 | 개발                         | GG-201                          |
| GG-206  | E2   | 학습 콘텐츠 이미지 asset 스키마 확정                           |       P1 |   8 | 개발                         | GG-201                          |
| GG-207  | E2   | 감사 이벤트와 보존 class 스키마 추가                           |       P1 |   8 | 개발                         | GG-201, GG-202                  |
| GG-208  | E2   | seed·E2E fixture·DB 진단을 새 baseline에 맞춤                  |       P0 |   8 | 개발                         | GG-201~GG-207                   |
| GG-301  | E3   | canonical API 오류 계약 하나로 통합                            |       P0 |   8 | 개발                         | GG-201                          |
| GG-302  | E3   | Hono route를 직접 등록하도록 http-platform 축소                |       P0 |  13 | 개발                         | GG-301                          |
| GG-303  | E3   | 관리자 route registry와 composition wrapper 제거               |       P0 |   8 | 개발                         | GG-302, GG-101, GG-103          |
| GG-304  | E3   | admin·learner OpenAPI 문서와 Scalar 제공                       |       P1 |   8 | 개발                         | GG-302, GG-303                  |
| GG-305  | E3   | Orval 생성 파이프라인과 http-client package 재구성             |       P0 |  13 | 개발                         | GG-304                          |
| GG-306  | E3   | 학습자 앱을 Orval client로 전환                                |       P0 |  13 | 개발                         | GG-305                          |
| GG-307  | E3   | 관리자 앱을 Orval client로 전환                                |       P0 |  13 | 개발                         | GG-305                          |
| GG-308  | E3   | dependency-cruiser·Knip·exports를 목표 경계에 맞춤             |       P0 |   5 | 개발                         | GG-302~GG-307                   |
| GG-309  | E3   | 불필요한 Object.freeze 제거와 타입 안전 규칙 정리              |       P1 |   8 | 개발                         | GG-302~GG-308                   |
| GG-401  | E4   | Resend 이메일 delivery Port와 adapter 구현                     |       P0 |   8 | 개발                         | GG-201                          |
| GG-402  | E4   | 학습자 이메일 가입·확인·로그인 구현                            |       P0 |  13 | 개발                         | GG-401, GG-306                  |
| GG-403  | E4   | 비밀번호 재설정과 Google 계정 연결 구현                        |       P1 |   8 | 개발                         | GG-401, GG-402                  |
| GG-404  | E4   | owner-only 관리자 인증과 seed CLI 정리                         |       P0 |   8 | 개발                         | GG-202, GG-307                  |
| GG-405  | E4   | 인증 보안·테스트 fixture 단순화                                |       P0 |   8 | 개발                         | GG-402~GG-404                   |
| GG-501  | E5   | 서버·클라이언트 학습 상태 책임 계약 확정                       |       P0 |   5 | 개발                         | GG-001, GG-002                  |
| GG-502  | E5   | saveStepDraft application·repository·HTTP 구현                 |       P0 |  13 | 개발                         | GG-204, GG-301, GG-302, GG-501  |
| GG-503  | E5   | 웹 autosave·복구·동기화로 전환                                 |       P0 |  13 | 개발                         | GG-306, GG-502                  |
| GG-504  | E5   | localStorage draft와 로그아웃 정리 코드 제거                   |       P0 |   5 | 개발                         | GG-503                          |
| GG-505  | E5   | learning application 계층을 transaction use case 중심으로 압축 |       P1 |  13 | 개발                         | GG-502                          |
| GG-506  | E5   | 10개 활동 유형의 answer·draft·evaluation 계약 정규화           |       P0 |  13 | 개발                         | GG-501, GG-502                  |
| GG-601  | E6   | AI 점수 필드를 contracts·seed·admin·web에서 제거               |       P0 |   8 | 개발                         | GG-205, GG-506                  |
| GG-602  | E6   | AI 피드백 domain·OpenAI provider 단순화                        |       P0 |  13 | 개발                         | GG-601                          |
| GG-603  | E6   | AI quota·idempotency·retry 정책 구현                           |       P0 |  13 | 개발                         | GG-205, GG-602                  |
| GG-604  | E6   | AI 운영·품질 분석과 학습자 UI 상태 완성                        |       P1 |   8 | 개발·디자인                  | GG-603, GG-803                  |
| GG-701  | E7   | content application 파일과 Port surface 정리                   |       P1 |  13 | 개발                         | GG-202, GG-303                  |
| GG-702  | E7   | S3 호환 콘텐츠 이미지 업로드·처리 구현                         |       P1 |  13 | 개발                         | GG-206, GG-301, GG-302          |
| GG-703  | E7   | 관리자 코스 편집기에 이미지 관리 추가                          |       P1 |   8 | 디자인·개발                  | GG-307, GG-702                  |
| GG-704  | E7   | 학습자 이미지 렌더링과 asset cleanup 정책 구현                 |       P1 |   8 | 개발                         | GG-702, GG-703                  |
| GG-705  | E7   | 콘텐츠 seed·편집·발행 E2E 재작성                               |       P1 |   8 | 개발                         | GG-701~GG-704                   |
| GG-801  | E8   | 첫 레슨 시작·7일 내 재방문 지표 정의                           |       P0 |   5 | 기획·개발                    | GG-001                          |
| GG-802  | E8   | operations reporting을 read-only SQL repository로 단순화       |       P1 |  13 | 개발                         | GG-201, GG-801                  |
| GG-803  | E8   | 관리자 dashboard·analytics API 계약 재설계                     |       P1 |   8 | 개발                         | GG-301, GG-802                  |
| GG-804  | E8   | 관리자 차트 렌더링 구조 단순화                                 |       P1 |   8 | 개발·디자인                  | GG-307, GG-803                  |
| GG-805  | E8   | 관리자 dashboard·analytics 화면 개편                           |       P1 |   8 | 디자인·개발                  | GG-803, GG-804                  |
| GG-806  | E8   | 짧은 공개 랜딩의 정보 구조와 카피 확정                         |       P1 |   5 | 기획·디자인                  | GG-105                          |
| GG-807  | E8   | 새 랜딩 구현과 실제 제품 시각 자료 연결                        |       P1 |   8 | 개발·디자인                  | GG-306, GG-806                  |
| GG-808  | E8   | 학습자·관리자 다크 모드 완성                                   |       P1 |   8 | 디자인·개발                  | GG-805, GG-807                  |
| GG-809  | E8   | 반응형·브라우저 지원·프로필 avatar 마감                        |       P1 |   8 | 디자인·개발                  | GG-503, GG-705, GG-808          |
| GG-810  | E8   | 학습자 코스 탐색 필터를 핵심 선택지만 남기도록 축소            |       P1 |   5 | 기획·디자인·개발             | GG-306, GG-807                  |
| GG-901  | E9   | 로그 이벤트 taxonomy와 민감정보 redaction 확정                 |       P0 |   5 | 개발                         | GG-001                          |
| GG-902  | E9   | 관리자 감사 이벤트 영속화 연결                                 |       P0 |   8 | 개발                         | GG-207, GG-901                  |
| GG-903  | E9   | 보존기간 purge와 일일 maintenance 명령 구현                    |       P0 |  13 | 개발                         | GG-203, GG-207, GG-205, GG-704  |
| GG-904  | E9   | 외부 삭제 marker와 restore 재적용 구현                         |       P0 |  13 | 개발                         | GG-203, GG-903, GG-1102         |
| GG-905  | E9   | 개인정보 처리·보존 문서와 출시 법률 검토 gate                  |       P0 |   5 | 기획 주도 / 개발 지원        | GG-901~GG-904                   |
| GG-1001 | E10  | 구현 구조와 source 문자열을 고정하는 테스트 삭제               |       P0 |  13 | 개발                         | GG-101~GG-105, GG-302, GG-307   |
| GG-1002 | E10  | 목표 테스트 matrix와 도구별 책임 확정                          |       P0 |   5 | 개발                         | GG-001                          |
| GG-1003 | E10  | Orval MSW와 UI fixture 정리                                    |       P1 |   8 | 개발                         | GG-305, GG-306, GG-307          |
| GG-1004 | E10  | Playwright PR smoke와 release 전체 suite 재구성                |       P0 |  13 | 개발                         | GG-402~GG-809                   |
| GG-1005 | E10  | Lighthouse·bundle budget·k6 gate 추가                          |       P2 |   8 | 개발                         | GG-807, GG-809, GG-1104         |
| GG-1006 | E10  | CI를 10분 PR gate와 release gate로 재편                        |       P0 |  13 | 개발                         | GG-1001~GG-1005, GG-308         |
| GG-1101 | E11  | Compose와 Caddy를 5-service topology로 단순화                  |       P0 |  13 | 개발                         | GG-101, GG-103, GG-201          |
| GG-1102 | E11  | production 환경 변수·secret 계약 재정의                        |       P0 |   8 | 개발                         | GG-401, GG-603, GG-702, GG-1101 |
| GG-1103 | E11  | Ansible bootstrap·deploy·verify·rollback·restore 축소          |       P1 |  13 | 개발                         | GG-1101, GG-1102                |
| GG-1104 | E11  | Litestream backup·restore와 staging 분리 완성                  |       P0 |  13 | 개발                         | GG-904, GG-1103                 |
| GG-1105 | E11  | 이미지 릴리스·취약점 검사·rollback 경로 단순화                 |       P1 |  13 | 개발                         | GG-1006, GG-1103                |
| GG-1106 | E11  | 출시 runbook·readiness·graceful shutdown 최종 검증             |       P0 |   8 | 기획·개발                    | 모든 P0/P1 티켓                 |

Story Point는 상대 크기 비교용이며 일정 약속이 아니다. Epic별 합계:

| Epic | SP 합계 |
| ---- | ------: |
| E0   |      11 |
| E1   |      50 |
| E2   |      74 |
| E3   |      89 |
| E4   |      45 |
| E5   |      62 |
| E6   |      42 |
| E7   |      50 |
| E8   |      76 |
| E9   |      44 |
| E10  |      60 |
| E11  |      68 |

## 10. 상세 티켓

### E0. 계획·문서·작업 통제

#### GG-001 — 제품 범위와 권위 문서 확정

| 필드        | 값                           |
| ----------- | ---------------------------- |
| 유형        | Task                         |
| 우선순위    | P0                           |
| Story Point | 3                            |
| 주 담당     | 기획 주도 / 디자인·개발 공동 |
| 선행 티켓   | 없음                         |

**목표**

확정된 제품 범위, 삭제 기능, 핵심 지표를 코드 변경의 기준 문서로 만든다.

**작업 범위**

- `docs/product/product-scope.md`에 핵심 사용자, 핵심 흐름, 유지·삭제 기능을 기록한다.
- `docs/product/metrics.md`에 첫 레슨 시작과 7일 내 재방문의 정의를 기록한다.
- 자료실·AI 코스 생성·관리자 AI 채팅은 명시적 비범위로 기록한다.
- 10개 활동 유형과 AI 피드백의 제품 역할을 기록한다.

**수용 기준**

- [ ] 기획·디자인·개발 담당자가 문서를 검토한다.
- [ ] README에서 해당 문서로 연결한다.
- [ ] 새 기능 제안은 범위 변경 티켓 없이는 구현할 수 없도록 PR 템플릿에 반영한다.

**추가 조건**

- 비범위: 화면별 최종 카피 작성
- 비범위: 구현 상세 설계

#### GG-002 — 모듈러 모놀리스와 DB 경계 ADR 작성

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P0     |
| Story Point | 5      |
| 주 담당     | 개발   |
| 선행 티켓   | GG-001 |

**목표**

유지할 계층과 제거할 ceremony를 동시에 명문화한다.

**작업 범위**

- 다섯 비즈니스 모듈과 4계층 규칙을 ADR로 기록한다.
- Port 허용 범위를 application outward dependency로 한정한다.
- cross-module FK와 operations read-only join 예외를 기록한다.
- 다른 모듈 table·repository를 command path에서 직접 사용하는 것을 금지한다.
- Result와 exception의 사용 기준을 기록한다.

**수용 기준**

- [ ] `docs/adr`에 결정과 대안·트레이드오프가 남아 있다.
- [ ] dependency-cruiser 규칙 변경안이 ADR과 일치한다.
- [ ] 기존 아키텍처 설명에서 resource-library와 operator를 제거한다.

#### GG-003 — 통합 브랜치, 기준 지표, 릴리스 게이트 설정

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Chore          |
| 우선순위    | P0             |
| Story Point | 3              |
| 주 담당     | 개발           |
| 선행 티켓   | GG-001, GG-002 |

**목표**

대규모 전환을 통제할 수 있는 기준선을 만든다.

**작업 범위**

- `refactor/confirmed-product-baseline` 브랜치를 생성한다.
- 현재 workspace package, 운영 TS/TSX 파일, test 파일, OpenAPI operation 수를 기록한다.
- 최종 merge 전 필수 게이트를 체크리스트로 만든다.
- 티켓 ID를 커밋과 PR 설명에 연결한다.

**수용 기준**

- [ ] 기준 지표가 `docs/work`에 기록된다.
- [ ] main에는 중간 compatibility 구조가 merge되지 않는다.
- [ ] 통합 브랜치 보호 및 리뷰 규칙이 설정된다.

**추가 조건**

- 금지: LOC 감소 목표를 품질 게이트로 사용하지 않는다.

### E1. 폐기 기능 완전 삭제

#### GG-101 — 자료 라이브러리 전체 제거

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P0     |
| Story Point | 13     |
| 주 담당     | 개발   |
| 선행 티켓   | GG-003 |

**목표**

제품 범위에서 제거된 자료실을 UI부터 DB까지 완전히 삭제한다.

**작업 범위**

- `apps/admin/src/app/(admin)/resources/**`와 관련 navigation을 삭제한다.
- `apps/admin/src/features/resource-library/**`, `resource-document-editor/**`, `entities/resource-document/**`를 삭제한다.
- `packages/modules/resource-library/**`를 workspace에서 제거한다.
- `packages/shared/contracts/src/resource-library/**`와 exports를 제거한다.
- `apps/api/src/composition/resource-library*`, `resource-actor-directory.ts`와 container dependency를 제거한다.
- resource 관련 E2E, Storybook, fixture, route operation을 제거한다.

**수용 기준**

- [ ] `/resources`와 `/api/admin/resources/**`가 존재하지 않는다.
- [ ] OpenAPI 문서에 resource operation이 없다.
- [ ] admin sidebar에 자료 관련 링크가 없다.
- [ ] repository 전역에서 `@workspace/resource-library` import가 0건이다.
- [ ] Knip과 typecheck가 통과한다.

**추가 조건**

- 비범위: 자료실 대체 기능 개발
- 비범위: 문서 import 기능 보존

#### GG-102 — Lexical 자료 문서 패키지와 의존성 제거

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P0     |
| Story Point | 8      |
| 주 담당     | 개발   |
| 선행 티켓   | GG-101 |

**목표**

자료 편집기를 위해 유지하던 Rich Text·Markdown 왕복 계층을 삭제한다.

**작업 범위**

- `packages/shared/resource-document/**`와 package 설정을 삭제한다.
- resource Lexical plugin, validation, Markdown AST, table/image node 코드를 삭제한다.
- root catalog와 각 package에서 Lexical 전용 dependency를 제거한다.
- 자료 편집기 전용 CSS token·class가 있으면 제거한다.
- 자료 editor를 보호하던 고비용 DOM·drag·selection 테스트를 삭제한다.

**수용 기준**

- [ ] `@workspace/resource-document` import가 0건이다.
- [ ] Lexical dependency가 다른 실제 기능에서 사용되지 않으면 lockfile에서도 사라진다.
- [ ] lesson Markdown renderer는 정상 동작한다.
- [ ] bundle과 typecheck가 통과한다.

#### GG-103 — 관리자 AI 채팅과 Mastra 제거

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P0     |
| Story Point | 13     |
| 주 담당     | 개발   |
| 선행 티켓   | GG-003 |

**목표**

사용하지 않는 범용 AI 채팅과 관련 runtime을 완전히 삭제한다.

**작업 범위**

- `apps/admin/src/app/(admin)/chat/**`, `features/ai-chat/**`와 navigation을 삭제한다.
- `packages/modules/operations`에서 conversation, streaming, AI guard, AI route를 삭제한다.
- `packages/shared/contracts/src/operations/admin-ai-chat*`를 삭제한다.
- `admin_ai_chat_conversations`, `admin_ai_chat_messages`, `operations_ai_quota_counters` schema를 제거 대상으로 표시한다.
- `packages/infra/ai/src/mastra-agent.ts`와 Mastra dependencies를 삭제한다.
- SSE parser·stream test·admin chat E2E를 삭제한다.

**수용 기준**

- [ ] `/chat`, `/api/admin/ai-chat/**`가 존재하지 않는다.
- [ ] OpenAPI에 admin AI chat operation이 없다.
- [ ] `@mastra/*` dependency가 lockfile에서 제거된다.
- [ ] `operations` module은 reporting과 audit 관련 surface만 가진다.
- [ ] API lifecycle에서 `closeAi` 같은 Mastra 종료 경로가 제거된다.

**추가 조건**

- 비범위: AI 코스 생성으로 대체
- 비범위: 범용 agent framework 유지

#### GG-104 — 관리자 콘텐츠 초기화 UI와 호환성 코드 제거

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P0     |
| Story Point | 8      |
| 주 담당     | 개발   |
| 선행 티켓   | GG-003 |

**목표**

개발 편의를 위해 제품 표면에 노출된 파괴적 기능과 운영 전환용 코드를 제거한다.

**작업 범위**

- `apps/admin/src/app/(admin)/maintenance/**`, `features/content-maintenance/**`와 navigation을 삭제한다.
- admin content reset HTTP route와 contract를 삭제한다.
- content reset application use case는 제거하고 local/test seed CLI로만 대체한다.
- `current-schema-era-adoption.*`, `adopt-current-schema-era.ts`와 package script를 삭제한다.
- legacy API error normalizer와 legacy localStorage key migration을 제거한다.

**수용 기준**

- [ ] 관리자 UI와 OpenAPI에 reset operation이 없다.
- [ ] local/test에서는 `db:seed` 또는 명시적 reset CLI로 fixture를 만들 수 있다.
- [ ] schema-era lineage checksum 코드가 0건이다.
- [ ] 운영 환경 seed guard는 유지되거나 더 단순한 동일 수준 guard로 대체된다.

**추가 조건**

- 비범위: 운영 DB migration compatibility
- 비범위: 관리자용 reset 버튼

#### GG-105 — 랜딩 과장 요소와 PWA 제거

| 필드        | 값          |
| ----------- | ----------- |
| 유형        | Task        |
| 우선순위    | P1          |
| Story Point | 8           |
| 주 담당     | 디자인·개발 |
| 선행 티켓   | GG-001      |

**목표**

확정된 브랜드와 실제 기능에 맞지 않는 공개 표면을 먼저 걷어낸다.

**작업 범위**

- `manifest.ts`와 설치형 PWA metadata test를 삭제한다.
- marquee, fake stats, pebbles, pointer glow, parallax, count-up, scroll reveal을 제거한다.
- 언어·코딩·역사 등 범용 학습 플랫폼 카피를 제거한다.
- 실제 근거가 없는 수치와 링크를 제거한다.
- 해당 listener·섹션 수·정확한 문구를 고정하던 테스트를 삭제한다.

**수용 기준**

- [ ] 랜딩에 pointermove·scroll 기반 JavaScript listener가 없다.
- [ ] 근거 없는 숫자 통계가 없다.
- [ ] 제품 설명이 한국어 글쓰기 학습만 다룬다.
- [ ] PWA manifest route가 없다.
- [ ] 이후 GG-806에서 새 랜딩을 구현할 수 있는 최소 구조가 남는다.

### E2. 데이터 모델 재기준화

#### GG-201 — 목표 스키마 기준 새 0000 baseline 생성

| 필드        | 값                             |
| ----------- | ------------------------------ |
| 유형        | Task                           |
| 우선순위    | P0                             |
| Story Point | 13                             |
| 주 담당     | 개발                           |
| 선행 티켓   | GG-101, GG-102, GG-103, GG-104 |

**목표**

운영 데이터가 없는 장점을 활용해 목표 데이터 모델을 하나의 깨끗한 baseline으로 재작성한다.

**작업 범위**

- 기존 `0000-current-schema-baseline.sql`을 목표 schema로 재생성한다.
- resource와 admin AI chat 관련 table·index·trigger를 제거한다.
- migration history는 새 baseline 하나만 가진다.
- 모듈별 Drizzle schema export와 실제 SQL baseline을 일치시킨다.
- foreign key, unique, check, immutable revision trigger를 재검토한다.

**수용 기준**

- [ ] 빈 DB에 migration을 1회 적용할 수 있다.
- [ ] 재실행은 checksum이 같은 baseline을 skip한다.
- [ ] `PRAGMA integrity_check`와 `foreign_key_check`가 통과한다.
- [ ] Drizzle schema와 SQL table 목록이 일치한다.
- [ ] old lineage DB를 지원하는 코드는 없다.

**추가 조건**

- 비범위: 기존 개발 DB 자동 변환
- 비범위: 프로덕션 data migration

#### GG-202 — owner-only 관리자 identity 모델로 축소

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P0     |
| Story Point | 8      |
| 주 담당     | 개발   |
| 선행 티켓   | GG-201 |

**목표**

단일 관리자 역할만 필요한 제품에 맞춰 role 상태와 정책 코드를 제거한다.

**작업 범위**

- `admin_identity_profiles` table과 role column을 제거한다.
- `operator`, role change, 마지막 owner 강등 정책을 삭제한다.
- admin session·contract에서 role 필드를 제거한다.
- owner mutation은 ‘유효한 관리자 session’으로 단순화한다.
- operator seed, operator E2E, role test를 삭제한다.

**수용 기준**

- [ ] 관리자 계정은 self-signup 없이 seed CLI로만 생성된다.
- [ ] 인증된 admin은 허용된 모든 관리자 기능을 사용할 수 있다.
- [ ] repository 전역에서 `operator` 제품 역할 참조가 0건이다.
- [ ] admin session DTO에 role이 없다.
- [ ] admin auth·mutation Hono integration test가 통과한다.

#### GG-203 — 학습자 deleted 상태와 5일 purge lifecycle 구현

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Story  |
| 우선순위    | P0     |
| Story Point | 13     |
| 주 담당     | 개발   |
| 선행 티켓   | GG-201 |

**목표**

탈퇴 즉시 접근을 차단하고 5일 이내 개인정보와 학습 데이터를 완전 삭제한다.

**작업 범위**

- `active → suspended/ deleted`, `suspended → active/deleted` 전이를 명시한다.
- deleted 전환과 동시에 모든 learner session을 폐기한다.
- `deleted_at` 이후 5일이 지난 계정을 purge하는 application command를 구현한다.
- user 소유 learning·AI 데이터 FK를 purge 가능한 cascade로 정리한다.
- deleted 사용자는 purge 전까지 관리자에서 읽기 전용으로 표시한다.

**수용 기준**

- [ ] deleted 사용자는 즉시 로그인·API 접근이 거절된다.
- [ ] 5일 전에는 purge되지 않고 5일 이후에는 user row와 소유 데이터가 삭제된다.
- [ ] content revision 데이터는 사용자 purge의 영향을 받지 않는다.
- [ ] 동일 purge command 재실행이 안전하다.
- [ ] 실제 SQLite integration test가 cascade 결과를 검증한다.

#### GG-204 — 서버 레슨 draft 테이블과 불변식 추가

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P0     |
| Story Point | 8      |
| 주 담당     | 개발   |
| 선행 티켓   | GG-201 |

**목표**

브라우저 저장소 대신 사용자·revision·step에 귀속되는 복구 가능한 draft를 저장한다.

**작업 범위**

- `learner_step_drafts` table을 추가한다.
- 키는 user, course, curriculum version, lesson, step 범위를 식별한다.
- `answer_json`, `version`, `updated_at`을 저장한다.
- course progress와 step version FK를 둔다.
- 답안 크기 상한과 version 비음수 check를 둔다.

**수용 기준**

- [ ] 동일 사용자의 동일 step에는 하나의 draft만 존재한다.
- [ ] 다른 curriculum revision draft가 섞이지 않는다.
- [ ] version 조건이 맞지 않는 update는 conflict로 수렴한다.
- [ ] 사용자 purge와 course progress 삭제 시 draft가 함께 삭제된다.
- [ ] repository integration test가 insert/update/conflict/cascade를 검증한다.

#### GG-205 — 점수 없는 AI 피드백·quota 데이터 모델 확정

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P0     |
| Story Point | 8      |
| 주 담당     | 개발   |
| 선행 티켓   | GG-201 |

**목표**

AI 피드백 저장 형식을 제품 요구와 비용 보호 정책에 맞춘다.

**작업 범위**

- `score`, `scoreRange`, `showScore`를 결과 schema와 저장 데이터에서 제거한다.
- attempt row에 model, prompt policy version, token counts, latency, normalized failure code를 저장할 수 있게 한다.
- per-step completed attempt와 per-user/global daily quota를 `ai-feedback` module schema가 소유하게 한다.
- pending unique slot과 idempotency key unique constraint를 유지한다.
- calendar day는 `Asia/Seoul` 기준으로 계산한다.

**수용 기준**

- [ ] DB와 contract 어디에도 숫자 점수 필드가 없다.
- [ ] 동일 step에 pending attempt가 두 개 생기지 않는다.
- [ ] 동일 idempotency key 재요청은 중복 provider 호출을 만들지 않는다.
- [ ] quota counter는 operations module에 존재하지 않는다.
- [ ] usage metadata에 사용자 답안 원문이 포함되지 않는다.

#### GG-206 — 학습 콘텐츠 이미지 asset 스키마 확정

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P1     |
| Story Point | 8      |
| 주 담당     | 개발   |
| 선행 티켓   | GG-201 |

**목표**

자료실 없이도 코스 표지와 학습 이미지가 S3 호환 스토리지에 안전하게 저장되도록 한다.

**작업 범위**

- `content_assets` table을 content module이 소유한다.
- asset은 course와 curriculum version에 귀속된다.
- 지원 용도는 course cover와 READING illustration으로 제한한다.
- content type, byte size, object key, alt text, status, created_at을 저장한다.
- published revision이 참조하는 asset은 변경·삭제하지 못하게 한다.

**수용 기준**

- [ ] 프로필 이미지 업로드용 table이나 API는 추가되지 않는다.
- [ ] 지원하지 않는 asset kind와 MIME은 DB·application에서 거절된다.
- [ ] published content의 asset reference가 immutable하다.
- [ ] draft asset과 published asset의 소유 범위가 명확하다.
- [ ] schema integration test가 FK와 immutable policy를 검증한다.

#### GG-207 — 감사 이벤트와 보존 class 스키마 추가

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Task           |
| 우선순위    | P1             |
| Story Point | 8              |
| 주 담당     | 개발           |
| 선행 티켓   | GG-201, GG-202 |

**목표**

관리자 개인정보 접근과 고위험 변경을 일반 request log와 분리해 보존한다.

**작업 범위**

- `audit_events` table을 operations module이 소유한다.
- category, action, actor, target, outcome, requestId, clientIp, createdAt, retentionUntil을 저장한다.
- payload에는 이메일, 이름, 답안, prompt를 저장하지 않는다.
- 개인정보 조회, 사용자 상태 변경·삭제, 콘텐츠 발행, DB 파괴 작업을 분류한다.
- 조회용 index와 retention purge index를 둔다.

**수용 기준**

- [ ] 관리자 사용자의 상세 조회와 변경이 감사 이벤트를 남긴다.
- [ ] request log와 audit table의 책임이 구분된다.
- [ ] PII가 audit JSON에 포함되지 않는 테스트가 있다.
- [ ] retentionUntil 기반 batch delete가 가능하다.

#### GG-208 — seed·E2E fixture·DB 진단을 새 baseline에 맞춤

| 필드        | 값            |
| ----------- | ------------- |
| 유형        | Chore         |
| 우선순위    | P0            |
| Story Point | 8             |
| 주 담당     | 개발          |
| 선행 티켓   | GG-201~GG-207 |

**목표**

새 schema에서 개발, 테스트, 배포 검증이 동일한 기준으로 동작하게 한다.

**작업 범위**

- content seed와 auth seed를 새 table 구조에 맞춘다.
- operator·resource·admin AI fixture를 제거한다.
- 10개 활동 유형을 포함하는 최소 E2E course fixture를 유지한다.
- required table 목록, schema diagnostic, backup verification을 갱신한다.
- 개발 DB 초기화 명령은 명시적 guard를 유지한다.

**수용 기준**

- [ ] 빈 DB에서 migrate → seed → API start가 성공한다.
- [ ] E2E setup이 owner와 learner fixture만 만든다.
- [ ] DB diagnostic이 제거된 table을 요구하지 않는다.
- [ ] backup verification이 새 필수 table을 검사한다.
- [ ] production reset/seed guard 테스트가 유지된다.

### E3. HTTP·OpenAPI·생성 클라이언트

#### GG-301 — canonical API 오류 계약 하나로 통합

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P0     |
| Story Point | 8      |
| 주 담당     | 개발   |
| 선행 티켓   | GG-201 |

**목표**

admin·learner·module별 오류 envelope와 legacy remapping을 하나로 줄인다.

**작업 범위**

- `@workspace/contracts/api-error`에 `code`, `message`, `requestId`, optional `violations` schema를 둔다.
- HTTP status는 body에 중복 저장하지 않는다.
- content, identity, learning, operations별 api-error contract를 제거한다.
- validation, not-found, body-limit, auth, domain mapping이 같은 envelope를 반환한다.
- 클라이언트 unknown response는 하나의 `CONTRACT_ERROR`로 정규화한다.

**수용 기준**

- [ ] 모든 오류 응답에 requestId가 있다.
- [ ] 관리자와 학습자 error parser가 하나다.
- [ ] body limit와 origin 오류도 canonical schema를 통과한다.
- [ ] legacy path/status 기반 code remapping이 없다.
- [ ] Hono integration test가 400/401/403/404/409/413/429/500을 검증한다.

#### GG-302 — Hono route를 직접 등록하도록 http-platform 축소

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P0     |
| Story Point | 13     |
| 주 담당     | 개발   |
| 선행 티켓   | GG-301 |

**목표**

프레임워크 타입을 우회하는 자체 route framework를 제거한다.

**작업 범위**

- `defineRoute`, `defineRouteForEnv`, `LooseRouteHandler`, `DefinedRoute`를 삭제한다.
- `createApp`는 middleware, validation hook, not-found, onError만 조립한다.
- 각 module interface가 `app.openapi(route, handler)`를 직접 사용한다.
- `as never` route/handler 연결부를 제거한다.
- path 문법 검사 같은 중복 runtime abstraction을 제거한다.

**수용 기준**

- [ ] route 등록 코드에 `as never`가 없다.
- [ ] 각 route의 request·response type inference가 Hono/OpenAPI 원형을 사용한다.
- [ ] http-platform public export가 app/error/security/openapi helper로 축소된다.
- [ ] 모든 기존 route integration test가 새 등록 방식으로 통과한다.

#### GG-303 — 관리자 route registry와 composition wrapper 제거

| 필드        | 값                     |
| ----------- | ---------------------- |
| 유형        | Task                   |
| 우선순위    | P0                     |
| Story Point | 8                      |
| 주 담당     | 개발                   |
| 선행 티켓   | GG-302, GG-101, GG-103 |

**목표**

정적인 route 목록을 capability slot과 조립 순서로 관리하는 계층을 제거한다.

**작업 범위**

- `admin-route-registry*`, `admin-route-group*`를 삭제한다.
- `composeAdminIdentityRouteGroup`처럼 전달만 하는 composition 함수를 제거한다.
- API composition root에서 module별 register 함수를 명시적으로 호출한다.
- route slot 수, freeze, 배열 순서를 고정하는 테스트를 삭제한다.
- container는 실제 module dependency만 보유한다.

**수용 기준**

- [ ] admin route 등록 흐름을 한 파일에서 읽을 수 있다.
- [ ] resourceLibrary와 admin AI capability slot이 없다.
- [ ] route 순서는 기능 동작에 영향을 주지 않는다.
- [ ] operation ID 중복 검사는 GG-304의 생성 문서 검사로 이동한다.

#### GG-304 — admin·learner OpenAPI 문서와 Scalar 제공

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Story          |
| 우선순위    | P1             |
| Story Point | 8              |
| 주 담당     | 개발           |
| 선행 티켓   | GG-302, GG-303 |

**목표**

내부 API 계약을 생성 클라이언트와 개발자 문서의 단일 입력으로 만든다.

**작업 범위**

- learner와 admin OpenAPI 3.1 document를 별도로 생성한다.
- build script가 runtime 서버 없이 JSON 파일을 생성한다.
- Scalar UI는 development·test·staging에서만 활성화한다.
- production은 명시적 `ENABLE_API_DOCS=true` 없이는 문서 route를 노출하지 않는다.
- admin document에는 learner 전용 route가, learner document에는 admin route가 섞이지 않게 한다.

**수용 기준**

- [ ] 두 문서가 schema validation을 통과한다.
- [ ] operationId가 전체 문서 안에서 고유하다.
- [ ] removed resource/chat/reset operation이 없다.
- [ ] Scalar에서 request·response와 canonical error가 표시된다.
- [ ] 문서 생성 결과가 결정적이다.

#### GG-305 — Orval 생성 파이프라인과 http-client package 재구성

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P0     |
| Story Point | 13     |
| 주 담당     | 개발   |
| 선행 티켓   | GG-304 |

**목표**

수동 endpoint client를 generated client로 대체할 기반을 만든다.

**작업 범위**

- `@workspace/http-client`의 generic JSON transport를 제거한다.
- admin·learner Orval config를 추가한다.
- 생성물은 package 내부 `.generated/admin`, `.generated/learner`에 둔다.
- browser/server fetch mutator는 cookie forwarding, base URL, AbortSignal, canonical error만 담당한다.
- OpenAPI 생성 → Orval 생성 → typecheck가 Turbo dependency로 연결된다.
- 생성 파일은 저장소 커밋 대상에서 제외한다.

**수용 기준**

- [ ] clean checkout에서 build 전에 client가 자동 생성된다.
- [ ] OpenAPI 변경이 generated type에 반영된다.
- [ ] custom mutator 외에 hand-written endpoint URL이 없다.
- [ ] network/abort/http/contract 오류가 하나의 client error 계약으로 수렴한다.
- [ ] Orval 생성물에 resource/chat operation이 없다.

#### GG-306 — 학습자 앱을 Orval client로 전환

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P0     |
| Story Point | 13     |
| 주 담당     | 개발   |
| 선행 티켓   | GG-305 |

**목표**

web 앱의 수동 API Port, DAL, adapter 중첩을 제거한다.

**작업 범위**

- `WritingAppApi`, `create-http-writing-app-api`, feature별 `Pick<>` API wrapper를 제거한다.
- `course-catalog`, `learner-home`, `lesson-session`, `profile`을 generated learner client로 전환한다.
- server component용 cookie-forwarding client와 browser client만 남긴다.
- 응답을 앱에서 다시 Zod parse하는 코드를 제거한다.
- Next cache/revalidation 책임은 route/server action에만 둔다.

**수용 기준**

- [ ] web 앱에 hand-written `/api/...` endpoint 문자열이 없다.
- [ ] feature별 DAL interface가 없다.
- [ ] generated type으로 page와 hook이 typecheck된다.
- [ ] 401, network failure, contract failure UI가 일관된다.
- [ ] 학습자 핵심 smoke test가 통과한다.

#### GG-307 — 관리자 앱을 Orval client로 전환

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P0     |
| Story Point | 13     |
| 주 담당     | 개발   |
| 선행 티켓   | GG-305 |

**목표**

admin 앱의 DAL·transport·adapter 계층을 generated client로 대체한다.

**작업 범위**

- `admin-http-transport`, `AdminApiResult`, feature DAL·HTTP adapter를 제거한다.
- dashboard, analytics, course, user, auth session을 generated admin client로 전환한다.
- server action은 session, generated mutation, `revalidatePath`만 담당한다.
- 입력 검증은 action 경계와 API 계약에서만 수행한다.
- deleted resource/chat/maintenance adapter가 남지 않게 한다.

**수용 기준**

- [ ] admin 앱에 hand-written endpoint path가 없다.
- [ ] 단순 전달 server action test는 제거되고 중요한 mutation test만 남는다.
- [ ] generated error type으로 인증·권한·conflict 상태를 처리한다.
- [ ] 관리자 코스·사용자 smoke test가 통과한다.

#### GG-308 — dependency-cruiser·Knip·exports를 목표 경계에 맞춤

| 필드        | 값            |
| ----------- | ------------- |
| 유형        | Chore         |
| 우선순위    | P0            |
| Story Point | 5             |
| 주 담당     | 개발          |
| 선행 티켓   | GG-302~GG-307 |

**목표**

새 구조를 별도 runtime 감시 코드 없이 정적 도구로 강제한다.

**작업 범위**

- frontend는 `@workspace/http-client`, auth, contracts, ui, config만 import할 수 있게 한다.
- module domain/application의 framework·DB import를 금지한다.
- module 내부 private path의 외부 import를 금지한다.
- removed package export와 root catalog dependency를 정리한다.
- generated directory는 Knip·formatter의 적절한 ignore/entry로 설정한다.

**수용 기준**

- [ ] dependency-cruiser가 의도적 위반 fixture를 실패시킨다.
- [ ] Knip 결과에 resource, Mastra, old transport dead export가 없다.
- [ ] package export map이 실제 public surface만 노출한다.
- [ ] 별도 source 문자열 검사 테스트를 만들지 않는다.

#### GG-309 — 불필요한 Object.freeze 제거와 타입 안전 규칙 정리

| 필드        | 값            |
| ----------- | ------------- |
| 유형        | Chore         |
| 우선순위    | P1            |
| Story Point | 8             |
| 주 담당     | 개발          |
| 선행 티켓   | GG-302~GG-308 |

**목표**

런타임 불변성 감시 코드는 줄이고 TypeScript readonly와 branded ID는 유지한다.

**작업 범위**

- DTO, factory 반환값, 짧은 배열에 관성적으로 적용된 `Object.freeze`를 제거한다.
- 외부 plugin API, 공유 mutable singleton 등 실제 런타임 변조 위험이 있는 경우만 freeze를 허용한다.
- public contract와 domain model의 TypeScript `readonly`는 유지한다.
- course, curriculum, lesson, step, user 등 핵심 branded ID는 유지한다.
- freeze 여부만 검증하는 테스트를 삭제한다.

**수용 기준**

- [ ] Object.freeze 사용처마다 런타임 필요성이 설명되거나 제거된다.
- [ ] readonly와 branded ID typecheck가 유지된다.
- [ ] 얕은 freeze를 보안·deep immutability로 오해하는 코드와 문서가 없다.
- [ ] production behavior와 serialization 결과가 변하지 않는다.

**추가 조건**

- 모든 freeze를 기계적으로 제거하지 않는다.
- branded ID 제거는 이 계획의 범위가 아니다.

### E4. 인증과 이메일

#### GG-401 — Resend 이메일 delivery Port와 adapter 구현

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P0     |
| Story Point | 8      |
| 주 담당     | 개발   |
| 선행 티켓   | GG-201 |

**목표**

인증 로직이 Resend SDK에 직접 결합되지 않도록 작은 delivery Port를 둔다.

**작업 범위**

- `@workspace/auth`에 verification·password reset 이메일 전송 Port를 정의한다.
- 동일 package infrastructure에 Resend adapter를 구현한다.
- Korean template, absolute callback URL, timeout, normalized failure를 지원한다.
- `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, optional reply-to env를 정의한다.
- test에서는 in-memory fake를 주입한다.

**수용 기준**

- [ ] domain/user data가 Resend SDK type을 알지 못한다.
- [ ] secret이나 email body가 application log에 기록되지 않는다.
- [ ] 잘못된 config는 production start를 fail-closed한다.
- [ ] fake adapter로 verification/reset 흐름을 deterministic하게 테스트할 수 있다.

#### GG-402 — 학습자 이메일 가입·확인·로그인 구현

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Story          |
| 우선순위    | P0             |
| Story Point | 13             |
| 주 담당     | 개발           |
| 선행 티켓   | GG-401, GG-306 |

**목표**

Google 외에 이메일·비밀번호 기반 학습자 가입 흐름을 제공한다.

**작업 범위**

- Better Auth credentials signup과 login을 활성화한다.
- 이메일 확인 전 정책을 확정하고 보호 route 접근을 차단한다.
- verification email을 Resend Port로 보낸다.
- 가입·확인·로그인 UI를 한국어로 구현한다.
- 중복 이메일과 약한 비밀번호 오류를 canonical error로 표시한다.

**수용 기준**

- [ ] 신규 사용자가 이메일로 가입하고 확인 후 로그인할 수 있다.
- [ ] 확인 전 session으로 학습 API를 사용할 수 없다.
- [ ] verification resend에 rate limit이 있다.
- [ ] Google login은 기존대로 동작한다.
- [ ] Playwright credentials signup flow가 통과한다.

#### GG-403 — 비밀번호 재설정과 Google 계정 연결 구현

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Story          |
| 우선순위    | P1             |
| Story Point | 8              |
| 주 담당     | 개발           |
| 선행 티켓   | GG-401, GG-402 |

**목표**

계정 복구와 동일 이메일 provider 통합을 안전하게 지원한다.

**작업 범위**

- 비밀번호 재설정 요청·메일·완료 화면을 구현한다.
- token 만료와 1회 사용을 보장한다.
- Google과 credentials가 같은 검증된 이메일을 사용할 때 중복 user를 만들지 않는다.
- 계정 연결 실패를 사용자에게 일반화된 메시지로 표시한다.
- 이메일 존재 여부를 노출하지 않는 응답을 사용한다.

**수용 기준**

- [ ] reset token 재사용이 거절된다.
- [ ] 존재하지 않는 이메일과 존재하는 이메일의 외부 응답이 동일하다.
- [ ] 동일 이메일 Google 로그인 후 기존 학습 데이터가 유지된다.
- [ ] integration 및 E2E가 통과한다.

#### GG-404 — owner-only 관리자 인증과 seed CLI 정리

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Task           |
| 우선순위    | P0             |
| Story Point | 8              |
| 주 담당     | 개발           |
| 선행 티켓   | GG-202, GG-307 |

**목표**

별도 admin subdomain의 credentials 인증을 단일 owner 모델로 단순화한다.

**작업 범위**

- 관리자 self-signup을 비활성화한다.
- `seed:admin`은 owner 계정 생성·비밀번호 reset만 지원한다.
- operator fixture와 role UI를 제거한다.
- 관리자 cookie 이름과 secret은 learner와 분리한다.
- 관리자 비밀번호 reset은 초기 출시에서 CLI만 지원한다.

**수용 기준**

- [ ] owner 한 명 이상을 CLI로 생성할 수 있다.
- [ ] 같은 CLI를 재실행해도 중복 계정이 생기지 않는다.
- [ ] admin cookie로 learner API를, learner cookie로 admin API를 사용할 수 없다.
- [ ] admin login E2E가 통과한다.

#### GG-405 — 인증 보안·테스트 fixture 단순화

| 필드        | 값            |
| ----------- | ------------- |
| 유형        | Task          |
| 우선순위    | P0            |
| Story Point | 8             |
| 주 담당     | 개발          |
| 선행 티켓   | GG-402~GG-404 |

**목표**

실제 보안 경계는 유지하면서 Better Auth 내부 구현을 흉내 내는 테스트 코드를 줄인다.

**작업 범위**

- 복잡한 test auth plugin과 display-name synchronizer를 제거한다.
- E2E 사용자는 fixture DB에서 직접 생성한다.
- open redirect, cookie, session revocation, rate limit, origin 검증을 integration test로 유지한다.
- 로그인·verification·reset body size와 input limit을 적용한다.
- auth 오류에는 account 존재 여부와 provider 원문을 노출하지 않는다.

**수용 기준**

- [ ] test-only auth route가 production build에 포함되지 않는다.
- [ ] source tree 문자열 검사 없이 보안 회귀를 검증한다.
- [ ] 세션 폐기 후 기존 cookie가 401을 받는다.
- [ ] Google·credentials·admin auth matrix가 문서화된다.

### E5. 학습 상태와 서버 초안

#### GG-501 — 서버·클라이언트 학습 상태 책임 계약 확정

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Task           |
| 우선순위    | P0             |
| Story Point | 5              |
| 주 담당     | 개발           |
| 선행 티켓   | GG-001, GG-002 |

**목표**

두 상태 머신을 유지하되 비즈니스 규칙 중복을 방지한다.

**작업 범위**

- 서버는 revision, current step, grading, unlock, completion, conflict를 소유한다.
- 클라이언트는 loading, editing, saving, checking, advancing, recoverable error만 소유한다.
- 클라이언트가 정답·다음 step·완료 여부를 독자 계산하지 못하게 한다.
- visible 상태에서 제한된 주기 sync, focus, reconnect, 사용자 action sync 정책을 문서화한다.

**수용 기준**

- [ ] `docs/product/learner-journey.md`와 architecture 문서가 같은 책임을 설명한다.
- [ ] client machine event와 server transition DTO가 구분된다.
- [ ] optimistic UI는 server response로 reconcile한다.

#### GG-502 — saveStepDraft application·repository·HTTP 구현

| 필드        | 값                             |
| ----------- | ------------------------------ |
| 유형        | Story                          |
| 우선순위    | P0                             |
| Story Point | 13                             |
| 주 담당     | 개발                           |
| 선행 티켓   | GG-204, GG-301, GG-302, GG-501 |

**목표**

interactive step 답안을 제출 전 서버에 안전하게 저장한다.

**작업 범위**

- learning application에 `saveStepDraft` command를 추가한다.
- 현재 learner, curriculum revision, lesson, step 접근을 검증한다.
- expected version을 사용한 optimistic update를 구현한다.
- draft read를 lesson start/read 응답에 포함한다.
- submit 성공 transaction에서 answer 저장과 draft 삭제를 원자적으로 수행한다.

**수용 기준**

- [ ] 다른 사용자·잠긴 lesson·다른 revision draft 저장이 거절된다.
- [ ] 동일 version update가 성공하고 stale version은 409를 반환한다.
- [ ] submit 성공 후 draft가 남지 않는다.
- [ ] DB 실패 시 answer와 draft가 반쪽 상태로 남지 않는다.
- [ ] Hono와 SQLite integration test가 통과한다.

#### GG-503 — 웹 autosave·복구·동기화로 전환

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Story          |
| 우선순위    | P0             |
| Story Point | 13             |
| 주 담당     | 개발           |
| 선행 티켓   | GG-306, GG-502 |

**목표**

브라우저 localStorage 없이 서버 draft를 사용자 경험에 연결한다.

**작업 범위**

- 입력 변경 후 debounce 저장을 구현한다.
- blur, visibility hidden, exit action에서 가능한 범위의 즉시 flush를 수행한다.
- lesson 진입 시 server draft를 복구한다.
- visible 상태에서 저빈도 sync, focus, reconnect 시 reconcile한다.
- saving/saved/conflict/offline 상태를 명확히 표시한다.

**수용 기준**

- [ ] 새로고침·재로그인·다른 기기에서 draft를 복구할 수 있다.
- [ ] 네트워크 실패 중 입력이 화면에서 사라지지 않는다.
- [ ] 동일 tab의 중복 save를 합친다.
- [ ] stale conflict에서 최신 서버 값과 로컬 미전송 값을 복구할 수 있다.
- [ ] Safari와 Chromium에서 autosave smoke가 통과한다.

#### GG-504 — localStorage draft와 로그아웃 정리 코드 제거

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P0     |
| Story Point | 5      |
| 주 담당     | 개발   |
| 선행 티켓   | GG-503 |

**목표**

서버 draft 전환 후 남는 이중 저장·감시 코드를 삭제한다.

**작업 범위**

- `lesson-draft-storage.ts`, 관련 hook·test를 삭제한다.
- memory cache, storage event, versioned key, legacy key 코드를 삭제한다.
- 로그아웃 시 local draft를 지우는 로직을 제거한다.
- AI feedback target 답안은 server lesson state에서 읽는다.

**수용 기준**

- [ ] repository 전역에 `writing-app:lesson-draft` key가 없다.
- [ ] 로그아웃 후 재로그인하면 서버 draft가 유지된다.
- [ ] `useSyncExternalStore` 기반 draft hook이 제거된다.
- [ ] Knip과 bundle 검증이 통과한다.

#### GG-505 — learning application 계층을 transaction use case 중심으로 압축

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P1     |
| Story Point | 13     |
| 주 담당     | 개발   |
| 선행 티켓   | GG-502 |

**목표**

4계층은 유지하되 shape 전달용 service·projection·presenter를 줄인다.

**작업 범위**

- `startLesson`, `saveStepDraft`, `submitStep`, `readLearnerHome`, `readCourseCatalog`, `readCourseDetail`, `readLesson` 중심으로 application surface를 정리한다.
- `learner-content-service`, `learner-progress-service`, read projection, step presenter의 책임을 합치거나 제거한다.
- grading, progress transition, learning date는 순수 domain 함수로 유지한다.
- application service 자체를 다시 감싸는 command/query factory를 제거한다.
- 관련 use case는 의미상 함께 읽히는 파일에 통합한다.

**수용 기준**

- [ ] 한 learner request를 추적하는 핵심 파일 수가 줄어든다.
- [ ] domain test는 grading·transition만 보호한다.
- [ ] wrapper 호출 횟수 test가 제거된다.
- [ ] module public export가 application과 필요한 ports로 제한된다.

#### GG-506 — 10개 활동 유형의 answer·draft·evaluation 계약 정규화

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Task           |
| 우선순위    | P0             |
| Story Point | 13             |
| 주 담당     | 개발           |
| 선행 티켓   | GG-501, GG-502 |

**목표**

모든 활동 유형을 유지하면서 payload 중복과 특수 처리를 줄인다.

**작업 범위**

- 10개 step을 하나의 discriminated union으로 유지한다.
- interactive type별 answer payload와 server evaluation을 명확히 정의한다.
- READING은 draft가 없고, AI_FEEDBACK은 target WRITE 답안을 참조한다.
- stable item ID를 사용하고 표시 텍스트로 정답을 판정하지 않는다.
- admin form registry와 learner renderer registry가 같은 contract를 소비한다.

**수용 기준**

- [ ] 각 활동 유형에 valid/invalid contract test가 있다.
- [ ] 중복 텍스트 MATCH/CATEGORIZE도 stable ID로 동작한다.
- [ ] client는 server evaluation만으로 정오답 UI를 표시한다.
- [ ] 모든 type이 seed와 E2E fixture에 최소 한 번 존재한다.

### E6. AI 피드백

#### GG-601 — AI 점수 필드를 contracts·seed·admin·web에서 제거

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Task           |
| 우선순위    | P0             |
| Story Point | 8              |
| 주 담당     | 개발           |
| 선행 티켓   | GG-205, GG-506 |

**목표**

숨겨진 점수 생성까지 포함해 숫자 평가 개념을 제품에서 완전히 제거한다.

**작업 범위**

- AI feedback contract와 UI component에서 score 관련 필드를 제거한다.
- AI_FEEDBACK step definition에서 `score`, `scoreMax`, `showScore`를 제거한다.
- seed data와 test fixture를 갱신한다.
- 관리자 step form에서 점수 설정을 제거한다.
- 정확한 숫자 평가를 암시하는 카피를 제거한다.

**수용 기준**

- [ ] repository 전역에서 AI 피드백 score 필드 참조가 0건이다.
- [ ] admin editor와 learner renderer가 새 schema로 동작한다.
- [ ] 기존 score fixture가 contract parse에 실패한다.
- [ ] OpenAPI와 generated client에 score가 없다.

#### GG-602 — AI 피드백 domain·OpenAI provider 단순화

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P0     |
| Story Point | 13     |
| 주 담당     | 개발   |
| 선행 티켓   | GG-601 |

**목표**

구조화된 코칭 결과만 생성하고 provider 원문을 경계 밖으로 내보내지 않는다.

**작업 범위**

- 결과는 summary, strengths, improvements, nextAction만 가진다.
- prompt에서 숫자 점수 지시를 제거한다.
- OpenAI structured output schema를 새 결과에 맞춘다.
- provider raw response는 저장·로그하지 않는다.
- Mastra 없이 OpenAI SDK adapter를 직접 사용한다.

**수용 기준**

- [ ] 알 수 없는 필드와 길이 초과 provider response가 거절된다.
- [ ] usage observer에는 model과 token 수만 전달된다.
- [ ] timeout/abort/unavailable/invalid response가 정규화된다.
- [ ] provider cause가 HTTP body와 JSON log에 노출되지 않는다.

#### GG-603 — AI quota·idempotency·retry 정책 구현

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Story          |
| 우선순위    | P0             |
| Story Point | 13             |
| 주 담당     | 개발           |
| 선행 티켓   | GG-205, GG-602 |

**목표**

핵심 기능을 유지하면서 반복 요청과 비용 폭주를 방지한다.

**작업 범위**

- step당 성공 피드백 최대 3회를 유지한다.
- 동일 step pending 1개와 idempotency key를 강제한다.
- 사용자별 일일 quota와 전체 일일 quota를 환경 설정으로 둔다.
- provider timeout 30초, pending TTL 60초를 기본값으로 둔다.
- 실패 요청은 성공 quota를 소모하지 않되 abuse 방지를 위한 request counter에는 포함한다.

**수용 기준**

- [ ] 동시 요청이 provider를 중복 호출하지 않는다.
- [ ] quota 초과는 429와 retry 정보로 반환된다.
- [ ] provider 장애가 답안 저장과 레슨 진행을 rollback하지 않는다.
- [ ] 재시도 가능한 오류와 영구 limit 오류가 UI에서 구분된다.
- [ ] fast-check 또는 table test로 상태 전이를 검증한다.

#### GG-604 — AI 운영·품질 분석과 학습자 UI 상태 완성

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Story          |
| 우선순위    | P1             |
| Story Point | 8              |
| 주 담당     | 개발·디자인    |
| 선행 티켓   | GG-603, GG-803 |

**목표**

AI를 모델 학습 데이터가 아니라 서비스 품질 관점에서 관측하고 설명한다.

**작업 범위**

- 성공률, 실패 code, latency, token, retry 수를 집계한다.
- 답안과 피드백 원문은 분석 log에 넣지 않는다.
- 학습자 UI에 요청 중, 성공, 재시도 가능 실패, quota 초과를 한국어로 표시한다.
- AI가 실패해도 계속 학습할 수 있는 CTA를 제공한다.
- 데이터 사용 목적을 privacy 문서에 기록한다.

**수용 기준**

- [ ] 관리자 분석 또는 운영 query로 집계치를 확인할 수 있다.
- [ ] 원문 없이도 provider 품질을 진단할 수 있다.
- [ ] AI 실패 E2E에서 레슨 완료가 가능하다.
- [ ] 숫자 점수 UI가 없다.

### E7. 콘텐츠와 이미지

#### GG-701 — content application 파일과 Port surface 정리

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Task           |
| 우선순위    | P1             |
| Story Point | 13             |
| 주 담당     | 개발           |
| 선행 티켓   | GG-202, GG-303 |

**목표**

모듈 경계는 유지하면서 한 줄 use case와 전달 Port를 줄인다.

**작업 범위**

- `list-courses`, `read-course-editor` 같은 전달 전용 use case를 application에 통합한다.
- `ContentChangeCommandPort`처럼 application을 다시 감싸는 factory를 제거한다.
- 인증된 admin actor는 adminId만 전달하고 role authorization ceremony를 제거한다.
- draft/published revision, conflict, immutable policy는 유지한다.
- module public surface를 application, ports, registerRoutes, schema로 제한한다.

**수용 기준**

- [ ] 코스 생성·저장·발행·보관 경로가 기능별 4계층 안에서 읽힌다.
- [ ] published revision trigger와 application guard가 유지된다.
- [ ] 단순 repository 전달 함수 test가 제거된다.
- [ ] 관리자 코스 integration test가 통과한다.

#### GG-702 — S3 호환 콘텐츠 이미지 업로드·처리 구현

| 필드        | 값                     |
| ----------- | ---------------------- |
| 유형        | Story                  |
| 우선순위    | P1                     |
| Story Point | 13                     |
| 주 담당     | 개발                   |
| 선행 티켓   | GG-206, GG-301, GG-302 |

**목표**

course cover와 READING illustration을 안전하게 업로드한다.

**작업 범위**

- content module에 asset upload Port와 application command를 추가한다.
- JPEG, PNG, WebP만 허용하고 5MB 이하로 제한한다.
- Sharp로 decode·재인코딩하고 EXIF를 제거한다.
- course cover와 reading illustration 규격으로 resize한다.
- S3 호환 storage adapter는 R2 외 endpoint도 지원한다.
- alt text를 필수로 받는다.

**수용 기준**

- [ ] 확장자 위장 파일이 signature/decode 단계에서 거절된다.
- [ ] SVG, GIF, TIFF 등 비지원 형식이 거절된다.
- [ ] object key에 사용자 입력 경로가 직접 사용되지 않는다.
- [ ] 업로드 실패 시 DB에 active asset row가 남지 않는다.
- [ ] Hono multipart integration test가 통과한다.

#### GG-703 — 관리자 코스 편집기에 이미지 관리 추가

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Story          |
| 우선순위    | P1             |
| Story Point | 8              |
| 주 담당     | 디자인·개발    |
| 선행 티켓   | GG-307, GG-702 |

**목표**

관리자가 코스 표지와 READING illustration을 draft에서 관리할 수 있게 한다.

**작업 범위**

- course cover 선택·교체 UI를 추가한다.
- READING step에 optional illustration과 alt text를 추가한다.
- 업로드 progress와 오류를 표시한다.
- 업로드 후 asset ID를 editor document에 저장한다.
- 프로필 이미지 업로드 UI는 만들지 않는다.

**수용 기준**

- [ ] draft 저장·reload 후 이미지가 유지된다.
- [ ] alt text 없는 저장이 거절된다.
- [ ] published revision 편집 화면에서 기존 asset을 변경할 수 없다.
- [ ] 모바일 admin에서도 기본 업로드가 가능하다.

#### GG-704 — 학습자 이미지 렌더링과 asset cleanup 정책 구현

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Task           |
| 우선순위    | P1             |
| Story Point | 8              |
| 주 담당     | 개발           |
| 선행 티켓   | GG-702, GG-703 |

**목표**

학습 이미지가 빠르고 안전하게 보이며 불필요한 저장소 감시 계층을 만들지 않는다.

**작업 범위**

- course cover와 READING illustration을 learner DTO와 UI에 연결한다.
- Next image remote pattern과 optimizer security를 설정한다.
- draft에서 참조가 끊긴 asset은 즉시 삭제하지 않고 orphaned_at을 기록한다.
- 7일 이상 참조되지 않은 draft asset을 maintenance에서 정리한다.
- published asset은 cleanup 대상에서 제외한다.

**수용 기준**

- [ ] 이미지 URL이 허용된 storage origin에서만 렌더링된다.
- [ ] alt text가 learner UI에 전달된다.
- [ ] storage 삭제 실패는 재시도 가능한 orphan 상태로 남고 사용자 저장은 보존된다.
- [ ] 범용 reconciliation framework를 추가하지 않는다.

#### GG-705 — 콘텐츠 seed·편집·발행 E2E 재작성

| 필드        | 값            |
| ----------- | ------------- |
| 유형        | Task          |
| 우선순위    | P1            |
| Story Point | 8             |
| 주 담당     | 개발          |
| 선행 티켓   | GG-701~GG-704 |

**목표**

삭제된 자료/AI 기능 없이 실제 콘텐츠 작성과 발행 흐름을 검증한다.

**작업 범위**

- 10개 활동 유형을 포함한 course fixture를 정리한다.
- course cover와 READING image fixture를 포함한다.
- admin에서 코스 생성, 10개 step 편집, 이미지 업로드, 발행을 검증한다.
- published revision을 기존 learner가 계속 사용하는 흐름을 검증한다.
- content reset UI와 resource E2E를 제거한다.

**수용 기준**

- [ ] admin content E2E가 한 개의 coherent flow로 통과한다.
- [ ] 발행 후 기존 revision mutation이 DB와 API에서 모두 거절된다.
- [ ] 새 draft revision 생성 후 수정이 가능하다.
- [ ] fixture가 실제 contract를 직접 사용한다.

### E8. 분석·디자인·프런트

#### GG-801 — 첫 레슨 시작·7일 내 재방문 지표 정의

| 필드        | 값        |
| ----------- | --------- |
| 유형        | Task      |
| 우선순위    | P0        |
| Story Point | 5         |
| 주 담당     | 기획·개발 |
| 선행 티켓   | GG-001    |

**목표**

출시 후 관리자 분석이 실제 제품 성공 기준을 측정하도록 정의를 고정한다.

**작업 범위**

- 첫 레슨 시작 event의 발생 조건을 정의한다.
- 7일 내 재방문은 첫 시작 후 다른 날짜에 학습 활동이 있는 것으로 정의한다.
- Asia/Seoul 날짜 경계와 7일 window를 정의한다.
- 아직 7일이 지나지 않은 cohort를 분모에서 제외한다.
- bot·관리자·deleted user 처리 규칙을 정한다.

**수용 기준**

- [ ] metrics 문서에 SQL로 구현 가능한 정의가 있다.
- [ ] 예시 cohort와 기대 결과가 표로 제공된다.
- [ ] 기획과 개발이 동일한 숫자를 설명할 수 있다.

#### GG-802 — operations reporting을 read-only SQL repository로 단순화

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Task           |
| 우선순위    | P1             |
| Story Point | 13             |
| 주 담당     | 개발           |
| 선행 티켓   | GG-201, GG-801 |

**목표**

여러 모듈 snapshot을 메모리에서 join하는 대신 허용된 reporting 예외를 사용한다.

**작업 범위**

- operations infrastructure에 read-only reporting repository를 둔다.
- identity, content, learning table을 SQL join·aggregate한다.
- 기존 content/identity/learning reporting Port와 snapshot 조립을 제거한다.
- query는 수정 statement를 실행할 수 없게 제한한다.
- 첫 레슨 시작, D7 return, completion, drop-off를 계산한다.

**수용 기준**

- [ ] dashboard query가 전체 learner/content row를 application memory로 로드하지 않는다.
- [ ] 동일 fixture에서 기존 지표와 새 지표가 결정적으로 계산된다.
- [ ] reporting code는 다른 모듈 repository를 import하지 않는다.
- [ ] dependency rule에 read-only exception이 명시된다.

#### GG-803 — 관리자 dashboard·analytics API 계약 재설계

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Task           |
| 우선순위    | P1             |
| Story Point | 8              |
| 주 담당     | 개발           |
| 선행 티켓   | GG-301, GG-802 |

**목표**

핵심 지표와 서버측 검색·정렬·pagination을 제공한다.

**작업 범위**

- dashboard에 total users, 7일 active, first lesson starts, activation rate, D7 return, completions를 제공한다.
- analytics daily series는 signup/start/completion/return을 제공한다.
- lesson analytics 검색·정렬·pagination을 API에서 수행한다.
- AI 품질 집계 endpoint를 operations에 추가한다.
- removed streak distribution은 기본 dashboard에서 제거한다.

**수용 기준**

- [ ] admin client가 전체 lesson analytics를 한 번에 받지 않는다.
- [ ] query validation과 pagination upper bound가 있다.
- [ ] 빈 데이터와 부분 기간 cohort가 명확히 표현된다.
- [ ] OpenAPI와 generated client가 갱신된다.

#### GG-804 — 관리자 차트 렌더링 구조 단순화

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Task           |
| 우선순위    | P1             |
| Story Point | 8              |
| 주 담당     | 개발·디자인    |
| 선행 티켓   | GG-307, GG-803 |

**목표**

차트는 유지하되 IntersectionObserver·다중 dynamic import·전용 error boundary를 줄인다.

**작업 범위**

- 분석 화면의 단일 client boundary에서 Recharts를 로드한다.
- 차트별 dynamic import와 IntersectionObserver를 제거한다.
- 공통 chart shell과 tooltip token을 사용한다.
- 텍스트 요약과 하나의 접근 가능한 data table을 제공한다.
- 차트는 signup/activation, lesson start/completion, D7 return 세 종류로 제한한다.

**수용 기준**

- [ ] 차트별 중복 hidden table이 없다.
- [ ] 차트 로드 실패는 page-level recoverable state로 처리한다.
- [ ] light/dark token으로 가독성이 유지된다.
- [ ] client bundle budget을 초과하지 않는다.

#### GG-805 — 관리자 dashboard·analytics 화면 개편

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Story          |
| 우선순위    | P1             |
| Story Point | 8              |
| 주 담당     | 디자인·개발    |
| 선행 티켓   | GG-803, GG-804 |

**목표**

운영자가 제품 성공과 문제 레슨을 빠르게 판단하게 한다.

**작업 범위**

- 핵심 metric card 순서를 제품 지표에 맞춘다.
- 최근 활동에는 필요한 최소 PII만 노출한다.
- 이탈률 상위 레슨과 AI 실패율 상위 레슨 표를 제공한다.
- 검색·정렬·pagination 상태를 URL에 보존한다.
- mobile에서는 table horizontal scroll과 핵심 action을 유지한다.

**수용 기준**

- [ ] dashboard에서 첫 레슨 시작과 D7 return을 확인할 수 있다.
- [ ] analytics query 변경이 server request를 발생시킨다.
- [ ] empty/error/loading 상태가 한국어로 일관된다.
- [ ] 관리자 mobile smoke가 통과한다.

#### GG-806 — 짧은 공개 랜딩의 정보 구조와 카피 확정

| 필드        | 값          |
| ----------- | ----------- |
| 유형        | Design      |
| 우선순위    | P1          |
| Story Point | 5           |
| 주 담당     | 기획·디자인 |
| 선행 티켓   | GG-105      |

**목표**

삭제 후 남은 랜딩을 실제 글쓰기 제품의 4개 섹션으로 설계한다.

**작업 범위**

- Hero: 글쓰기 능력 향상 가치와 시작 CTA.
- 학습 방식: 짧은 레슨, 직접 쓰기, AI 코칭.
- 실제 화면·코스: 실제 앱 screenshot과 실제 seed course.
- 최종 CTA와 이용약관·개인정보 링크.
- 브랜드명은 전역에서 `글결.`로 통일한다.

**수용 기준**

- [ ] 카피에 일반 학습 플랫폼 표현이 없다.
- [ ] 검증되지 않은 수치·후기·성과 주장이 없다.
- [ ] 모바일·dark mode 시안이 있다.
- [ ] CTA 목적지가 인증 상태와 일치한다.

#### GG-807 — 새 랜딩 구현과 실제 제품 시각 자료 연결

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Story          |
| 우선순위    | P1             |
| Story Point | 8              |
| 주 담당     | 개발·디자인    |
| 선행 티켓   | GG-306, GG-806 |

**목표**

정적 장식보다 실제 제품 이해를 돕는 공개 화면을 구현한다.

**작업 범위**

- 4개 섹션만 구현한다.
- 실제 learner 화면을 기반으로 한 screenshot 또는 제품 mock을 사용한다.
- 코스 CTA와 로그인 CTA를 명확히 구분한다.
- 모션은 hover, press, 짧은 opacity transition만 사용한다.
- footer에 실제 정책·제품 링크만 둔다.

**수용 기준**

- [ ] section 개수나 정확한 문구를 고정하는 brittle test가 없다.
- [ ] Lighthouse mobile 품질 gate를 통과한다.
- [ ] dark/light 모두 시각 검수된다.
- [ ] iOS Safari에서 overflow와 sticky 문제가 없다.

#### GG-808 — 학습자·관리자 다크 모드 완성

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Story          |
| 우선순위    | P1             |
| Story Point | 8              |
| 주 담당     | 디자인·개발    |
| 선행 티켓   | GG-805, GG-807 |

**목표**

다크 모드를 토글만 존재하는 기능이 아니라 전체 제품 상태로 완성한다.

**작업 범위**

- light/dark/system을 web과 admin 모두 제공한다.
- cream, charcoal, yellow, coral, mint를 semantic token으로 매핑한다.
- chart, table, dialog, error, loading, lesson feedback를 모두 검수한다.
- raw hex를 token 정의 외부에서 제거한다.
- 테마 변경 시 layout-shift와 긴 transition을 방지한다.

**수용 기준**

- [ ] token contrast test가 통과한다.
- [ ] web 2개·admin 2개 핵심 화면 visual regression이 있다.
- [ ] system theme 초기화와 manual toggle E2E가 통과한다.
- [ ] admin에도 ThemeProvider와 사용자 선택 보존이 있다.

#### GG-809 — 반응형·브라우저 지원·프로필 avatar 마감

| 필드        | 값                     |
| ----------- | ---------------------- |
| 유형        | Task                   |
| 우선순위    | P1                     |
| Story Point | 8                      |
| 주 담당     | 디자인·개발            |
| 선행 티켓   | GG-503, GG-705, GG-808 |

**목표**

모바일 학습과 실용적인 관리자 반응형을 출시 기준으로 만든다.

**작업 범위**

- learner는 mobile-first와 하단 주요 action을 유지한다.
- admin sidebar는 좁은 화면에서 drawer로 바꾼다.
- table은 기능을 숨기지 않고 horizontal scroll을 사용한다.
- 프로필은 Google image가 있으면 사용하고 없으면 기본 avatar를 사용한다.
- 직접 프로필 이미지 업로드는 추가하지 않는다.
- Chromium 최신·직전, iOS Safari 최신·직전 smoke matrix를 정의한다.

**수용 기준**

- [ ] 모바일에서 10개 활동 유형을 완료할 수 있다.
- [ ] admin mobile에서 사용자 상태 변경과 코스 기본 저장이 가능하다.
- [ ] OAuth image 실패 시 기본 avatar로 안전하게 fallback한다.
- [ ] 지원 브라우저 문서와 Playwright project가 일치한다.

#### GG-810 — 학습자 코스 탐색 필터를 핵심 선택지만 남기도록 축소

| 필드        | 값               |
| ----------- | ---------------- |
| 유형        | Task             |
| 우선순위    | P1               |
| Story Point | 5                |
| 주 담당     | 기획·디자인·개발 |
| 선행 티켓   | GG-306, GG-807   |

**목표**

초기 코스 수에 비해 과도한 정렬 옵션을 제거하고 탐색 결정을 단순화한다.

**작업 범위**

- 학습자 코스 목록은 검색, 카테고리, 추천 순서만 제공한다.
- lesson-count asc/desc와 title asc/desc 정렬을 제거한다.
- URL query, contract, repository query, UI control, test fixture를 함께 정리한다.
- 관리자 코스 목록의 운영용 검색·상태·pagination은 유지한다.

**수용 기준**

- [ ] learner OpenAPI와 generated client의 sort union이 `recommended` 단일 정책 또는 sort 필드 제거로 단순화된다.
- [ ] 코스 목록 UI에 불필요한 정렬 selector가 없다.
- [ ] 검색·카테고리 조합이 URL에 보존된다.
- [ ] seed course가 적은 상태에서도 빈 필터 UI가 화면을 지배하지 않는다.

**추가 조건**

- 코스가 실제로 크게 증가하고 사용자 요구가 측정되기 전에는 정렬 옵션을 다시 추가하지 않는다.

### E9. 개인정보·관측

#### GG-901 — 로그 이벤트 taxonomy와 민감정보 redaction 확정

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P0     |
| Story Point | 5      |
| 주 담당     | 개발   |
| 선행 티켓   | GG-001 |

**목표**

troubleshooting에 필요한 정보와 보존하면 안 되는 원문을 구분한다.

**작업 범위**

- request, security, audit, AI usage event schema를 문서화한다.
- requestId, route template, status, latency, actor type/id를 허용한다.
- 이메일, 이름, 답안, prompt, token, cookie, query secret을 금지한다.
- URL query와 provider cause redaction 규칙을 공통화한다.
- log level과 outcome 기준을 정의한다.

**수용 기준**

- [ ] logger unit test가 금지 필드 비노출을 검증한다.
- [ ] 동일 이벤트가 여러 logger 계층에서 중복 기록되지 않는다.
- [ ] 개발 pretty log와 production JSON log가 같은 필드를 가진다.

#### GG-902 — 관리자 감사 이벤트 영속화 연결

| 필드        | 값             |
| ----------- | -------------- |
| 유형        | Story          |
| 우선순위    | P0             |
| Story Point | 8              |
| 주 담당     | 개발           |
| 선행 티켓   | GG-207, GG-901 |

**목표**

개인정보 접근과 고위험 관리자 변경을 DB audit로 남긴다.

**작업 범위**

- 사용자 상세 조회, 정지·활성화·삭제를 기록한다.
- 콘텐츠 발행·보관을 기록한다.
- 실패한 권한·인증 시도는 security log에 기록한다.
- audit write 실패가 고위험 mutation을 어떻게 처리할지 fail-closed 정책을 적용한다.
- owner 자신을 actorId로 기록한다.

**수용 기준**

- [ ] 관리자 mutation과 audit row가 같은 transaction 또는 명확한 실패 정책을 가진다.
- [ ] audit 조회는 admin 전용이다.
- [ ] PII가 audit payload에 없다.
- [ ] integration test가 성공·실패 outcome을 검증한다.

#### GG-903 — 보존기간 purge와 일일 maintenance 명령 구현

| 필드        | 값                             |
| ----------- | ------------------------------ |
| 유형        | Task                           |
| 우선순위    | P0                             |
| Story Point | 13                             |
| 주 담당     | 개발                           |
| 선행 티켓   | GG-203, GG-207, GG-205, GG-704 |

**목표**

보존 정책을 API process 내부 scheduler가 아닌 명시적 maintenance command로 집행한다.

**작업 범위**

- `maintenance:daily` CLI를 추가한다.
- 5일 지난 deleted learner purge, 만료 session, AI pending expiry를 처리한다.
- request/security/audit retention class를 정리한다.
- 7일 지난 orphan content asset을 정리한다.
- batch size, dry-run, JSON 결과를 지원한다.
- systemd timer 설치는 deployment ticket에서 담당한다.

**수용 기준**

- [ ] 명령 재실행이 idempotent하다.
- [ ] 한 batch 실패가 삭제 기준을 모호하게 만들지 않는다.
- [ ] production 대상은 명시적 env와 DB 경로를 요구한다.
- [ ] dry-run과 실제 결과 건수가 일치하는 integration test가 있다.

#### GG-904 — 외부 삭제 marker와 restore 재적용 구현

| 필드        | 값                      |
| ----------- | ----------------------- |
| 유형        | Task                    |
| 우선순위    | P0                      |
| Story Point | 13                      |
| 주 담당     | 개발                    |
| 선행 티켓   | GG-203, GG-903, GG-1102 |

**목표**

30일 backup에서 복원할 때 이미 탈퇴한 사용자가 부활하지 않게 한다.

**작업 범위**

- 삭제 요청 승인 전에 private S3 prefix에 사용자 ID와 요청 시각만 담은 marker object를 기록한다.
- marker는 한 요청당 한 object로 저장해 append나 distributed lock을 피한다.
- restore CLI가 backup snapshot 이후 marker를 조회해 삭제 상태·purge를 재적용한다.
- marker에는 이메일·이름을 저장하지 않는다.
- marker retention은 backup 최대 수명보다 길게 설정한다.

**수용 기준**

- [ ] marker 기록 실패 시 삭제 요청은 성공으로 응답하지 않는다.
- [ ] 복원된 fixture DB에서 marker 이후 사용자가 다시 비활성·삭제된다.
- [ ] private bucket/prefix는 public asset URL과 분리된다.
- [ ] restore playbook이 재적용 결과를 검증한다.

#### GG-905 — 개인정보 처리·보존 문서와 출시 법률 검토 gate

| 필드        | 값                    |
| ----------- | --------------------- |
| 유형        | Compliance            |
| 우선순위    | P0                    |
| Story Point | 5                     |
| 주 담당     | 기획 주도 / 개발 지원 |
| 선행 티켓   | GG-901~GG-904         |

**목표**

구현 정책과 실제 한국 서비스 운영 의무 사이의 차이를 출시 전에 검토한다.

**작업 범위**

- identity, answers, AI feedback, IP/UA, audit, backup의 data map을 작성한다.
- 사용 목적, 보존기간, 파기 방식, 위탁 처리자(Resend, OpenAI, S3)를 기록한다.
- 탈퇴 후 5일, security log 90일, backup 최대 30일 정책을 검토 대상으로 명시한다.
- 서비스 약관·개인정보처리방침에 필요한 항목을 정리한다.
- 외부 법률 검토 결과가 나올 때까지 production launch를 block한다.

**수용 기준**

- [ ] 법률 검토 결과와 변경 필요 사항이 티켓으로 남는다.
- [ ] 코드 env와 문서의 보존기간이 일치한다.
- [ ] 동의가 필요한 AI 데이터 사용을 현재 범위에 추가하지 않는다.

**추가 조건**

- 한계: 이 티켓은 법률 자문을 대체하지 않는다.

### E10. 테스트·CI

#### GG-1001 — 구현 구조와 source 문자열을 고정하는 테스트 삭제

| 필드        | 값                            |
| ----------- | ----------------------------- |
| 유형        | Chore                         |
| 우선순위    | P0                            |
| Story Point | 13                            |
| 주 담당     | 개발                          |
| 선행 티켓   | GG-101~GG-105, GG-302, GG-307 |

**목표**

삭제된 구조와 내부 파일명을 보호하던 테스트를 정리한다.

**작업 범위**

- source file 문자열 포함 여부 test를 삭제한다.
- route registry slot·freeze·배열 순서 test를 삭제한다.
- health route 반환 객체 unit test를 삭제하고 deploy smoke로 대체한다.
- one-line DAL/wrapper mock 호출 test를 삭제한다.
- listener 등록·해제, exact section count, exact copy test를 삭제한다.
- `Object.freeze` 여부만 검사하는 test를 삭제한다.

**수용 기준**

- [ ] 삭제한 테스트의 요구가 lint, integration, E2E 중 필요한 곳으로 이동한다.
- [ ] 보안·DB 불변식 테스트는 삭제되지 않는다.
- [ ] test 이름만 보고 실제 사용자/시스템 위험을 이해할 수 있다.

#### GG-1002 — 목표 테스트 matrix와 도구별 책임 확정

| 필드        | 값     |
| ----------- | ------ |
| 유형        | Task   |
| 우선순위    | P0     |
| Story Point | 5      |
| 주 담당     | 개발   |
| 선행 티켓   | GG-001 |

**목표**

많은 도구를 무차별 적용하지 않고 각 도구의 책임을 고정한다.

**작업 범위**

- Vitest는 domain/application, SQLite integration, Hono integration에 사용한다.
- Testing Library는 복잡한 interaction에만 사용한다.
- MSW는 generated client UI integration에 사용한다.
- fast-check는 grading·date·transition처럼 입력 공간이 넓은 순수 규칙에만 사용한다.
- Playwright는 핵심 사용자 flow를 검증한다.
- Lighthouse, size-limit, k6는 main/release에서 실행한다.
- Storybook은 공용 UI component만 유지하고 제품 화면 visual regression은 핵심 web/admin 화면으로 제한한다.

**수용 기준**

- [ ] `docs/testing/strategy.md`에 test 추가 기준이 있다.
- [ ] coverage 숫자 threshold가 없다.
- [ ] flaky test는 retry로 숨기지 않고 원인을 고친다.
- [ ] 삭제된 resource/chat story가 없고 공용 UI story만 유지된다.

#### GG-1003 — Orval MSW와 UI fixture 정리

| 필드        | 값                     |
| ----------- | ---------------------- |
| 유형        | Task                   |
| 우선순위    | P1                     |
| Story Point | 8                      |
| 주 담당     | 개발                   |
| 선행 티켓   | GG-305, GG-306, GG-307 |

**목표**

수동 API mock shape와 실제 OpenAPI 계약의 드리프트를 제거한다.

**작업 범위**

- Orval MSW 생성물을 활용한다.
- admin·learner 공통 fixture builder를 최소한으로 둔다.
- removed endpoint mock을 삭제한다.
- UI test가 generated DTO를 사용하게 한다.
- network/401/409/429/500 대표 오류 fixture를 제공한다.

**수용 기준**

- [ ] OpenAPI response 변경 시 UI fixture typecheck가 실패한다.
- [ ] hand-written endpoint response interface가 없다.
- [ ] fixture builder가 비즈니스 규칙을 재구현하지 않는다.

#### GG-1004 — Playwright PR smoke와 release 전체 suite 재구성

| 필드        | 값            |
| ----------- | ------------- |
| 유형        | Task          |
| 우선순위    | P0            |
| Story Point | 13            |
| 주 담당     | 개발          |
| 선행 티켓   | GG-402~GG-809 |

**목표**

모든 핵심 시나리오는 보유하되 PR마다 전체를 실행하지 않는다.

**작업 범위**

- PR smoke: learner login→lesson complete, draft recovery, admin login→course publish, user suspend, AI failure continuation.
- release suite: Google/credentials, 10 activity types, draft recovery, AI retry/quota, profile 수정·로그아웃, delete lifecycle, content image, dark mode, admin analytics.
- resource/chat/operator/maintenance E2E를 삭제한다.
- Chromium PR project와 iOS Safari 대응 WebKit release project를 둔다.
- console error/warning 관측은 allowlist 없이 유지한다.

**수용 기준**

- [ ] PR smoke가 안정적으로 10분 budget 안에 들어간다.
- [ ] release suite가 전체 핵심 범위를 커버한다.
- [ ] test data setup이 새 baseline과 owner-only 모델을 사용한다.
- [ ] flaky retry에 의존하지 않는다.

#### GG-1005 — Lighthouse·bundle budget·k6 gate 추가

| 필드        | 값                      |
| ----------- | ----------------------- |
| 유형        | Task                    |
| 우선순위    | P2                      |
| Story Point | 8                       |
| 주 담당     | 개발                    |
| 선행 티켓   | GG-807, GG-809, GG-1104 |

**목표**

측정된 회귀만 막고 선제적 성능 추상화를 추가하지 않는다.

**작업 범위**

- Lighthouse CI는 landing, learner home, lesson shell을 검사한다.
- size-limit은 web/admin initial client bundle에 현실적인 budget을 둔다.
- k6는 staging의 health, course list, lesson start/submit을 검사한다.
- AI provider 호출은 k6 기본 시나리오에서 fake 또는 제외한다.
- 실패 기준과 실행 시점을 문서화한다.

**수용 기준**

- [ ] PR에는 빠른 bundle check만, main/release에는 Lighthouse·k6를 실행한다.
- [ ] budget 초과는 원인 bundle을 출력한다.
- [ ] 성능 문제를 해결하기 위해 custom cache를 선제 추가하지 않는다.

#### GG-1006 — CI를 10분 PR gate와 release gate로 재편

| 필드        | 값                      |
| ----------- | ----------------------- |
| 유형        | Chore                   |
| 우선순위    | P0                      |
| Story Point | 13                      |
| 주 담당     | 개발                    |
| 선행 티켓   | GG-1001~GG-1005, GG-308 |

**목표**

각 PR에서 중복 install·중복 검사를 줄이고 빠른 피드백을 제공한다.

**작업 범위**

- format/lint/typecheck/architecture/Knip/unit/integration/PR E2E를 병렬화한다.
- OpenAPI·Orval generation을 cache한다.
- image build, vulnerability scan, Lighthouse, full E2E, k6는 main/release로 이동한다.
- syncpack/Bun catalog 일관성 검사를 정적 gate에 포함한다.
- custom workflow source 검사 중 표준 도구로 대체 가능한 것을 제거한다.

**수용 기준**

- [ ] 일반 PR wall-clock이 10분 이하다.
- [ ] 같은 suite가 여러 job에서 중복 실행되지 않는다.
- [ ] main 실패 시 image release가 시작되지 않는다.
- [ ] CI 문서와 실제 workflow가 일치한다.

### E11. 배포·운영

#### GG-1101 — Compose와 Caddy를 5-service topology로 단순화

| 필드        | 값                     |
| ----------- | ---------------------- |
| 유형        | Task                   |
| 우선순위    | P0                     |
| Story Point | 13                     |
| 주 담당     | 개발                   |
| 선행 티켓   | GG-101, GG-103, GG-201 |

**목표**

Ubuntu VPS에서 web, admin, api, caddy, litestream만 운영한다.

**작업 범위**

- Cloudflare Tunnel service와 token 설정을 제거한다.
- Caddy는 web host와 admin host를 구분한다.
- 각 host의 `/api/*`를 동일 api container로 reverse proxy한다.
- web host에서 `/api/admin/**`를 404로 차단한다.
- trusted client IP header는 Caddy가 덮어쓴 값만 신뢰한다.
- DNS A/AAAA를 VPS로 연결하고 Caddy automatic HTTPS를 사용한다. Cloudflare Tunnel과 proxy 의존성은 두지 않는다.

**수용 기준**

- [ ] Compose config에 상시 service가 5개만 있다.
- [ ] learner와 admin API는 각각 same-origin으로 동작한다.
- [ ] admin subdomain이 별도 cookie scope를 사용한다.
- [ ] Caddy config validation과 compose smoke가 통과한다.
- [ ] Caddy 설정에서 `auto_https off`가 제거되고 80/443 공개 TLS가 검증된다.

#### GG-1102 — production 환경 변수·secret 계약 재정의

| 필드        | 값                              |
| ----------- | ------------------------------- |
| 유형        | Task                            |
| 우선순위    | P0                              |
| Story Point | 8                               |
| 주 담당     | 개발                            |
| 선행 티켓   | GG-401, GG-603, GG-702, GG-1101 |

**목표**

삭제된 기능의 secret을 제거하고 실제 외부 의존성만 fail-closed하게 설정한다.

**작업 범위**

- Resend, Google OAuth, learner/admin auth, OpenAI, S3 assets, private deletion marker, Litestream env를 정의한다.
- Mastra, resource, cloudflared, operator 관련 env를 제거한다.
- AI user/global quota와 provider timeout을 env로 관리한다.
- public build arg와 runtime secret을 구분한다.
- local/test/staging/production example env를 갱신한다.

**수용 기준**

- [ ] production 필수 secret 누락 시 해당 service가 start 전에 실패한다.
- [ ] secret이 image layer, public Next env, log에 포함되지 않는다.
- [ ] Ansible template과 application env schema가 일치한다.

#### GG-1103 — Ansible bootstrap·deploy·verify·rollback·restore 축소

| 필드        | 값               |
| ----------- | ---------------- |
| 유형        | Task             |
| 우선순위    | P1               |
| Story Point | 13               |
| 주 담당     | 개발             |
| 선행 티켓   | GG-1101, GG-1102 |

**목표**

필요한 자동화는 유지하되 도구 동작을 다시 구현하는 정책 코드를 줄인다.

**작업 범위**

- playbook은 bootstrap, deploy, verify, rollback, restore 다섯 개를 유지한다.
- Cloudflared 관련 variable, file, condition을 제거한다.
- `docker compose config`, `caddy validate`, `ansible-lint`, syntax check를 직접 사용한다.
- stale lock을 자동 삭제하지 않는 안전 정책은 유지한다.
- 불필요한 TypeScript YAML/source 검사기를 제거한다.

**수용 기준**

- [ ] Ubuntu 24.04 disposable host에서 bootstrap 두 번째 실행 changed=0이다.
- [ ] deploy가 exact image digest를 사용한다.
- [ ] verify가 web/admin/api health와 핵심 route를 확인한다.
- [ ] playbook 문서가 실제 variable을 모두 설명한다.

#### GG-1104 — Litestream backup·restore와 staging 분리 완성

| 필드        | 값              |
| ----------- | --------------- |
| 유형        | Task            |
| 우선순위    | P0              |
| Story Point | 13              |
| 주 담당     | 개발            |
| 선행 티켓   | GG-904, GG-1103 |

**목표**

단일 SQLite 운영의 핵심 복구 능력을 실제 restore로 검증한다.

**작업 범위**

- Litestream sync, validation, checkpoint 설정을 RPO 1분 이내 목표로 검토한다.
- production과 staging의 DB, backup prefix, asset prefix, auth secret, OpenAI key를 분리한다.
- restore는 격리 경로 복원 → integrity/FK check → migration → deletion marker 재적용 순서로 수행한다.
- 복원 drill을 정기 운영 절차로 만든다.
- backup 최대 lifecycle은 30일로 설정한다.

**수용 기준**

- [ ] 빈 staging 환경에서 replica로 복원해 API를 시작할 수 있다.
- [ ] restore 후 deleted user가 부활하지 않는다.
- [ ] staging 작업이 production DB·bucket prefix를 참조하지 않는다.
- [ ] 복원 결과와 소요 시간을 기록한다.

#### GG-1105 — 이미지 릴리스·취약점 검사·rollback 경로 단순화

| 필드        | 값               |
| ----------- | ---------------- |
| 유형        | Task             |
| 우선순위    | P1               |
| Story Point | 13               |
| 주 담당     | 개발             |
| 선행 티켓   | GG-1006, GG-1103 |

**목표**

세 애플리케이션 image를 검증된 digest로 배포하고 실패 시 명시적으로 되돌린다.

**작업 범위**

- web/admin/api image build와 scan을 유지한다.
- 외부 GitHub Action SHA pinning을 유지한다.
- 복잡한 custom image metadata·retention 정책 중 실제 배포에 불필요한 계층을 제거한다.
- release manifest에는 세 service digest와 source revision만 필수로 둔다.
- rollback은 이전 검증 digest와 동일 DB schema compatibility를 확인한다.

**수용 기준**

- [ ] main quality gate 성공 후에만 image release가 실행된다.
- [ ] high/critical vulnerability 정책과 예외 만료가 작동한다.
- [ ] staging smoke 실패 시 production deploy가 진행되지 않는다.
- [ ] rollback playbook이 이전 digest로 정상 복구한다.

#### GG-1106 — 출시 runbook·readiness·graceful shutdown 최종 검증

| 필드        | 값              |
| ----------- | --------------- |
| 유형        | Task            |
| 우선순위    | P0              |
| Story Point | 8               |
| 주 담당     | 기획·개발       |
| 선행 티켓   | 모든 P0/P1 티켓 |

**목표**

첫 production 배포를 반복 가능한 절차로 고정한다.

**작업 범위**

- DNS, admin subdomain, TLS, secret, owner seed, migration, seed, backup, monitoring checklist를 작성한다.
- API readiness는 DB query를 포함하고 liveness와 분리한다.
- SIGTERM 중 in-flight request drain과 DB close를 검증한다.
- 과도한 process observation test는 제거하고 실제 process smoke 하나를 유지한다.
- incident, restore, rollback, 개인정보 삭제 절차를 연결한다.

**수용 기준**

- [ ] 새 Ubuntu 24.04 VPS에서 문서만으로 staging을 배포할 수 있다.
- [ ] production launch gate에 법률 검토, restore drill, full E2E가 포함된다.
- [ ] 각 service health와 실제 핵심 사용자 flow가 배포 후 통과한다.
- [ ] 비상 rollback 책임과 명령이 명시된다.

## 11. 릴리스 게이트

통합 브랜치는 아래 조건을 모두 만족할 때만 main에 merge한다.

### 제품

- [ ] 공개 랜딩이 한국어 글쓰기 학습만 설명한다.
- [ ] Google과 이메일 가입·확인·로그인·reset이 동작한다.
- [ ] 학습자 홈, 코스, 레슨, 프로필, 다크 모드가 동작한다.
- [ ] 10개 활동 유형을 모바일에서 완료할 수 있다.
- [ ] 서버 draft가 refresh·재로그인·다른 기기에서 복구된다.
- [ ] AI 실패가 학습 진행을 막지 않는다.
- [ ] 관리자 코스 생성·편집·이미지·발행이 동작한다.
- [ ] 관리자 사용자 정지·활성화·삭제 lifecycle이 동작한다.
- [ ] dashboard에서 첫 레슨 시작과 7일 내 재방문을 확인할 수 있다.

### 삭제 확인

- [ ] `@workspace/resource-library`가 없다.
- [ ] `@workspace/resource-document`와 Lexical 자료 편집기 코드가 없다.
- [ ] `/resources`, `/chat`, `/maintenance` 관리자 route가 없다.
- [ ] Mastra dependency가 없다.
- [ ] admin AI chat DB table과 operation이 없다.
- [ ] resource DB table과 operation이 없다.
- [ ] operator role이 없다.
- [ ] localStorage lesson draft가 없다.
- [ ] AI score 필드가 없다.
- [ ] legacy error/draft/schema-era compatibility 코드가 없다.

### 아키텍처

- [ ] 비즈니스 모듈이 다섯 개다.
- [ ] 모든 모듈이 4계층 경계를 지킨다.
- [ ] direct Hono OpenAPI route 등록을 사용한다.
- [ ] route 연결부에 `as never`가 없다.
- [ ] canonical API 오류 schema가 하나다.
- [ ] admin·learner OpenAPI와 Orval client가 생성된다.
- [ ] 앱에 hand-written endpoint URL과 feature DAL이 없다.
- [ ] operations reporting 외 cross-module table 접근이 없다.
- [ ] cross-module FK와 read-only reporting exception이 문서화됐다.

### 데이터·보안

- [ ] 새 `0000` baseline이 빈 DB에서 적용된다.
- [ ] integrity check와 FK check가 통과한다.
- [ ] published revision과 asset이 immutable하다.
- [ ] 삭제 요청 즉시 session이 폐기된다.
- [ ] 5일 purge와 backup restore 삭제 재적용이 검증됐다.
- [ ] Resend, OpenAI, S3 secret이 로그·client bundle·image에 없다.
- [ ] 답안·AI 원문·이메일이 일반 로그와 audit payload에 없다.
- [ ] 법률 검토 gate가 완료됐다.

### 품질·운영

- [ ] PR CI가 10분 이하다.
- [ ] full release E2E가 통과한다.
- [ ] Chromium과 iOS Safari 지원 matrix가 통과한다.
- [ ] Lighthouse와 bundle budget이 통과한다.
- [ ] staging k6 baseline이 통과한다.
- [ ] Ubuntu 24.04 bootstrap·deploy·verify·rollback이 검증됐다.
- [ ] Litestream restore drill이 통과했다.

## 12. 위험 관리

| 위험                        | 대응                                                               |
| --------------------------- | ------------------------------------------------------------------ |
| 통합 브랜치 장기화          | 티켓별 원자 커밋, 매일 main rebase, 중간 compatibility layer 금지  |
| generated client build 실패 | OpenAPI·Orval generation을 독립 Turbo task와 CI cache로 관리       |
| server draft 데이터 충돌    | version 기반 optimistic concurrency와 recoverable UI               |
| AI 비용 폭주                | per-step, per-user, global quota와 idempotency                     |
| 이미지 처리 취약점          | MIME가 아닌 실제 decode, 재인코딩, EXIF 제거, size limit           |
| SQLite 사용자 purge 실패    | user-owned FK cascade와 실제 SQLite integration test               |
| backup에서 탈퇴 계정 부활   | private deletion marker와 restore replay                           |
| 관리자 분석 query 비대화    | read-only SQL repository, pagination, query plan 확인              |
| 테스트 suite 재팽창         | test 추가 기준과 도구별 책임을 docs·review gate로 강제             |
| 배포 자동화 과설계          | 표준 CLI 직접 실행, 5개 Compose service, 5개 Ansible playbook 유지 |

## 13. 이슈 트래커 운영 규칙

권장 label:

```text
type:story
type:task
type:chore
type:design
type:compliance

area:product
area:admin
area:web
area:api
area:database
area:auth
area:learning
area:ai
area:content
area:analytics
area:privacy
area:testing
area:deployment

priority:P0
priority:P1
priority:P2

status:blocked
status:ready
status:in-progress
status:review
status:done
```

각 이슈 본문에는 본 문서의 티켓 내용을 복사하고, 구현 중 새 요구가 발견되면 현재 티켓의 범위를 조용히 넓히지 않는다. 별도 이슈로 만들고 제품 범위 문서의 변경 여부를 먼저 판단한다.
