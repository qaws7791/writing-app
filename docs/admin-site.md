# 어드민 사이트

## 2026-05-31 코스 썸네일 업로드 제거 시작

- BSSN 단순화 1순위로 어드민 코스 썸네일 업로드 기능을 제거한다.
- 어드민 API의 signed upload route, S3/RustFS 저장소 helper, `ADMIN_ASSET_*` 환경 변수, 어드민 웹의 파일 업로드 UI를 제거한다.
- 코스 목록과 상세 화면은 썸네일 이미지 대신 제목 기반 식별 UI를 사용한다.

## 2026-05-31 코스 썸네일 업로드 제거 완료

- 어드민 API에서 `POST /course-thumbnails/uploads`와 스토리지 의존성을 제거했다.
- 어드민 웹 코스 편집기에서 썸네일 파일 선택, 업로드, 저장 필드를 제거했다.
- 코스 목록은 이미지 로딩 없이 제목 첫 글자 블록으로 코스를 구분한다.

## 2026-05-30 코스 편집기 우측 영역 UI 개선 검증 시작

- 직전 커밋의 코스 편집기 우측 레슨/스텝 작업대 UI 개선 범위를 검증한다.
- 레슨 설정 화면 제거, 스텝 타입 선택 드롭다운, 스텝 드래그 핸들, 보관 스텝 기본 숨김, 뒤로가기, 읽기 전용 안내, 저장 토스트 동작을 코드와 테스트 기준으로 확인한다.
- 검증 중 발견된 테스트 fixture와 URL 상태 잔여 코드는 현재 UI 정책에 맞게 최소 수정한다.

## 2026-05-30 코스 편집기 우측 영역 UI 개선 검증 완료

- `settings` 편집 view를 URL 상태 타입과 로컬 전환 로직에서 제거해 레슨 설정 화면이 다시 노출되지 않도록 했다.
- 레슨 작업대 테스트를 스텝 타입 선택 드롭다운, 레슨 설정 버튼 제거, 보관 스텝 기본 숨김, 드래그 핸들 기준으로 갱신했다.
- 어드민 통합 테스트의 제거된 레슨 설정 화면 기대값을 삭제하고, `view=settings` 쿼리는 레슨 화면으로 되돌리는 순수 상태 테스트로 고정했다.
- 검증은 어드민 관련 테스트, 타입체크, 린트, 빌드, pre-commit으로 확인했다.

## 2026-05-30 어드민 커리큘럼 맵 UI 테스트 보강 시작

- 노션 스타일 커리큘럼 맵 UI 변경에 맞춰 `curriculum-map.test.tsx`를 새 상호작용 기준으로 갱신한다.
- 챕터 편집 Popover, 챕터 접기/펼치기, 레슨 DropdownMenu 보관, 빈 상태, 읽기 전용 상태를 테스트로 고정한다.
- 검증 범위는 어드민 앱 타깃 테스트와 가능한 범위의 lint/typecheck/pre-commit 확인으로 제한한다.

## 2026-05-30 어드민 커리큘럼 맵 UI 테스트 보강 완료

- 커리큘럼 맵 테스트를 새 챕터 편집 Popover, 레슨 케밥 메뉴, 읽기 전용 제어 숨김, 챕터/레슨 빈 상태 기준으로 갱신했다.
- 코스 상세 통합 테스트도 레슨 보관을 케밥 메뉴 경유 흐름으로 수정했다.
- 어드민 테스트에서 base-ui overlay primitive를 안정적으로 다루기 위한 테스트 전용 mock helper를 추가했다.
- 검증은 `bun --filter @workspace/admin test`, `bun --filter @workspace/admin typecheck`, `bun --filter @workspace/admin lint`, `bun lefthook run pre-commit`로 확인했다.

## 2026-05-30 로컬 썸네일 변경 검증 시작

- 로컬 개발 환경에서 Docker Compose 기반 RustFS와 어드민 앱, 어드민 API를 함께 실행해 코스 썸네일 변경 흐름을 실제 브라우저로 검증한다.
- `apps/admin/.env`, `apps/admin-api/.env`, 루트 `.env.docker`가 같은 로컬 포트와 RustFS credential을 사용하도록 맞춘다.
- 검증 범위는 관리자 로그인, 코스 상세 진입, 썸네일 파일 업로드, 저장, RustFS 공개 URL 반영 확인이다.

## 2026-05-30 로컬 썸네일 변경 검증 완료

- 루트 Docker Compose로 RustFS를 실행하고 `writing-app-public-assets` 공개 버킷 생성을 확인했다.
- `apps/admin-api/.env`에 로컬 RustFS asset 환경 변수를 추가하고, `apps/admin/.env`에 어드민 API URL을 명시했다.
- 기존 로컬 관리자 계정 비밀번호가 시드 값과 달라 `ADMIN_SEED_RESET_PASSWORD=true`로 개발 DB의 관리자 비밀번호를 한 번 동기화했다.
- 브라우저에서 관리자 로그인, 코스 상세 진입, 썸네일 파일 업로드, 저장을 실제로 실행했다.
- 저장된 썸네일은 RustFS 공개 URL로 반영됐고, 공개 URL이 `200 image/png`으로 응답하는 것을 확인했다.
- 검증은 `bun --filter @workspace/admin typecheck`, `bun --filter @workspace/admin-api typecheck`, `bun --filter @workspace/admin test -- course-summary-panel admin-course-detail-page`로 확인했다.

## 2026-05-29 어드민 코스 에디터 정정 설계 시작

- 감사 결과를 바탕으로 코스 상세 에디터의 UI, 상태 모델, API 계약, DB 저장 정책을 함께 정정한다.
- 기존 구조를 부분 보정하는 대신 draft editor document를 중심으로 챕터, 레슨, 스텝 편집 경계를 다시 정리한다.
- 설계 문서는 `docs/superpowers/specs/2026-05-29-admin-course-editor-correction-design.md`에 작성한다.

## 2026-05-29 어드민 코스 상세 UI 감사 완료

- 코스 상세 에디터 화면을 실제 브라우저와 코드 기준으로 점검했다.
- 사용자 식별 문제 외에 반응형 레이아웃, 미동작 버튼, 위험 작업 확인 부재, published 버전 편집 가능 표시, 스텝 content schema 불일치 문제를 추가로 확인했다.
- 상세 조사 결과는 `docs/admin-course-detail-ui-audit.md`에 정리했다.

## 2026-05-28 어드민 코스 상세 에디터 동작 보정 완료

- 커리큘럼 레슨 row의 선택 버튼과 drag handle을 분리해 레슨 클릭이 드래그 센서에 막히지 않도록 했다.
- 레슨 순서 변경이 실제 working copy에 반영되도록 `moveLesson` 상태 helper와 Course Studio 연결을 추가했다.
- drag 동작이 불안정한 환경에서도 순서 변경이 가능하도록 레슨별 위/아래 이동 버튼을 추가했다.
- 편집 가능한 draft가 없는 코스 상세에 진입하면 자동으로 draft를 생성하고 해당 버전으로 전환하도록 했다.
- 브라우저에서 draft 자동 생성, 저장 버튼 활성화, 레슨 클릭, 순서 변경, 저장 성공을 재검증했다.

## 2026-05-28 어드민 코스 상세 에디터 전체 기능 구현 완료

