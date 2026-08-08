# Luma UI 전환 ledger

## 사용 기준

각 변경 단위는 이 표의 상태와 남은 소비자 수를 갱신해야 한다.

`완료` 상태는 관련 자동 검증과 수동 검증이 모두 통과한 경우에만 사용한다.

## 변경 단위

| 변경 단위                  | 상태      | 완료 조건                                              |
| -------------------------- | --------- | ------------------------------------------------------ |
| 0. 출처와 기준선           | 완료      | provenance, license, allowlist와 기준선 기록 완료      |
| 1. 디자인 기반             | 완료      | Luma token과 theme 적용 및 Foundation story 검증 완료  |
| 2-A. 정적 primitive        | 완료      | 대상 API와 모든 소비자 이전 완료                       |
| 2-B. interactive primitive | 완료      | overlay, menu와 selection 소비자 이전 완료             |
| 2-C. data display와 icon   | 완료      | Hugeicons 이전과 bundle 검증 완료                      |
| 3-A. 공통 shell과 인증     | 완료      | `SCR-001`, `SCR-002`, `SCR-101` 검증 완료              |
| 3-B. 일반 learner 화면     | 완료      | `SCR-003`, `SCR-004`, `SCR-005`, `SCR-007` 검증 완료   |
| 4-A. 학습 shell            | 완료      | reading, compare와 lesson shell 검증 완료              |
| 4-B. 선택형 학습           | 완료      | choice, token과 segment 검증 완료                      |
| 4-C. 이동형 학습           | 완료      | sortable, pair와 classify keyboard 검증 완료           |
| 4-D. 서술형 학습           | 완료      | compose, coaching과 admin preview 검증 완료            |
| 5. 집중형 글쓰기           | 완료      | `SCR-008`부터 `SCR-010`까지 검증 완료                  |
| 6-A. 관리자 shell          | 완료      | shell과 dashboard 검증 완료                            |
| 6-B. course 관리           | 완료      | course list, detail과 curriculum 검증 완료             |
| 6-C. learner 관리          | 완료      | learner list와 detail 검증 완료                        |
| 6-D. 관리자 관찰 화면      | 완료      | analytics와 audit 검증 완료                            |
| 7. 제거와 확정             | 검증 제한 | legacy 소비자 제거 완료, 기존 gate 장애 해소 대기      |
| 8. 전체 upstream 이관      | 완료      | tracked source, Astro, registry, 문서와 공유 UI 동기화 |

## 제거 ledger

| 대상                                 | 기준선 | 현재 | 제거 조건            |
| ------------------------------------ | -----: | ---: | -------------------- |
| legacy style 소비 파일               |     91 |    0 | source 검색 결과 0   |
| `lucide-react` source import 파일    |     22 |    0 | source 검색 결과 0   |
| `lucide-react` package 선언          |      5 |    0 | manifest 검색 결과 0 |
| 앱 source의 `#ui/*` import           |      0 |    0 | source 검색 결과 0   |
| 예제 block product import            |      0 |    0 | 항상 0 유지          |
| legacy Button API 소비 파일          |     15 |    0 | source 검색 결과 0   |
| `CardTitle as` 소비 파일             |      4 |    0 | source 검색 결과 0   |
| `Badge tone` 소비 파일               |      2 |    0 | source 검색 결과 0   |
| legacy SelectTrigger API 소비 파일   |      9 |    0 | source 검색 결과 0   |
| `items` 없는 Select 소비 파일        |      4 |    0 | source 검색 결과 0   |
| legacy Progress style prop 소비 파일 |      3 |    0 | source 검색 결과 0   |

앱 build adapter의 `#ui/*` mapping 3개는 source 상태의 공유 UI 내부 import를 해석한다. 앱 source는 이 mapping을 소비하지 않는다.

0단계부터 6단계까지의 관련 구현과 검증은 완료했다.

7단계의 legacy 제거와 문서 확정은 완료했다.

최종 root gate는 기존 audit 예외 만료와 Windows standalone symlink 권한 때문에 제한된다.

대상 UI의 Git 추적 파일 355개와 Markdown 13개를 `apps/ui`에 이관했다.

Registry UI 115개, block item 20개, block source 23개와 hook 1개를 모두 이관했다.

공유 UI에서 누락된 registry UI와 block source는 0개다.

필수 root gate의 기존 장애는 [`baseline.md`](./baseline.md)에 기록한다.

## 재현 명령

```sh
rg -l "@workspace/ui/" apps packages --glob "*.{ts,tsx,mdx}"
rg -l "lucide-react" apps packages --glob "*.{ts,tsx}"
rg -n '"lucide-react"' --glob "package.json"
rg -n '#ui/' apps --glob "*.{ts,tsx}"
rg -n 'size=.extra.|size: .extra.|variant=.ink.|variant: .ink.' apps packages --glob "*.{ts,tsx,mdx}"
rg -n -U '<CardTitle[\\s\\S]{0,120}?\\bas=|<Badge[\\s\\S]{0,120}?\\btone=' apps packages --glob "*.{ts,tsx,mdx}"
rg -n -U 'SelectTrigger[\\s\\S]{0,180}variant=|selectTriggerVariants' apps packages --glob "*.{ts,tsx,mdx}"
rg -n -U -P '(?s)<Select\\b(?:(?!>).)*>' apps packages --glob "*.tsx"
rg -n 'indicatorClassName|trackClassName' apps packages --glob "*.{ts,tsx}"
bun run check:route-bundles
```
