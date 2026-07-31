# 어드민 콘솔 개선 후속 과제 계획

## 기준선

- 선행 작업: [어드민 콘솔 개선](../../archive/2026-07-31-admin-console-improvement/plan.md)의 P0~P5 완료 기록
- 수립 시각: 2026-07-31 KST
- 대상: 선행 작업이 후속으로 남긴 5건
- 상태: 5건 완료

## 권위 경계

이 문서는 작업 범위와 판단만 기록한다. 현재 구현 사실의 권위 소스가 아니다. 확정된 결론은 아래 권위 문서에 반영했다.

- `docs/product/requirements/admin/req-adm-3-content-operations.md`
- `docs/product/requirements/admin/req-adm-4-user-operations.md`
- `docs/product/requirements/admin/req-adm-7-audit-review.md`
- `docs/product/user-stories/admin/us-adm-4-operate-users.md`
- `docs/product/content-model.md`
- `docs/product/metrics.md`
- `docs/design/screens/SCR-104-admin-course-detail.md`
- `docs/design/screens/SCR-106-admin-user-detail.md`
- `docs/design/screens/SCR-108-admin-audit.md`
- `docs/engineering/api-contract.md`
- `docs/engineering/schema-conventions.md`

## 작업 결과

계약과 데이터에 주는 영향이 작은 것부터 진행했다.

| 순서 | 항목                         | 계약 변경 | 결과 |
| ---- | ---------------------------- | --------- | ---- |
| F1   | 사용자 상세 운영 액션        | 없음      | 완료 |
| F2   | 감사 이력 필터와 페이지 이동 | 있음      | 완료 |
| F3   | asset 현황 가시성            | 있음      | 완료 |
| F4   | 대시보드 응답 필드 정리      | 있음      | 완료 |
| F5   | 코스 카테고리 쓰기 검증      | 있음      | 완료 |

## F1. 사용자 상세 운영 액션

판단 지점(상세)과 실행 지점(목록)이 분리돼 있어, 상세에서 정지를 판단한 뒤 목록으로 돌아가 해당 행을 다시 찾아야 했다.

목록의 인라인 확인 흐름을 공통 컴포넌트로 추출해 목록과 상세가 같은 흐름을 쓰게 했다. 결과 메시지 배치만 화면이 정한다.

추출은 동작을 보존해야 하므로 버튼의 접근 가능한 이름을 바꾸지 않았다. 처음에 행 구분을 위해 이메일을 `aria-label`에 넣었더니 기존 테스트가 깨졌고, 이는 이 작업의 범위가 아니라고 판단해 되돌렸다. 목록에서 같은 이름의 버튼이 행마다 반복되는 문제는 남아 있다.

## F2. 감사 이력 필터와 페이지 이동

계약이 `limit`만 지원해 최근 50건만 볼 수 있었다. 기간과 작업 종류 필터, 페이지 이동을 추가하고 `limit`은 제거했다. 같은 목적의 조회 수단을 두 개 두지 않는다.

기간은 플랫폼 날짜 경계를 따르는 논리 날짜이며 종료일을 포함한다. 구현은 종료일 다음 날 시작을 제외 상한으로 쓴다. 시작일이 종료일보다 늦은 요청은 빈 결과가 아니라 잘못된 질의로 거절한다. 조용히 비면 관리자가 조건이 잘못됐음을 알 수 없다.

원문 비노출 경계는 그대로 유지했다.

### 함께 고친 결함

작업 중 코스 보관 해제가 프로덕션에서 항상 실패하는 것을 확인했다. baseline 마이그레이션의 `audit_events` check 제약 3개가 `course.restore`를 빠뜨려 감사 기록 insert가 거절되고, 감사 미들웨어가 그 실패를 503으로 올렸다. 선행 작업에서 도메인 값 집합만 넓히고 DB 제약을 함께 넓히지 않은 누락이다.

SQLite는 check 제약을 변경할 수 없어 표를 다시 만들고 기존 기록을 옮기는 마이그레이션을 추가했다. 같은 실패 유형을 막기 위해 `schema-conventions.md` 체크리스트에 항목을 넣었다.

## F3. asset 현황 가시성

업로드한 asset의 목록과 상태를 owner가 볼 수 없었다.

편집 문서 응답은 참조 가능한 active asset만 담고 그 배열이 저장 payload의 근거이므로, 정리 대기 asset을 그 배열에 섞지 않았다. 대신 상태를 포함한 읽기 전용 조회 경로를 따로 두고 코스 편집 화면이 병렬로 읽는다.

새 삭제 경로는 만들지 않았다. 물리 삭제는 기존 일일 정리 작업이 소유한다.

## F4. 대시보드 응답 필드 정리

`totalUsers`와 `firstLessonStarts`는 활성화율의 분모·분자와 값이 같고 화면이 쓰지 않아 계약에서 제거했다.

`completedLessons`는 남겼다. 값이 중복되지 않으므로 제거는 지표 자체를 버리는 판단이고, 그것은 제품 결정이다. `metrics.md`가 이 둘을 현재 표시 지표로 적고 있었는데 화면과 어긋난 기술이었으므로 사실에 맞게 정리하고, 누적 완료 레슨은 응답에 있으나 표시하지 않는다는 것과 그 이유를 남겼다.

## F5. 코스 카테고리 쓰기 검증

선행 작업에서 값 집합을 계약으로 만들고 어드민 UI를 Select로 바꿨지만 서버는 임의 문자열을 받았다. 어드민 화면이 유일한 방어선이었다.

쓰기 경로만 값 집합으로 좁혔다. 읽기 경로를 좁히면 값 집합에 없는 기존 row 하나가 조회 응답 전체를 실패시킨다. 이 서비스는 시드 재구축 이력이 있어 과거 값이 남아 있을 수 있고, 편집 문서 조회도 같은 스키마로 직렬화되므로 해당 코스는 편집조차 열 수 없게 된다.

거절 메시지는 관리자가 무엇을 해야 하는지 아는 한국어다. 관리자 앱도 저장 직전 draft를 같은 쓰기 규칙으로 검증해, 값 집합에 없는 기존 코스는 편집 화면에서 카테고리를 다시 고르면 저장된다.

## 하지 않은 것

- asset 물리 삭제 UI. 일일 정리 작업의 소유를 유지한다.
- 감사 이력 내보내기와 외부 전송, 대상·결과 필터.
- 읽기 경로의 카테고리 enum 강화.
- `completedLessons` 계약 제거와 대시보드 재노출.
- 사용자 목록 행 버튼의 접근 가능한 이름 구분.

## 남은 결정

- 누적 완료 레슨을 어떤 판단에 쓸 지표로 볼지, 그에 따라 대시보드에 다시 올릴지 아니면 계약에서 뺄지.

## 검증

`AGENTS.md`의 Definition of Done을 따랐다.

- `bun run build` 6/6 성공
- `bun run typecheck` 25/25 성공
- `bun run test` 194파일 1189통과 1skip
- `bun lefthook run pre-commit` 성공
- `bun run check:architecture` 위반 0
- `bun run check:knip` 성공
- `bun run check:route-bundles` 예산 이내
- `bun run generate`로 OpenAPI 문서와 client 재생성

계약을 바꾼 F2·F3·F4·F5는 계약 테스트를 함께 갱신했다. F2의 마이그레이션은 직전 계보 상태에서 기존 기록 보존과 새 값 저장을 함께 확인했다. F5는 쓰기 거절과 읽기 성공을 같은 테스트 파일에서 고정했다.