- 커리큘럼 버전 상세 응답과 저장 응답이 스텝 `content`를 포함하도록 보정해 전체 snapshot 저장 시 content 손실을 막았다.
- 코스 상세 페이지에 working copy 편집 상태를 연결해 코스, 레슨, 스텝 content 수정이 dirty 상태와 저장 payload에 반영되도록 했다.
- 레슨, 스텝, 미리보기 전환은 로컬 URL 상태와 브라우저 history로 처리해 저장 전 편집값이 화면 전환 중 초기화되지 않도록 했다.
- draft 생성, published 버전 복원, draft 발행, draft 폐기 액션을 버전 메뉴에서 실행하도록 연결했고, published 버전에서는 저장 버튼을 비활성화했다.
- 관련 core, db, admin-api, admin 테스트와 브라우저 스모크로 draft 생성부터 편집 저장까지 검증했다.

## 2026-05-28 어드민 코스 상세 에디터 전체 기능 구현 시작

- 이전 구현에서 누락된 working copy 편집, URL 상태 전환, 저장, 버전 작업, draft 생성, 발행, 폐기 흐름을 실제 동작하도록 보강한다.
- 브라우저 재현 결과 확인된 `DATABASE_URL` 상대 경로 혼동과 API 오류의 로그인 리다이렉트 문제도 함께 검증한다.
- 기존 설계 문서 `docs/superpowers/specs/2026-05-28-admin-course-detail-editor-design.md`의 포함 범위를 기준으로 작은 테스트 단위로 구현한다.

## 2026-05-28 어드민 코스 상세 에디터 구현 완료

- 어드민 코스 상세 페이지를 Course Studio 구조로 구현했다.
- draft 기반 커리큘럼 조회, 복원, 저장, 발행, 폐기 API와 admin 클라이언트 연결을 추가했다.
- 코스 기본 정보, Curriculum Map, Lesson Workspace, Step Workspace, Lesson Preview를 추가했다.
- 스텝 20개 타입은 전용 편집 폼으로 표시한다.
- 변경사항은 working copy에 쌓고 상단 저장으로 전체 snapshot을 반영한다.

## 2026-05-28 어드민 코스 상세 에디터 구현 시작

- 설계 문서 `docs/superpowers/specs/2026-05-28-admin-course-detail-editor-design.md`를 기준으로 구현을 시작한다.
- 구현은 DB 스키마, core/admin 계약, admin-api route, admin UI 순서로 진행한다.
- 코스 상세 편집은 draft 커리큘럼 버전에만 적용하고, 상단 저장에서 전체 snapshot을 반영한다.

## 2026-05-28 어드민 코스 상세 에디터 구현 계획 보강

- draft 스텝 content가 기존 published 레슨에 섞이지 않도록 `curriculum_version_steps` snapshot을 추가하는 방향으로 보강한다.
- draft 저장 API는 원본 `lesson_steps`를 직접 수정하지 않고, 대상 draft 버전의 스텝 snapshot만 갱신한다.
- 공개/학습자 레슨 읽기 경로도 published 또는 학습자 진행 버전의 스텝 snapshot을 읽도록 후속 구현 범위에 포함한다.

## 2026-05-28 어드민 코스 상세 에디터 API 추가 완료

- Admin API에 코스 상세, 코스별 커리큘럼 버전 상세, 버전별 레슨 상세 조회 route를 추가했다.
- draft 생성, 복원, content 저장, 발행, 폐기는 `courses/:courseId/curriculum` 하위 action route로 제공한다.
- 저장 요청은 route param과 body의 course/version 식별자가 일치해야 하며, revision 충돌은 HTTP 409로 매핑한다.

## 2026-05-28 어드민 코스 상세 에디터 클라이언트 추가 완료

- Admin 앱 HTTP client에 코스 상세, 커리큘럼 버전, 레슨 상세 조회 메서드를 추가했다.
- draft 생성, 복원, 저장, 발행, 폐기 요청은 Admin API의 action route와 동일한 URL/method/body 계약을 사용한다.
- Admin API 오류 판별에 `not-found`와 `conflict`를 포함해 editor 저장 충돌을 클라이언트에서 명시적으로 처리할 수 있게 했다.

## 2026-05-28 어드민 코스 상세 에디터 상태 로직 추가 완료

- URL query의 `version`, `view`, `lessonId`, `stepId`를 editor 내부 화면 상태로 해석하는 순수 함수를 추가했다.
- 변경 유형은 additive, structural, major revision으로 분류해 저장/버전 UI가 변경 성격을 표시할 수 있게 했다.
- working copy UI에서 사용할 dirty 상태와 불변 순서 이동 helper를 추가했다.

## 2026-05-28 어드민 코스 스튜디오 셸 구현 완료

- 코스 상세 route가 search params를 editor URL 상태로 파싱하고, 코스/버전 데이터를 Admin API에서 조회하도록 연결했다.
- 상세 페이지 placeholder를 제거하고 `Course Studio` 헤더, 버전/저장 action, 2컬럼 editor shell을 렌더링하도록 바꿨다.
- 왼쪽 정보 영역에는 썸네일, 제목, 설명, 챕터/레슨/스텝 수를 표시하는 코스 요약 패널을 추가했다.

## 2026-05-28 코스 커리큘럼 작업대 구현 완료

- 왼쪽 커리큘럼 맵을 챕터/레슨 트리로 분리하고 `dnd-kit` 기반 sortable lesson row를 추가했다.
- 오른쪽 레슨 작업대는 레슨 제목, 학습 의도, 변경 유형, learning sequence, 미리보기/설정/스텝 추가 버튼을 표시한다.
- Course Studio shell은 선택 레슨 기준으로 커리큘럼 맵과 레슨 작업대에 데이터를 나누어 전달한다.

## 2026-05-28 스텝 타입 전용 폼 구현 완료

- `StepWorkspace`가 20개 스텝 타입을 전용 폼 컴포넌트로 라우팅하도록 레지스트리를 추가했다.
- 각 스텝 폼은 타입별 도메인 필드 라벨을 제공하고 공통 필드 helper로 content 값을 안전하게 읽는다.
- INTRO부터 COMPLETE까지 모든 스텝 타입이 전용 편집 섹션을 렌더링하는지 테스트로 고정했다.

## 2026-05-28 코스 에디터 미리보기 연결 완료

- Lesson Preview는 서버 호출 없이 working copy 스텝 목록을 기준으로 학습 흐름을 표시한다.
- Course Studio shell은 URL view가 `preview`이면 미리보기를, `step`이면 Step Workspace를, 기본값이면 Lesson Workspace를 렌더링한다.
- 상단 에디터 헤더는 dirty count와 saving 상태를 받아 저장 버튼 활성화를 제어하도록 바꿨다.

## 2026-05-28 어드민 코스 상세 에디터 구현 계획 시작

- 설계 문서 `docs/superpowers/specs/2026-05-28-admin-course-detail-editor-design.md` 승인 후 구현 계획을 작성한다.
- 계획은 DB 스키마, core/admin 계약, admin-api route, admin UI, 검증 순서로 분리한다.
- 구현 계획 문서는 `docs/superpowers/plans/2026-05-28-admin-course-detail-editor.md`에 작성한다.

## 2026-05-28 어드민 코스 상세 에디터 구현 계획 완료

- 구현 계획은 14개 작업으로 나누고 각 작업은 테스트, 구현, 검증, 커밋 단계를 포함한다.
- `curriculum_versions.revision`과 `lesson_steps.status`를 추가해 충돌 감지와 스텝 아카이브를 지원하는 방향으로 정리했다.
- UI 구현은 Course Studio shell, Curriculum Map, Lesson Workspace, Step Workspace, Lesson Preview 순서로 진행한다.

## 2026-05-28 어드민 코스 상세 에디터 설계 시작

