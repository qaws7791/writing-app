---
title: 2026-04-20 코드 리뷰 후속 조치
description: code-review (1).md 기준 후속 조치 현황과 실제 코드 기준 판정 결과를 기록한다.
---

# 2026-04-20 코드 리뷰 후속 조치

## 상태

- 시작 시각: 2026-04-20
- 기준 문서: `code-review (1).md`
- 진행 방식: 실제 코드 기준으로 항목을 재검증하고, 수정이 필요한 항목만 순서대로 해결한다.
- 커밋 정책: 문제 1개당 커밋 1개

## 판정 기준

- `대기`: 아직 코드 재검증 전
- `진행 중`: 수정 작업 중
- `완료`: 코드와 검증이 반영됨
- `기해결`: 현재 코드 기준 이미 해소됨
- `보류`: 이번 변경에서 구조적으로 닫기 어려워 별도 작업이 필요함

## 항목 목록

| 번호 | 항목                                          | 상태   | 비고                                                |
| ---- | --------------------------------------------- | ------ | --------------------------------------------------- |
| 1    | Session AI Worker 중복 처리 방지 및 폴링 개선 | 완료   | 저장소 선점(claim) + 비중첩 스케줄링 적용           |
| 2    | 프론트엔드 `apiClient` 직접 임포트 제거       | 완료   | `useApiClient()` 컨텍스트 주입으로 전환             |
| 3    | Admin 세션 스택 통합                          | 완료   | DB 재검증으로 오래된 JWT 세션 무효화                |
| 4    | 테스트 커버리지 임계값 강제                   | 완료   | 루트 coverage 실행 복구 + 프로젝트별 threshold 추가 |
| 5    | 완료/내 여정 목록의 묵음 삭제                 | 기해결 | 현재 구현은 `listUserJourneyItems` 직접 사용        |
| 6    | 스텝 콘텐츠 타입 중복 제거                    | 완료   | 코어 Zod 스키마를 스텝 콘텐츠 타입 원천으로 승격    |
| 7    | 배열 인덱스 key 제거                          | 완료   | 콘텐츠 기반 key와 lint 경고 추가                    |
| 8    | 인라인 타입 단언 축소                         | 완료   | `getStepState()`와 guard 기반 상태 접근으로 전환    |
| 9    | `handleSaveAndLeave` 묵음 에러 처리           | 대기   | `writing-editor-view.tsx`                           |
| 10   | Admin API 공통 에러 핸들러                    | 대기   | `apps/admin/src/app/api/**`                         |
| 11   | Writing Step 제한 시간 표시 정합성            | 대기   | `writing-step.tsx`                                  |
| 12   | `SettingRow` 버튼 `type` 명시                 | 대기   | `setting-row.tsx`                                   |
| 13   | Next.js `Image` 미사용 이미지 교체            | 대기   | `journey-card.tsx`, `journey-hero.tsx`              |
| 14   | API 타입 생성 자동화                          | 대기   | `turbo.json`, `packages/api-client`                 |
| 15   | Lefthook 패키지별 lint 중복 제거              | 대기   | `lefthook.yml`                                      |
| 16   | Admin 환경 변수 검증 시점                     | 기해결 | `apps/admin/src/env.ts`는 이미 `createEnv` 사용     |
| 17   | `define-route.ts` 책임 분리                   | 대기   | `apps/api/src/lib/hono`                             |
| 18   | `writing-editor-view.tsx` 거대 컴포넌트 분리  | 대기   | 상태 훅/서브컴포넌트 추출                           |
| 19   | Health check 심화                             | 대기   | `/health` 응답 확장 필요                            |
| 20   | Session AI Worker 메트릭/로그 보강            | 대기   | 처리 시간, 결과 로그 필요                           |

## 메모

- 리뷰 문서와 현재 브랜치 사이에 차이가 있어, 수정 전 재검증을 우선한다.
- `기해결` 항목은 최종 정리 시 근거 파일과 함께 다시 확인한다.
