# P0 route와 data inventory

## HTTP와 OpenAPI

학습자 route는 `apps/api/src/routes/index.ts`, 관리자 route는 `apps/api/src/composition/admin-route-composition.ts`가 조립한다. runtime OpenAPI는 learner `/openapi`와 admin `/api/admin/openapi`가 생성하며 route test와 target contract가 path, schema, security를 검증한다.

| owner 후보           | method·path                                                                                                                                                         | audience·auth                         | request·response schema source                                  | frontend consumer                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------- |
| platform/auth        | `GET /health`, `GET /openapi`, `GET·POST /api/auth/*`                                                                                                               | public 또는 Better Auth               | health route, runtime OpenAPI, auth handler                     | web auth client                                           |
| identity             | `GET /auth/session`, `GET /profile`                                                                                                                                 | active learner session                | auth·profile route schema                                       | web proxy, profile page                                   |
| learning             | `GET /courses`, `GET /course-categories`, `GET /courses/{courseId}`, `GET /lessons/{lessonId}`, `GET /progress`                                                     | active learner session                | contracts learning read schema                                  | `apps/web/src/shared/http/create-http-writing-app-api.ts` |
| learning             | `POST /learning/lessons/{lessonId}/start`, `POST /learning/lessons/{lessonId}/steps/{stepId}/complete`                                                              | active learner session                | start·complete body/params/result schema                        | 같은 web HTTP adapter                                     |
| learning→ai-feedback | `POST /learning/lessons/{lessonId}/steps/{stepId}/ai-feedback`                                                                                                      | active learner session                | idempotency header, params, transition result                   | 같은 web HTTP adapter                                     |
| admin platform/auth  | `GET /api/admin/health`, `GET /api/admin/session`, `GET /api/admin/openapi`, `GET·POST /api/admin/auth/*`                                                           | public 또는 admin session             | foundation schema, Better Auth                                  | admin auth/session adapter                                |
| identity             | `GET /api/admin/users`, `GET /api/admin/users/{userId}`, `PATCH /api/admin/users/{userId}/status`, `DELETE /api/admin/users/{userId}`                               | admin; mutation owner                 | identity query/body/DTO                                         | admin user DAL/action                                     |
| content              | `GET·POST /api/admin/courses`, `DELETE /api/admin/courses/{courseId}`, `GET·PUT /api/admin/courses/{courseId}/editor`, `POST /api/admin/courses/{courseId}/publish` | admin; mutation owner                 | content query, ETag, editor/publish DTO                         | admin catalog/editor adapter                              |
| operations           | `GET /api/admin/dashboard`, `GET /api/admin/analytics`, `GET /api/admin/analytics/lessons`                                                                          | admin session                         | dashboard·analytics query/DTO                                   | admin dashboard·analytics DAL                             |
| operations           | `GET /api/admin/settings`, `PUT /api/admin/settings/notice`, `PUT /api/admin/settings/legal`, `POST /api/admin/settings/content-reset`                              | admin; mutation owner                 | settings request/DTO                                            | admin settings DAL                                        |
| operations           | `GET /api/admin/ai-chat/conversations`, `GET /api/admin/ai-chat/conversations/{conversationId}`, `POST /api/admin/ai-chat/messages/stream`                          | admin session와 limiter               | AI chat query/request/SSE event                                 | admin AI chat DAL·stream route                            |
| resource-library     | tree·folder·document·node·search 14개 operation                                                                                                                     | admin session; permanent delete owner | resource tree/document/search, ETag, multipart, Markdown schema | admin resource adapters                                   |

관리자 resource 14개 operation의 exact method·path는 `resource-tree.routes.ts`, `resource-documents.routes.ts`, `resource-search.routes.ts`가 소유한다. 모든 route는 위 표에서 공통 platform 또는 정확히 하나의 module 후보에 배정됐고 미배정 route는 0개다.

## Schema와 migration