- 코스 상세 페이지를 draft 기반 커리큘럼 편집 도구로 설계한다.
- 코스 기본 정보, 챕터, 레슨, 스텝까지 한 화면에서 관리하되 자동 저장 없이 상단 저장으로 일괄 반영한다.
- published 버전은 직접 수정하지 않고, 과거 published 복원은 새 draft 생성으로 처리한다.
- 설계 문서는 `docs/superpowers/specs/2026-05-28-admin-course-detail-editor-design.md`에 작성한다.

## 2026-05-28 어드민 코스 상세 에디터 설계 완료

- 코스 상세 화면은 기존 어드민 셸 안에서 코스 제작 요약, Curriculum Map, Lesson Workspace로 구성한다.
- URL query는 현재 버전, 작업대 화면, 선택 레슨, 선택 스텝을 저장해 새로고침 후 같은 내부 위치로 돌아오게 한다.
- API는 `courses/:courseId/curriculum` 하위 경계로 커리큘럼 버전 조회, draft 생성, 복원, 저장, 발행, 폐기를 표현한다.
- 변경사항은 클라이언트 `workingCopy`에 쌓고, `PUT /courses/:courseId/curriculum/versions/:versionId/content`에서 전체 snapshot으로 저장한다.
- 20개 레슨 스텝 타입은 모두 전용 폼으로 편집하고, 미리보기는 저장 전 작업 상태를 기준으로 렌더링한다.

## 2026-05-28 학습자 커리큘럼 업그레이드 브라우저 검증 완료

- 로컬 웹 앱을 실제 브라우저에서 열어 코스 상세의 새 커리큘럼 공지, 업그레이드 버튼, 나중에 결정 버튼을 시각적으로 확인했다.
- fake API 모드에서는 서버 새로고침 데이터가 다시 공지를 내려줄 수 있어, 성공 응답을 받은 클라이언트 공지 컴포넌트가 즉시 숨겨지도록 보정했다.
- 브라우저 재검증에서 업그레이드와 나중에 결정 후 공지가 사라지는 것을 확인했다.

## 2026-05-28 학습자 커리큘럼 업그레이드 UX 구현 시작

- 커리큘럼 버전 관리 로드맵 8단계 구현을 시작한다.
- 관리자 마이그레이션 맵을 학습자 선택 UX에서 사용할 수 있도록 learner-facing 업그레이드 API와 웹 공지를 추가한다.
- 관리자 API의 마이그레이션 맵 생성/조회/사용자 적용 기능은 유지하고, 학습자 선택 흐름은 별도 경계에서 구현한다.

## 2026-05-28 학습자 커리큘럼 업그레이드 UX 구현 완료

- `curriculum_upgrade_dismissals` 스키마를 추가해 학습자가 나중에 결정한 사용자/코스/source/target 버전 쌍을 보존한다.
- Core learning 계약에 업그레이드 공지 조회, 직접 적용, 공지 숨김 DTO와 service 결과를 추가했다.
- 관리자 적용 로직과 학습자 적용 로직이 같은 마이그레이션 helper를 사용하도록 분리했다.
- Learner API는 `GET /courses/:courseId/curriculum-upgrade`, `POST /courses/:courseId/curriculum-upgrade`, `POST /courses/:courseId/curriculum-upgrade/dismiss`를 제공한다.
- 웹 코스 상세 화면은 업그레이드 가능 상태일 때만 공지를 표시하고, 업그레이드 또는 나중에 결정 후 데이터를 새로고침한다.
- OpenAPI 문서와 웹 생성 타입에 새 learner route를 반영했다.

## 2026-05-28 커리큘럼 마이그레이션 맵 구현 시작

- 커리큘럼 버전 관리 로드맵 7단계 구현을 시작한다.
- 관리자 API가 커리큘럼 버전 사이의 레슨 매핑을 만들고, 특정 사용자 진행을 맵 기준으로 적용할 수 있게 한다.
- 학습자 업그레이드 선택 UX와 learner-facing route는 다음 단계로 남긴다.

## 2026-05-28 커리큘럼 마이그레이션 맵 구현 완료

- `curriculum_version_migrations`, `lesson_migration_mappings`, `curriculum_migration_applications` 스키마와 migration을 추가했다.
- Core admin 계약에 마이그레이션 맵 생성, 조회, 사용자 단위 적용 DTO와 service 결과를 추가했다.
- DB admin repository는 `equivalent`, `split`, `merged`, `removed` 매핑 정책으로 완료 레슨만 새 버전 진행에 이전한다.
- 마이그레이션 적용은 재실행해도 기존 완료 application 결과를 반환하며, 잘못된 source version 적용 시도는 failed application row로 남긴다.
- Admin API는 `POST /curriculum-migrations`, `GET /curriculum-migrations/:migrationId`, `POST /curriculum-migrations/:migrationId/apply`를 제공한다.
- 부분 진행과 lesson answer 이전, 여러 사용자 일괄 적용, 학습자 UX는 아직 제공하지 않는다.

## 2026-05-28 커리큘럼 마이그레이션 맵 구현 계획 시작

- 커리큘럼 버전 관리 로드맵 7단계 구현 계획을 작성한다.
- 이번 단계는 관리자 마이그레이션 맵 생성/조회와 사용자 단위 적용 경계를 만들고, 학습자 업그레이드 UX는 제외한다.

## 2026-05-28 커리큘럼 마이그레이션 맵 구현 계획 완료

- 설계 문서는 `docs/superpowers/specs/2026-05-28-curriculum-migration-map-design.md`에 작성한다.
- 구현 계획은 `docs/superpowers/plans/2026-05-28-curriculum-migration-map.md`에 작성한다.
- `equivalent`, `split`, `merged`, `removed` 매핑 정책과 idempotent 적용 결과를 구현 범위로 고정한다.

## 2026-05-28 관리자 커리큘럼 발행 워크플로우 구현 시작

- 커리큘럼 버전 관리 로드맵 6단계 구현을 시작한다.
- 관리자 API가 최신 published 버전에서 draft를 만들고, draft를 published로 승격할 수 있게 한다.
- 기존 학습자의 `course_progress.curriculum_version_id`는 publish 후에도 자동 변경하지 않는 것을 검증한다.

## 2026-05-28 관리자 커리큘럼 발행 워크플로우 구현 완료

- Core admin 계약에 커리큘럼 버전 목록, draft 생성, 상세 조회, publish DTO와 service 결과를 추가했다.
- DB admin repository는 최신 published 버전의 챕터와 레슨 snapshot을 트랜잭션으로 복제해 draft를 만든다.
- draft가 이미 있으면 `invalid-request`, source published 버전이 없으면 `not-found`로 반환한다.
- Admin API는 `GET /courses/:courseId/curriculum-versions`, `POST /courses/:courseId/curriculum-versions`, `GET /curriculum-versions/:versionId`, `POST /curriculum-versions/:versionId/publish`를 제공한다.
- publish 후 공개 콘텐츠 조회는 새 최신 published 버전을 사용하고, 기존 학습자 진행 row는 이전 버전을 유지하는 회귀 테스트를 추가했다.
- draft 구조 편집, 마이그레이션 맵, 학습자 업그레이드 UX는 다음 단계로 남긴다.

## 2026-05-28 관리자 커리큘럼 발행 워크플로우 구현 계획 시작

- 커리큘럼 버전 관리 로드맵 6단계 구현 계획을 작성한다.
- 이번 단계는 draft 생성, 버전 조회, draft publish의 최소 발행 경계만 구현하고 draft 구조 편집 API는 제외한다.

## 2026-05-28 관리자 커리큘럼 발행 워크플로우 구현 계획 완료

