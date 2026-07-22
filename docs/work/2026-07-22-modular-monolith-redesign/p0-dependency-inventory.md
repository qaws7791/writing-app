# P0 workspace와 dependency inventory

## Workspace

기준 commit에는 앱 4개와 flat package 10개가 있었다.

- 앱: `@workspace/admin`, `@workspace/api`, `@workspace/storybook`, `@workspace/web`
- package: `@workspace/auth`, `@workspace/config`, `@workspace/contracts`, `@workspace/core`, `@workspace/db`, `@workspace/env`, `@workspace/http-client`, `@workspace/repository-tooling`, `@workspace/resource-document`, `@workspace/ui`

기준 root manifest는 `apps/*`, `packages/*`, `bun@1.3.10`, Node.js `24.x`, exact catalog와 root task를 소유했다. P1 완료 상태는 config 3개를 분리하고 custom tooling package를 제거해 여전히 14개 workspace이며, 최종 앱 4개·package 24개 목록은 `scripts/fixtures/target-workspace-inventory.json`이 고정한다.

`scripts/workspace-inventory.test.ts`는 중복 name, manifest 누락, generated-only directory와 2단계 target glob을 검증한다. 각 workspace의 export, private import alias와 direct dependency의 현재 exact 목록은 manifest가 소유하고 `check:workspace-inventory`, `check:workspace-dependency-versions`, `check:package-interfaces`가 drift를 거부한다.

## 내부 graph

P1 완료 source를 workspace별 TypeScript config로 분석한 결과다. test를 포함한 runtime import와 type-only import를 분리했으며 두 목록에 함께 있는 edge는 소비 위치에 두 종류가 모두 있다는 뜻이다.

| source    | runtime target                                                          | type-only target                 |
| --------- | ----------------------------------------------------------------------- | -------------------------------- |
| admin     | auth, contracts, env, http-client, nextjs-config, resource-document, ui | contracts, http-client           |
| api       | auth, contracts, core, db, env                                          | auth, contracts, core, db        |
| auth      | contracts, core, db                                                     | core                             |
| core      | contracts, resource-document                                            | contracts, resource-document     |
| db        | contracts                                                               | 없음                             |
| storybook | ui                                                                      | ui                               |
| web       | auth, contracts, env, http-client, nextjs-config, ui                    | auth, contracts, http-client, ui |

config 세 package, contracts, env, http-client, resource-document과 ui에서 다른 내부 workspace로 향하는 edge는 표에 적힌 경우 외에는 없다. dependency-cruiser 결과의 runtime cycle은 0이며 type-only edge는 runtime cycle 판정에서 제외한다.

## 공개 표면과 consumer

| owner             | 공개 표면의 권위 source                                                           | 내부 consumer                   |
| ----------------- | --------------------------------------------------------------------------------- | ------------------------------- |
| auth              | `packages/auth/package.json`의 learner/admin client·server와 좁은 utility subpath | api, web, admin                 |
| env               | `packages/config/env/package.json`의 parser와 local default                       | api, web, admin                 |
| nextjs-config     | `packages/config/nextjs-config/package.json`의 CSP·header subpath                 | web, admin                      |
| typescript-config | 세 JSON export                                                                    | TypeScript workspace            |
| contracts         | context별 manifest subpath                                                        | api, auth, core, db, web, admin |
| core              | 여섯 capability facade와 `scripts/fixtures/core-capability-public-surface.json`   | api, auth                       |
| db                | client, schema, migration, seed, backup subpath                                   | api와 auth test·adapter         |
| http-client       | root transport Interface                                                          | web, admin                      |
| resource-document | codec·validation·Lexical node subpath                                             | core, admin                     |
| ui                | primitive·lesson·style subpath                                                    | web, admin, Storybook           |

정확한 symbol과 consumer edge는 manifest, source import와 fixture가 소유한다. 이 표는 탐색용 snapshot이며 새 public API의 권위 소스가 아니다.