`packages/db/src/schema/`의 소유 후보는 다음과 같다. FTS5 shadow table은 `admin_resource_search`와 함께 resource-library가 소유한다.

| owner            | table                                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| auth infra       | `user`, `session`, `account`, `verification`, `admin_user`, `admin_session`, `admin_account`, `admin_verification`  |
| identity         | `learner_profiles`                                                                                                  |
| content          | `courses`, `course_curriculum_versions`, `course_unit_versions`, `lesson_versions`, `lesson_step_versions`          |
| learning         | `learner_activity_days`, `learner_course_progress`, `learner_lesson_progress`, `learner_lesson_answers`             |
| ai-feedback      | `ai_feedback_attempts`                                                                                              |
| resource-library | `admin_resource_nodes`, `admin_resource_documents`, `admin_resource_assets`, `admin_resource_search`와 shadow table |
| operations       | `admin_settings`, `admin_ai_chat_conversations`, `admin_ai_chat_messages`                                           |

runtime migration 결과는 명시 index 16개와 trigger 14개를 만든다. resource index·trigger는 tree/document/asset/FTS 무결성을, content trigger는 published revision 불변성을, learning·feedback index는 조회·멱등·active slot을 소유한다. exact SQL은 `packages/db/src/migrations/0000-writing-app-baseline.sql`, Drizzle 선언은 context별 `*.schema.ts`가 소유한다.

기준 migration은 위 SQL 한 개이며 SHA-256은 `100fc387be249c73de3b26cc46c3f7cfb6dc9f5d8051adc8614bfda3f9b81547`이다. 실행점은 `packages/db/src/migrations/migrate.ts`; 기존 mutable curriculum 전환은 `curriculum-migration.ts`가 pre/post integrity와 foreign key를 검사한다. 적용된 migration은 수정하지 않고 P11의 변경은 append-only로 추가한다.

## Cross-context 접근

- learning table은 auth `user`와 content course·revision·lesson·step을 FK로 참조한다.
- ai-feedback은 auth `user`, learning progress와 content step을 FK로 참조한다.
- resource node의 `created_by`·`updated_by`와 operations 대화의 `admin_id`는 auth `admin_user`를 참조한다.
- operations의 dashboard·analytics repository는 auth, identity, content와 learning table을 직접 읽는다.
- identity의 관리자 사용자 repository는 auth, profile, content와 learning table을 직접 읽는다.
- learning read·transition repository는 content와 learning table을 join하고 transition은 feedback attempt도 함께 갱신한다.
- ai-feedback repository는 learning progress와 content step을 join한다.

직접 접근 source는 `apps/api/src/adapters/{dashboard,analytics,identity,learning,ai-feedback}/`다. P3~P9에서 FK는 branded ID와 사전 무결성 검사로, cross-context join은 공개 query/reporting port로 전환한다.

## Seed, 환경, 배포와 test

- migration·seed entry: `packages/db/package.json`, `packages/db/src/seeds/seed.ts`; 관리자 seed는 `apps/api/src/scripts/seed-admin.ts`다.
- reset은 `ALLOW_DATABASE_RESET=true`, `--force`와 대상 fingerprint를 요구하고 먼저 backup한다. production seed도 승인 flag와 명시적 DB 확인값을 요구한다.
- env parser·local default·deployment 입력 연결은 `packages/config/env`, 앱별 `.env.example`, `deploy/compose/.env.example`, Compose와 Ansible 검사가 소유한다. test auth는 production parser에서 거부된다.
- image·proxy·release·rollback source는 `deploy/docker/`, `deploy/caddy/caddyfile`, `deploy/compose/compose.yaml`, `.github/workflows/image-release.yml`, `infra/ansible/playbooks/`다.
- Vitest workspace는 test script가 있는 11개 workspace를, coverage는 같은 11개 source를 대상으로 한다. Storybook interaction·a11y는 별도 browser project, Playwright는 기능 E2E와 UI style project를 가진다.