- 설계 문서는 `docs/superpowers/specs/2026-05-28-admin-curriculum-publish-workflow-design.md`에 작성한다.
- 구현 계획은 `docs/superpowers/plans/2026-05-28-admin-curriculum-publish-workflow.md`에 작성한다.
- published 구조 직접 수정 없이 최신 published 복제 draft를 만들고 publish하는 수직 경로로 제한한다.

## 2026-05-28 커리큘럼 노드 상태 정책 구현 시작

- 커리큘럼 버전 관리 로드맵 5단계 구현을 시작한다.
- 관리자 코스 트리 조회가 최신 published 커리큘럼 버전의 챕터와 레슨 상태를 표시하도록 한다.
- 공개/학습자 경로는 active 노드만 사용하고, 실제 delete API와 archive mutation API는 열지 않는다.

## 2026-05-28 커리큘럼 노드 상태 정책 구현 완료

- 관리자 코스 트리 DTO에 `active`, `deprecated`, `archived` 노드 상태 계약을 추가했다.
- 관리자 코스 트리 repository는 원본 `course_chapters`, `course_lessons`가 아니라 최신 published 커리큘럼 버전 스냅샷을 조회한다.
- 관리자 조회는 archived/deprecated 노드를 필터링하지 않고 상태와 함께 반환한다.
- 공개 콘텐츠와 학습 진행 경로는 active 챕터와 active 레슨만 신규 학습 경로로 사용하도록 회귀 테스트를 추가했다.
- 완료한 archived 레슨의 완료 카운트 보존을 core 학습 서비스 테스트로 고정했다.

## 2026-05-28 커리큘럼 노드 상태 정책 구현 계획 시작

- 커리큘럼 버전 관리 로드맵 5단계 구현 계획을 작성한다.
- 실제 delete API를 열지 않고, 챕터와 레슨 노드의 `active`, `deprecated`, `archived` 상태를 읽기 계약으로 고정한다.

## 2026-05-28 커리큘럼 노드 상태 정책 구현 계획 완료

- 설계 문서는 `docs/superpowers/specs/2026-05-28-curriculum-node-status-policy-design.md`에 작성한다.
- 구현 계획은 `docs/superpowers/plans/2026-05-28-curriculum-node-status-policy.md`에 작성한다.
- 관리자 코스 트리는 최신 published 커리큘럼 버전의 노드 상태를 표시하고, 공개/학습자 경로는 active 노드만 사용하는 범위로 제한한다.

## 2026-05-28 버전 인식 읽기 경로 구현 시작

- 커리큘럼 버전 관리 로드맵 4단계 구현을 시작한다.
- 공개 콘텐츠 조회는 최신 published 버전을 유지하고, 학습자 진행 조회와 쓰기는 저장된 진행 버전을 유지하도록 경계를 고정한다.
- 실제 버전 계산은 core/db 테스트가 검증하고, API route 통합 테스트는 공개 응답과 진행 응답이 섞이지 않는지 확인한다.

## 2026-05-28 버전 인식 읽기 경로 구현 완료

- `saveLessonAnswer`도 진행 저장과 완료 처리처럼 대상 레슨이 학습자의 진행 버전에 포함되는지 확인한다.
- API route 통합 테스트는 공개 `GET /courses/:courseId`와 인증된 진행 API가 서로 다른 service 결과를 유지하는지 검증한다.
- 진행 버전 밖 레슨에 대한 진행 저장, 답변 저장, 완료 요청은 모두 `400 invalid-request`로 매핑된다.
- 공개 DTO에 `curriculumVersionId`를 노출하지 않고 내부 service/repository 경계에서 버전 정책을 유지한다.

## 2026-05-28 버전 인식 읽기 경로 구현 계획 시작

- 커리큘럼 버전 관리 로드맵 4단계 구현 계획을 작성한다.
- 공개 콘텐츠 API는 최신 published 버전을 유지하고, 인증된 진행 API는 학습자의 진행 버전을 유지하는 경계를 API route 통합 테스트와 core/db 테스트 조합으로 고정한다.

## 2026-05-28 버전 인식 읽기 경로 구현 계획 완료

- 설계 문서는 `docs/superpowers/specs/2026-05-28-version-aware-read-path-design.md`에 작성한다.
- 구현 계획은 `docs/superpowers/plans/2026-05-28-version-aware-read-path.md`에 작성한다.
- 공개 DTO 변경 없이 API route 통합 테스트, core/db 검증, `saveLessonAnswer` 버전 검증을 추가하는 범위로 제한한다.

## 2026-05-28 학습 진행 버전 귀속 구현 시작

- 커리큘럼 버전 관리 로드맵 3단계 구현을 시작한다.
- `course_progress`와 `lesson_progress`에 `curriculum_version_id`를 기록해 기존 학습자가 자신의 진행 버전을 유지할 수 있게 한다.
- 관리자 발행 API와 학습자 업그레이드 UX는 아직 추가하지 않고, 진행 저장과 계산 경계만 먼저 고정한다.

## 2026-05-28 학습 진행 버전 귀속 구현 완료

- `CurriculumVersionId` 브랜드 타입과 학습 repository 계약을 추가했다.
- 새 학습 진행은 최신 published 버전을 선택하고, 기존 진행은 저장된 `course_progress.curriculum_version_id`를 유지한다.
- 코스 진행률과 다음 레슨은 진행 버전의 active 레슨 배치를 기준으로 계산한다.
- `lesson_progress.curriculum_version_id`를 저장하고, 완료 카운트는 같은 진행 버전의 완료 레슨만 집계한다.
- SQLite migration은 기존 진행 row를 코스별 `v1` published 버전으로 backfill할 수 있게 구성했다.

## 2026-05-28 학습 진행 버전 귀속 구현 계획 시작

- 커리큘럼 버전 관리 로드맵의 3단계인 학습 진행 버전 귀속 계획을 작성한다.
- 이번 계획은 학습 진행 저장 row에 커리큘럼 버전 ID를 기록하고, 진행률과 다음 레슨 계산을 해당 버전의 active 레슨 배치 기준으로 바꾸는 범위로 제한한다.

## 2026-05-28 학습 진행 버전 귀속 구현 계획 완료

- 구현 계획은 `docs/superpowers/plans/2026-05-28-progress-curriculum-version-binding.md`에 작성한다.
- 새 진행은 최신 published 커리큘럼 버전으로 시작하고, 기존 진행은 `course_progress.curriculum_version_id`를 유지하도록 설계한다.
- 학습자 업그레이드 UX, 관리자 발행 API, 마이그레이션 맵, 답변 버전 분리는 이후 단계로 남긴다.

## 2026-05-28 커리큘럼 버전 모델 추가 시작

- 커리큘럼 버전 관리 로드맵 2단계 구현을 시작한다.
- 기존 코스 콘텐츠를 코스별 `v1` published 버전에 귀속시키고, 공개 조회는 최신 published 버전의 active 스냅샷을 기준으로 계산하도록 바꾼다.
- 작업은 스키마와 마이그레이션, seed, 공개 repository, 문서와 전체 검증 단위로 나누어 커밋한다.

## 2026-05-28 커리큘럼 버전 모델 추가 완료

- `curriculum_versions`, `curriculum_version_chapters`, `curriculum_version_lessons` Drizzle 스키마와 SQLite 마이그레이션을 추가했다.
- 콘텐츠 seed는 기존 코스 구조와 함께 코스별 `v1` published 커리큘럼 버전 스냅샷을 생성한다.
- 공개 콘텐츠 목록, 검색, 상세 repository는 코스별 최신 published 버전의 active 챕터와 레슨 배치를 기준으로 `lessonCount`, `firstLessonId`, `chapters`를 계산한다.
- 학습 진행의 버전 귀속, 관리자 발행 API, 마이그레이션 맵, 학습자 업그레이드 UX는 다음 단계로 남긴다.

