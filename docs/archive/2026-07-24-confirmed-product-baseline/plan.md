# 확정 제품 기준선 전환

## 목표

`codebase-improvement-backlog.md`의 확정 범위를 현재 저장소의 단일 기준선으로 구현한다. 폐기 기능을 완전히 제거하고, 다섯 비즈니스 모듈·서버 초안·점수 없는 AI 피드백·owner 전용 관리자·생성 HTTP 클라이언트·보존 및 복구 경계를 릴리스 가능한 상태로 맞춘다.

## 실행 흐름

1. 제품·아키텍처 결정과 폐기 범위를 문서와 코드에서 함께 고정한다.
2. 제거 작업 뒤 새 DB 기준선과 HTTP 계약을 확정한다.
3. 인증, 학습 초안, AI 피드백, 콘텐츠 이미지와 분석 화면을 독립 트랙으로 구현한다.
4. 개인정보 보존, 테스트·CI와 배포 자동화를 통합한다.
5. 전체 정적 검사, 테스트, 빌드와 로컬 smoke를 실행하고 결과를 보관한다.

## 병렬 통합 흐름

| 통합 관문      | 병렬 트랙                                                          | 합류 조건                                                                |
| -------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| A. 범위 삭제   | 자료실·자료 문서, 관리자 AI, 콘텐츠 초기화, 랜딩                   | source·package·route·문서 잔존물이 없다.                                 |
| B. 데이터 모델 | identity, learning draft, AI quota, content asset, audit·retention | 모듈 schema test가 통과하고 중앙 SQL은 아직 한 번만 재생성한다.          |
| C. HTTP 경계   | canonical error, 직접 Hono 등록, OpenAPI, Orval                    | admin·learner 문서와 생성 client diff가 재현 가능하다.                   |
| D. 제품 기능   | 이메일 인증, autosave, AI 상태, 이미지, 분석, 테마·반응형          | 각 트랙의 SQLite·Hono·UI 통합 test가 통과한다.                           |
| E. 출시 통합   | purge·restore marker, CI, Compose·Ansible·Litestream               | 전체 gate와 로컬 smoke가 통과하고 외부 검증 항목은 증거 유무를 구분한다. |

동일 파일 충돌을 줄이기 위해 module schema는 각 트랙이 소유하고, `apps/api/src/db/schema.ts`, 최종 `0000` SQL, lockfile, 중앙 composition과 생성 산출물은 관문별로 한 번만 통합한다. 각 트랙은 선행 관문의 공개 계약만 소비하며 임시 compatibility layer를 만들지 않는다.

## 검증 경계

저장소 안에서 재현할 수 있는 검증은 이 작업에서 완료한다. 외부 법률 검토, 실제 DNS·TLS, 실제 Ubuntu 호스트 배포, staging 부하 시험과 backup restore drill은 실행 환경과 승인 증거가 있어야 완료로 판정하며 문서나 mock 결과로 대체하지 않는다.

## 기준 지표

기준 commit은 `f2096e72`다. 루트 workspace glob에 포함된 package는 25개, production TS·TSX 파일은 648개, test·spec 파일은 220개다. 등록 route source의 literal OpenAPI operation은 46개다. 파일 수는 품질 목표가 아니라 삭제 잔존물과 범위 변화를 추적하는 참고값이다.

측정 명령은 package manifest 1단계 탐색, `rg --files`의 production/test glob과 production source의 `operationId` literal 검색을 사용했다. 최종 검증에서는 같은 분류로 다시 측정한다.

## 통합 릴리스 게이트

- 제품 범위와 삭제 잔존물 검사를 통과한다.
- format, lint, typecheck, architecture, dead-code, unit·integration test와 build가 통과한다.
- OpenAPI와 생성 클라이언트가 같은 계약에서 재생성된다.
- Chromium PR smoke와 지원 브라우저 release suite가 통과한다.
- 개인정보 삭제·보존, backup restore와 배포 승인 증거가 준비되고 [외부 법률 검토 gate](./privacy-legal-review-gate.md)가 해제된다.

## 로컬 성능 검증

2026-07-24T13:45Z에 기준 commit `f2096e727fad2b4ef0aefac2f989e9bca8bd319a` 위 현재 작업 트리의 production standalone을 Windows 10·Headless Chrome 149에서 `bun run test:performance:lighthouse`로 측정했다. 한국어 시스템 글꼴 전환 전후 `/app`을 격리 비교하기 위해 Lighthouse collect 대상을 이 route 하나로 제한해 세 번 실행했고, 설정은 측정 직후 권위 source의 세 route로 복구했다.

| 실행 | LCP(ms) | Performance |
| ---- | ------: | ----------: |
| 1    | 3084.27 |        0.92 |
| 2    | 3220.31 |        0.93 |
| 3    | 3244.70 |        0.92 |

세 실행은 모두 `/app` LCP 4,000ms gate를 통과했다. 원본 JSON·HTML과 manifest는 로컬 `output/lighthouse/`에 있다. 이는 `/app` 회귀 수정의 실행 증거이며, 복구된 landing·learner home·lesson 세 route 전체의 main CI 성공이나 외부 staging 성능 증거를 대신하지 않는다.
