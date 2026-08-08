# Upstream 전체 이관 기록

## 기준

- 저장소: `qaws7791/ui`
- commit: `010ddc4421d0d2875c858f3cec69a4a93dbf2f28`
- 이관일: 2026-08-09
- Git 추적 파일: 355개
- Markdown 파일: 13개

원본 Git 추적 파일은 `.git` metadata를 제외하고 모두 `apps/ui`에 이관했습니다.

## 통합 매핑

| 원본            | 통합 위치                    | 처리                          |
| --------------- | ---------------------------- | ----------------------------- |
| 일반 추적 파일  | 같은 상대 경로               | Astro 앱 source로 사용        |
| `bun.lock`      | `upstream-bun.lock.snapshot` | root lockfile만 활성화        |
| `.oxfmtrc.json` | `upstream-oxfmtrc.snapshot`  | root Oxfmt 설정만 활성화      |
| `package.json`  | `upstream-package.snapshot`  | 원본 manifest 보존            |
| `package.json`  | `package.json`               | workspace 이름과 catalog 적용 |

`public/r`은 통합된 source와 lockfile로 registry build를 실행한 결과를 사용합니다.

텍스트 source는 root Git 계약에 맞춰 LF로 정규화했습니다.

## Registry 범위

`registry/luma/registry.json`의 모든 `registry:ui`, `registry:block`, `registry:hook`,
`registry:lib` 항목을 포함합니다.

Registry가 참조하는 block helper source도 모두 포함합니다.

전체 UI source는 `packages/shared/ui/src/components/ui`에도 같은 이름으로 존재합니다.

전체 block source는 `packages/shared/ui/src/blocks`에도 같은 이름으로 존재합니다.

`use-mobile`은 `packages/shared/ui/src/hooks/use-mobile.ts`에도 존재합니다.

## 검증

다음 검증을 통과해야 이관이 완료됩니다.

```bash
bun --filter @workspace/ui-registry lint
bun --filter @workspace/ui-registry check
bun --filter @workspace/ui-registry build
bun --filter @workspace/ui lint
bun --filter @workspace/ui typecheck
```