## 2026-05-28 커리큘럼 버전 모델 구현 계획 시작

- 커리큘럼 버전 관리 로드맵의 2단계인 커리큘럼 버전 모델 추가 계획을 작성한다.
- 이번 계획은 DB 스키마, 콘텐츠 seed, 공개 콘텐츠 조회 repository, 문서 갱신까지를 실행 단위로 삼는다.

## 2026-05-28 커리큘럼 버전 모델 구현 계획 완료

- 구현 계획은 `docs/superpowers/plans/2026-05-28-curriculum-version-model.md`에 작성한다.
- 2단계는 `curriculum_versions`, `curriculum_version_chapters`, `curriculum_version_lessons`를 추가하고 기존 콘텐츠를 코스별 `v1` published 버전으로 귀속시키는 범위로 제한한다.
- 학습 진행의 버전 귀속, 관리자 발행, 마이그레이션 맵, 학습자 업그레이드 UX는 이후 단계로 남긴다.

## 2026-05-28 콘텐츠 변경 정책 문서화 시작

- 커리큘럼 버전 관리 로드맵의 1단계로 콘텐츠 변경 정책을 공식 문서에 반영한다.
- 관리자 콘텐츠 수정 기능은 아직 추가하지 않고, 변경 유형과 완료 성취 보존 원칙을 먼저 고정한다.
- 구현 계획은 `docs/superpowers/plans/2026-05-28-curriculum-change-policy.md`에 작성한다.

## 2026-05-28 콘텐츠 변경 정책 문서화 완료

- `DOMAIN.md`에 콘텐츠 변경 정책의 단일 출처를 작성한다.
- `BACKEND.md`에 현재 백엔드 구조에서 관리자 수정 API를 추가하기 전에 지켜야 할 제약을 기록한다.
- `docs/curriculum-change-policy.md`에 운영자와 구현자를 위한 정책 요약을 추가한다.
- 구조 변경은 커리큘럼 버전 경계가 생긴 뒤 허용하고, 삭제는 아카이빙으로 대체하는 원칙을 문서화한다.

## 2026-05-28 콘텐츠 변경 정책 구현 계획 시작

- 커리큘럼 버전 관리 로드맵의 첫 실행 단위로 콘텐츠 변경 정책 문서화 계획을 작성한다.
- 전체 로드맵을 한 번에 구현하지 않고 정책 문서화, 버전 모델, 진행 귀속, 읽기 경로, 아카이빙, 발행, 마이그레이션, 학습자 UX 순서로 나눈다.

## 2026-05-28 콘텐츠 변경 정책 구현 계획 완료

- 구현 계획은 `docs/superpowers/plans/2026-05-28-curriculum-change-policy.md`에 작성한다.
- 1단계 산출물은 `DOMAIN.md`, `BACKEND.md`, `docs/curriculum-change-policy.md`, `docs/admin-site.md`, `docs/platform-backend-api.md` 갱신으로 정한다.
- 이번 계획은 런타임 코드와 DB 스키마를 바꾸지 않고 변경 유형, 아카이빙, 완료 성취 보존 원칙을 공식 문서에 고정하는 데 집중한다.

## 2026-05-28 커리큘럼 버전 관리 로드맵 설계 시작

- 관리자 콘텐츠 수정 기능을 만들기 전에 학습자 완료 성취를 보존하는 커리큘럼 버전 관리 로드맵을 먼저 고정한다.
- 한 번 공개한 코스를 불변으로 두는 대신 변경 유형, 버전 발행, 아카이빙, 마이그레이션, 학습자 업그레이드 UX를 단계별 작업으로 나눈다.
- 설계 문서는 `docs/superpowers/specs/2026-05-28-curriculum-versioning-roadmap-design.md`에 작성한다.

## 2026-05-28 커리큘럼 버전 관리 로드맵 설계 완료

- 전체 작업을 정책 문서화, 커리큘럼 버전 모델, 진행 버전 귀속, 버전 인식 읽기 경로, 아카이빙, 관리자 발행, 마이그레이션 맵, 학습자 업그레이드 UX의 8단계로 나눴다.
- 관리자 CMS보다 `curriculum_versions` 중심의 버전 경계를 먼저 구현하는 방향으로 정했다.
- 기존 콘텐츠는 코스별 `v1` published 버전으로 시작하고, 신규 학습자는 최신 published 버전으로 시작하는 원칙을 고정했다.
- 기존 학습자는 명시적 업그레이드 전까지 자신의 진행 버전을 유지한다.
- 레슨과 챕터 삭제는 실제 삭제가 아니라 `active`, `deprecated`, `archived` 상태 전환으로 처리한다.
- 가장 중요한 완료 기준은 학습자가 이미 완료한 성취가 구조 변경 때문에 사라지지 않는 것이다.

## 2026-05-28 코스 목록 Data Table 개선 시작

- 코스 목록 페이지를 shadcn Data Table 가이드와 지정 dashboard DataTable 템플릿 기반으로 개선한다.
- 코스 목록은 코스 단위 데이터만 조회하고, 챕터와 레슨 데이터는 코스 상세 페이지 책임으로 분리한다.
- 검색과 페이지네이션은 모두 서버측에서 수행한다.
- 이번 작업의 코스 상세 페이지는 실제 하위 데이터 표시 전 빈 자리 화면으로만 구현한다.
- 설계 문서는 `docs/superpowers/specs/2026-05-28-admin-course-list-data-table-design.md`에 작성한다.

## 2026-05-28 코스 목록 Data Table 개선 완료

- 어드민 Core, DB repository, Admin API에 코스 목록 전용 조회 계약을 추가했다.
- `GET /courses?page=1&pageSize=10&query=...`는 코스 단위 목록과 `pagination` 메타데이터를 반환한다.
- 기존 `GET /courses?include=chapters,lessons` 트리 조회는 유지한다.
- 코스 검색은 서버측에서 코스명과 설명을 대상으로 수행한다.
- 페이지네이션은 서버측 `limit`, `offset`, `totalCount` 조회로 수행한다.
- 어드민 코스 목록 화면은 shadcn Data Table 가이드와 지정 dashboard DataTable 템플릿의 Table, 컬럼 표시, 페이지 크기 선택, 첫/이전/다음/마지막 페이지 버튼 구조를 기반으로 구현했다.
- TanStack Table은 `manualPagination`, `manualFiltering`, `rowCount`, `getCoreRowModel()` 설정으로 서버 응답만 렌더링한다.
- `/courses/[id]`는 챕터와 레슨 상세 조회 전 빈 자리 화면으로 추가했다.
- 검증은 core, db, admin-api, admin의 집중 테스트와 admin 타입체크, lint로 확인했다.

## 2026-05-28 코스 목록 썸네일 표시 시작

- 코스 목록 DataTable의 코스명 셀에 작은 썸네일을 함께 표시한다.
- 목록 API row에 `thumbnailPath`를 포함해 UI가 DB에 저장된 코스 썸네일 경로를 사용하도록 한다.
- 코스명 셀은 shadcn `Avatar`를 사용해 32px 썸네일, 코스명 링크, 이미지 fallback을 함께 렌더링한다.
- 어드민 앱에서 `/course-thumbnails/*` 경로가 실제 썸네일 이미지를 제공하도록 로컬 public asset 경계를 보정한다.

## 2026-05-28 코스 목록 썸네일 표시 완료

- `AdminCourseListDto`와 목록 repository 응답에 `thumbnailPath`를 추가했다.
- 어드민 코스 목록 API는 코스명, 설명, 정렬 순서와 함께 썸네일 경로를 반환한다.
- 코스명 셀은 shadcn `Avatar`, `AvatarImage`, `AvatarFallback` 조합으로 썸네일과 코스명 링크를 함께 표시한다.
- 어드민 앱의 `/course-thumbnails/[name]` route가 웹 앱 public 썸네일 파일을 읽어 `image/png`로 반환한다.
- 잘못된 썸네일 파일명은 404로 처리해 경로 탐색을 막는다.
- 검증은 core, db, admin-api, admin 집중 테스트와 타입체크, admin lint로 확인했다.

## 2026-05-27 설계 시작

- 어드민 사이트는 학습자 플랫폼과 분리된 운영 도구로 설계한다.
- 1차 목표는 관리자 로그인, 대시보드 레이아웃, 콘텐츠 계층 조회, 사용자 목록 조회다.
- 콘텐츠 생성, 수정, 삭제와 사용자 관리 기능은 2차 목표로 미룬다.
- 플랫폼과 어드민은 프론트엔드 Next.js, 백엔드 Hono 구조를 동일하게 가져간다.
- 어드민 프론트엔드와 백엔드는 별도 런타임으로 두며, 구동되지 않아도 플랫폼의 모든 기능은 정상 동작해야 한다.

## 2026-05-27 설계 완료

- 설계 문서는 `docs/superpowers/specs/2026-05-27-admin-site-design.md`에 작성했다.
- 권장 구조는 `apps/admin` Next.js 앱과 `apps/admin-api` Hono API 서버를 별도로 두고 같은 DB를 공유하는 방식이다.
- 관리자 인증은 Better Auth 기반 ID/password를 사용하되, 플랫폼 인증과 테이블, 쿠키, origin 설정을 분리한다.
- 최초 관리자 계정은 DB 시드 명령으로 생성한다.
- 어드민 API는 별도 서버 자체를 boundary로 보고 `/admin` prefix 없이 `GET /courses?include=chapters,lessons`, `GET /users` 같은 RESTful 리소스 경로를 사용한다.
- 어드민 UI는 shadcn `sidebar-07` 블록 구조를 참고한 왼쪽 사이드바 대시보드 레이아웃을 사용한다.

## 2026-05-27 구현 계획 완료

- 구현 계획은 `docs/superpowers/plans/2026-05-27-admin-site.md`에 작성했다.
- 계획은 공유 DB와 core 계약, `apps/admin-api`, `apps/admin`, 문서와 전체 검증 순서로 나뉜다.
- 각 task는 실패 테스트 작성, 실패 확인, 최소 구현, 검증, 커밋 단위로 진행한다.

## 2026-05-27 구현 시작

- `apps/admin`과 `apps/admin-api`를 추가해 어드민을 플랫폼과 별도 런타임으로 구현한다.
- 구현 순서는 `docs/superpowers/plans/2026-05-27-admin-site.md`의 작업 1부터 작업 10까지 따른다.
- 1차 구현 범위는 관리자 로그인, 보호된 사이드바 레이아웃, 콘텐츠 계층 조회, 사용자 기본 목록 조회다.

## 2026-05-28 작업 2 시작

- 관리자 인증은 플랫폼 사용자 인증과 분리된 DB 테이블을 사용한다.
- `packages/db`에 `admin_user`, `admin_session`, `admin_account`, `admin_verification` 스키마와 마이그레이션을 추가한다.

## 2026-05-28 작업 2 완료

- 관리자 인증 Drizzle 스키마와 `0002-admin-auth.sql` 마이그레이션을 추가했다.
- 콘텐츠 마이그레이션 실행 시 관리자 인증 테이블도 함께 생성되도록 연결했다.
- `packages/db` 클라이언트 테스트에서 관리자 인증 테이블 생성과 `admin_user` insert를 검증한다.

## 2026-05-28 작업 3 시작

- `packages/core`에 어드민 콘텐츠 계층 조회와 사용자 목록 조회 계약을 추가한다.
- 어드민 API가 구현될 때 사용할 DTO, 오류 DTO, repository port, service를 먼저 고정한다.

## 2026-05-28 작업 3 완료

- 어드민 콘텐츠 트리와 사용자 목록 DTO 스키마를 추가했다.
- 어드민 조회 repository port와 service를 추가하고 repository 응답 검증 실패를 DB 사용 불가 결과로 처리한다.
- `packages/core` public export와 `@workspace/core/admin` subpath export에 어드민 모듈을 연결했다.
- 코드 품질 리뷰 반영으로 repository 예외, 사용자 이메일, 사용자 일시 DTO 검증 실패가 모두 `database-unavailable` 결과로 변환되는지 테스트를 보강했다.

## 2026-05-28 작업 4 시작

- `packages/db`에 어드민 콘텐츠 계층 조회와 플랫폼 사용자 목록 조회 repository 구현을 추가한다.
- 구현 전 실패 테스트로 `AdminRepository` 계약과 DB row 매핑을 검증한다.

## 2026-05-28 작업 4 완료

- `createDrizzleAdminRepository`를 추가해 콘텐츠 코스, 챕터, 레슨 계층과 플랫폼 사용자 목록을 조회한다.
- `@workspace/db` root export에서 어드민 repository를 사용할 수 있게 연결했다.
- `packages/db` typecheck가 `@workspace/core/admin` subpath를 해석하도록 admin path mapping을 추가했다.
- 수동 fixture 기반 테스트로 코스, 챕터, 레슨의 정확한 row mapping과 정렬 순서, 사용자 createdAt 오름차순 정렬을 검증한다.

## 2026-05-28 작업 5 시작

- `apps/admin-api` Hono 앱 뼈대와 관리자 인증 runtime을 추가한다.
- 플랫폼 API 패턴을 따르되 Better Auth 테이블, 쿠키 prefix, CORS origin은 어드민 전용 설정으로 분리한다.

## 2026-05-28 작업 5 완료

- `apps/admin-api` workspace 패키지와 TypeScript, ESLint, Vitest 설정을 추가했다.
- 어드민 전용 환경 변수 파서, DB 디렉터리 생성 helper, Hono 앱, health/auth 라우트, 서버 entrypoint를 추가했다.
- Better Auth runtime은 관리자 인증 테이블과 `writing-app-admin` 쿠키 prefix를 사용하도록 분리했다.
- `vitest.workspace.ts`에 어드민 API 테스트 프로젝트를 연결했다.

## 2026-05-28 작업 6 시작

- `apps/admin-api`에 관리자 인증으로 보호되는 콘텐츠 계층 조회와 사용자 목록 조회 REST route를 추가한다.
- OpenAPI JSON route를 함께 등록해 어드민 API 조회 surface를 문서화한다.

## 2026-05-28 작업 6 완료

- `GET /courses?include=chapters,lessons`와 `GET /users`를 관리자 세션 필수 route로 등록했다.
- `GET /courses`의 누락되거나 다른 include query는 `invalid-request` 400 응답으로 처리한다.
- `GET /openapi.json`에서 어드민 API OpenAPI 3.1 문서를 반환하도록 등록했다.

## 2026-05-28 작업 7 시작

- 최초 관리자 계정을 생성하는 어드민 API 시드 명령을 추가한다.
- 동일 이메일 시드 실행은 중복 생성 없이 기존 계정 존재 결과를 반환하도록 검증한다.

## 2026-05-28 작업 7 완료

- `apps/admin-api`에 최초 관리자 계정 시드 스크립트와 테스트를 추가했다.
- 시드는 Better Auth 공개 password hash API로 credential account를 만들고, 같은 이메일이 있으면 중복 생성하지 않는다.
- `seed:admin` 명령으로 마이그레이션 실행 후 시드 결과를 JSON으로 출력하도록 연결했다.

## 2026-05-28 작업 7 리뷰 반영

- Better Auth 로그인 조회와 맞도록 시드 이메일을 소문자로 정규화한다.
- `apps/admin-api` 테스트는 기존 Vitest 설정을 유지하고, 시드 단위 테스트는 SQLite runtime에 직접 묶이지 않도록 분리한다.

## 2026-05-28 작업 8 시작

- `apps/admin` Next.js 앱 뼈대와 어드민 API 클라이언트를 추가한다.
- 기존 `apps/web` 설정과 Next 16 문서의 async `cookies()` 사용 방식을 확인한 뒤 같은 패턴으로 구성한다.
- API 클라이언트는 실패 테스트를 먼저 작성해 요청 URL, credential 전달, 오류 결과 매핑을 고정한다.

## 2026-05-28 작업 8 완료

- `apps/admin` workspace 패키지와 Next.js, ESLint, PostCSS, shadcn, Vitest 설정을 추가했다.
- 어드민 앱 root layout은 한국어 metadata, `Noto_Sans_KR`, `ThemeProvider`, `Toaster`를 기존 web 앱 패턴과 맞춰 구성했다.
- fetch 기반 어드민 API 클라이언트와 서버 쿠키 전달 helper를 추가하고, 콘텐츠 트리와 사용자 목록 요청, non-ok 오류 결과 매핑을 테스트로 검증했다.

## 2026-05-28 작업 8 리뷰 반영

- `ADMIN_API_BASE_URL`을 Turbo 전역 환경 변수에 추가해 어드민 앱 lint 경고를 제거한다.
- 어드민 API 클라이언트는 네트워크 실패와 잘못된 JSON 응답을 명시적 오류 결과로 반환한다.
- 새 어드민 앱에 TypeScript 빌드 산출물 ignore 설정을 추가한다.

## 2026-05-28 작업 9 시작

- 관리자 로그인 페이지와 same-origin 인증 프록시를 추가한다.
- 보호된 어드민 영역은 세션 확인 후 왼쪽 사이드바 shell로 렌더링한다.
- 루트 경로는 콘텐츠 운영의 기본 진입점인 `/courses`로 연결한다.

## 2026-05-28 작업 9 완료

- 관리자 로그인 next path 검증, 이메일 로그인 클라이언트, same-origin 인증 프록시를 추가했다.
- `/api/auth/[...path]` route handler가 어드민 API 인증 route로 GET/POST 요청을 전달하도록 연결했다.
- 로그인 페이지, 보호 layout, 왼쪽 사이드바 기반 `AdminShell`, 루트 `/courses` redirect를 추가했다.
- 로그인 성공/실패와 인증 navigation/proxy/client 동작을 테스트로 검증했다.

## 2026-05-28 작업 9 리뷰 반영

- 사이드바 메뉴는 1차 범위인 콘텐츠와 사용자 조회로 제한한다.
- 동작 없는 관리자 footer 버튼을 제거한다.
- 로그인 요청 중 중복 제출을 막는 guard를 추가한다.

## 2026-05-28 작업 10 시작

- 콘텐츠와 사용자 조회 화면을 추가한다.
- 코스, 챕터, 레슨 계층과 사용자 기본 정보를 읽기 전용으로 표시한다.

## 2026-05-28 작업 10 완료

- `/courses`에서 코스, 챕터, 레슨 계층을 읽기 전용 카드와 접기 UI로 표시한다.
- `/users`에서 사용자 이름, 이메일, 이메일 인증 상태, 가입일을 표로 표시한다.
- 두 조회 화면 모두 조회 결과가 없을 때 접근 가능한 빈 상태를 렌더링한다.

## 2026-05-28 작업 10 리뷰 반영

- 콘텐츠 조회 화면은 코스에 챕터가 없거나 챕터에 레슨이 없을 때도 중첩 빈 상태 문구를 표시한다.
- 중첩 빈 상태 테스트를 추가해 빈 카드나 빈 레슨 목록이 렌더링되지 않도록 검증한다.

## 2026-05-28 작업 11 시작

- 어드민 앱과 어드민 API가 추가된 현재 구조를 `ARCHITECTURE.md`, `BACKEND.md`, `FRONTEND.md`에 반영한다.
- 전체 테스트, 타입체크, 린트, pre-commit, 로컬 실행, 플랫폼 독립성 검증으로 1차 구현을 마무리한다.

## 2026-05-28 구현 완료

- `apps/admin`과 `apps/admin-api`를 추가했다.
- 관리자 Better Auth 테이블은 `admin_*`로 분리했다.
- 최초 관리자 계정은 `bun --filter @workspace/admin-api seed:admin`으로 생성한다.
- 어드민 화면은 shadcn 사이드바 기반 왼쪽 사이드바 레이아웃을 사용한다.
- 콘텐츠 계층 조회와 사용자 기본 정보 조회를 읽기 전용으로 제공한다.
- 전체 검증은 admin, admin-api, platform API, platform web 테스트와 pre-commit으로 확인한다.

## 2026-05-28 작업 11 검증 보정

- `packages/db` root export가 어드민 repository를 노출하면서 플랫폼 API 타입체크도 `@workspace/core/admin` subpath를 해석해야 한다.
- `apps/api` TypeScript path mapping에 core admin 도메인을 추가해 플랫폼 API 타입체크가 workspace source export를 일관되게 해석하도록 보정한다.
- `bun dev:admin` 실행 시 Turbo strict env가 어드민 API 인증 환경 변수를 전달하도록 `turbo.json` 전역 환경 변수 목록을 보강한다.
- `apps/api` lint는 기존 `BUN_EXECUTABLE`, `HOME` Turbo env 경고 2개를 출력하지만 종료 코드 `0`으로 통과한다.

## 2026-05-28 통합 리뷰 반영

- `BACKEND.md`의 최초 관리자 시드 환경 변수 표에서 실제 구현에 없는 `ADMIN_SEED_EMAIL_VERIFIED` 항목을 제거한다.
- 구현 계획 문서의 영어 라벨을 한국어로 정리해 문서 작성 규칙을 맞춘다.

## 2026-05-28 운영 환경 설정 정리

- `apps/admin`에 `ADMIN_API_BASE_URL` 예시 환경 파일을 추가한다.
- `apps/admin-api/.env.example`에 운영에서 반드시 교체해야 하는 관리자 인증 비밀값과 최초 관리자 시드 변수를 명시한다.
- `docs/operations-environment.md`에 학습자 플랫폼과 어드민의 dev/prod 환경 변수, 비밀값 분리 원칙, 배포 체크리스트를 정리한다.

## 2026-05-28 공유 SQLite 경로 정리 시작

- 플랫폼 API와 어드민 API가 같은 로컬 SQLite 파일을 보도록 기본 개발 경로를 저장소 루트 `data/api.sqlite`로 통일한다.
- 앱별 `data` 디렉터리에 DB가 따로 생성되지 않도록 환경 변수 예시와 DB 시드 기본 경로를 함께 보정한다.

## 2026-05-28 공유 SQLite 경로 정리 완료

- `apps/api/.env.example`과 `apps/admin-api/.env.example`의 `DATABASE_URL`을 앱 패키지 기준 `file:../../data/api.sqlite`로 맞췄다.
- `packages/db`의 콘텐츠 시드 기본 경로와 Drizzle 기본 DB 경로도 저장소 루트 `data/api.sqlite`를 가리키도록 보정했다.
- 로컬 검증용 SQLite는 루트 `data/api.sqlite`로 합치고 앱별 `data` 디렉터리는 백업 후 제거한다.

## 2026-05-28 개발용 어드민 부트스트랩 시작

- SQLite 파일이 없는 상태에서 `bun run dev:admin`만 실행해도 로컬 어드민에 로그인할 수 있어야 한다.
- 개발 실행 전에 루트 `data/api.sqlite`에 콘텐츠 시드와 개발용 관리자 계정을 보장하도록 스크립트를 보정한다.

## 2026-05-28 개발용 어드민 부트스트랩 완료

- 루트 `dev:admin` 스크립트가 먼저 `dev:admin:setup`을 실행하도록 변경했다.
- `dev:admin:setup`은 콘텐츠 시드와 명시된 관리자 시드 계정을 루트 `data/api.sqlite`에 생성한다.
- 같은 이메일이 이미 있으면 관리자 시드는 중복 생성하지 않는다.

## 2026-05-28 개발용 관리자 비밀번호 동기화 시작

- `ADMIN_SEED_PASSWORD`를 지정해 `bun run dev:admin`을 실행하면 해당 비밀번호로 로그인할 수 있어야 한다.
- 기존 관리자 계정이 있더라도 개발 setup에서는 seed 비밀번호를 현재 환경 변수 값으로 맞춘다.

## 2026-05-28 개발용 관리자 비밀번호 동기화 완료

- `dev:admin`과 `dev:admin:setup`은 외부에서 전달된 `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`, `DATABASE_URL`, 관리자 인증 환경 변수만 사용한다.
- 기존 개발 관리자 credential 비밀번호를 갱신해야 할 때는 실행자가 `ADMIN_SEED_RESET_PASSWORD=true`를 직접 명시한다.
- 운영용 `seed:admin`은 `ADMIN_SEED_RESET_PASSWORD=true`를 명시하지 않으면 기존 관리자 비밀번호를 바꾸지 않는다.

## 2026-05-28 Windows Bun SQLite 디렉터리 보장 수정 시작

- Windows Bun 환경에서 이미 존재하는 상대 상위 디렉터리에 `mkdirSync(..., { recursive: true })`를 다시 호출하면 `EEXIST`가 발생할 수 있다.
- API와 어드민 API의 SQLite 부모 디렉터리 보장 로직이 기존 디렉터리를 정상 상태로 처리하도록 보정한다.

## 2026-05-28 Windows Bun SQLite 디렉터리 보장 수정 완료

- `ensureDatabaseDirectory`가 SQLite 부모 경로를 절대 경로로 정규화한 뒤 기존 디렉터리 여부를 먼저 확인하도록 변경했다.
- 기존 DB 파일이 있는 상대 상위 디렉터리 경로에서도 API와 어드민 API 환경 테스트가 실패하지 않도록 회귀 테스트를 추가했다.

## 2026-05-28 어드민 페이지 헤더 분리 시작

- `AdminShell`에 고정된 `운영 콘솔` 제목을 제거한다.
- 각 어드민 페이지가 `AdminHeader`를 직접 렌더링해 페이지별 제목과 설명을 소유하도록 변경한다.

## 2026-05-28 어드민 페이지 헤더 분리 완료

- `AdminShell`은 사이드바와 본문 레이아웃만 담당하고 페이지 제목을 렌더링하지 않는다.
- `AdminHeader`를 추가해 각 페이지가 제목, 설명, 우측 액션 영역을 직접 전달하도록 했다.
- 콘텐츠와 사용자 조회 화면은 각각 `콘텐츠`, `사용자` 헤더를 직접 렌더링한다.

## 2026-05-28 package.json 환경 변수 경계 정리 시작

- 루트 `package.json`의 `dev:admin`, `dev:admin:setup`에서 환경 변수 기본값을 암시적으로 주입하는 패턴을 제거한다.
- `package.json`은 명령 조합과 Turbo filter만 담당하고, 환경 변수 값은 `.env`, 셸, CI, 배포 환경에서 명시적으로 제공한다.
- 필수 환경 변수가 없으면 앱별 환경 변수 파서와 시드 스크립트가 시작 단계에서 실패하도록 기존 경계를 유지한다.

## 2026-05-28 package.json 환경 변수 경계 정리 완료

- 루트 `dev:admin`, `dev:admin:setup`에서 `ADMIN_*`, `DATABASE_URL`, `ADMIN_SEED_*` 환경 변수 주입을 제거했다.
- 어드민 로컬 통합 실행은 환경 변수가 준비된 상태에서만 setup과 dev server를 실행한다.
- 필수 환경 변수 누락은 `@workspace/env` 기반 어드민 API 환경 검증 또는 관리자 시드 스크립트의 필수 시드 값 검증에서 명시적으로 실패한다.
- `ADMIN_SEED_RESET_PASSWORD=true`는 더 이상 루트 스크립트가 대신 설정하지 않으며, 기존 관리자 비밀번호 갱신이 필요한 실행자가 직접 명시한다.
- 검증 중 Bun의 앱별 `.env` 자동 로딩을 확인했으며, `.env`를 끈 상태에서는 필수 환경 변수 누락이 `Invalid environment variables`로 실패한다.

## 2026-05-29 어드민 코스 상세 에디터 정정 완료

- 코스 상세 화면을 editor document 기반으로 조회하고 저장하도록 core, DB, admin-api, admin HTTP client 계약을 확장했다.
- 코스 기본 정보, 챕터, 레슨, 스텝을 draft 기준으로 추가, 수정, 정렬, 아카이브할 수 있는 UI와 상태 갱신 로직을 추가했다.
- 상단 제목, 버전 상태, 커리큘럼, 레슨 작업대, 미리보기, 스텝 상세 폼의 영문 enum과 개발 용어를 한국어 운영 라벨로 교체했다.
- published 버전은 읽기 전용으로 표시하고, 발행, 폐기, 복원, 이탈 같은 위험 작업에는 확인 흐름을 추가했다.
- 모바일에서 커리큘럼과 작업대를 전환할 수 있도록 레이아웃을 수정해 오른쪽 작업대가 사라지는 문제를 제거했다.
- 감사 결과와 설계, 구현 계획은 `docs/admin-course-detail-ui-audit.md`, `docs/superpowers/specs/2026-05-29-admin-course-editor-correction-design.md`, `docs/superpowers/plans/2026-05-29-admin-course-editor-correction.md`에 기록했다.

## 2026-05-29 어드민 코스 썸네일 업로드 시작

- 코스 상세 페이지의 `썸네일 변경` 버튼을 signed URL 기반 즉시 업로드 흐름으로 연결한다.
- 로컬 개발 환경은 RustFS의 S3-compatible API와 `writing-app-public-assets` 공개 버킷을 사용한다.
- 업로드 성공 후에는 기존 코스 편집 저장 버튼을 통해 DB의 `thumbnailPath`를 반영한다.

## 2026-05-29 어드민 코스 썸네일 업로드 완료

- 어드민 API에 `POST /course-thumbnails/uploads`를 추가해 RustFS PUT signed URL을 발급한다.
- 어드민 웹은 파일 선택 즉시 signed URL로 이미지를 업로드하고, 성공한 공개 URL을 dirty 상태의 `thumbnailPath`로 반영한다.
- 저장하지 않고 이탈한 경우 미참조 객체가 남을 수 있으며, 자동 정리는 이번 범위에 포함하지 않는다.

## 2026-05-30 챕터 레이블 제거 완료

- 챕터 편집 팝오버에서 레이블 입력을 제거하고 제목만 편집한다.
- 관리자 API의 챕터 응답과 저장 요청에서 챕터 `label` 속성을 제거했다.
- 새 챕터 생성 시 별도 단원 표시명을 만들지 않고 제목과 정렬 순서만 저장한다.
