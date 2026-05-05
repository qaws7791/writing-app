---
title: 화면 명세
description: 글숨 Labs MVP 화면 명세의 기준과 기존 글필 화면 명세의 replaced 상태를 관리합니다.
status: active
---

## 문서 역할

이 폴더는 화면 단위의 설계 기준을 관리한다. 2026-05-05 피벗 이후 기준 제품은 글숨 Labs이며, 기존 글필의 여정 중심 화면 명세는 현행 기준이 아니다.

## 현행 MVP 화면

MVP에서 구현할 화면은 첫 문장 루프에 필요한 화면으로 제한한다.

| 화면             | 역할                                                          | 상태          |
| ---------------- | ------------------------------------------------------------- | ------------- |
| 홈               | 사진으로 시작, 저장한 재료 이어가기, 짧은 문장 훈련 진입 제공 | active target |
| 사진 글감        | 사진 업로드, 분석 상태, Calm Mode 재료 선택 제공              | active target |
| 재료 바구니      | 선택한 재료 수와 대표 재료 표시, 상세는 사용자 요청 시 열림   | active target |
| 문장 씨앗 조합기 | 재료 3개 이상으로 조합 후보 1~3개 제공                        | active target |
| 한 문장 에디터   | 사용자가 직접 한 문장을 작성하고 저장                         | active target |
| 문체 정원 Lite   | 저장한 표현 카드와 출처 표시                                  | active target |

## replaced 문서

다음 기존 문서는 글필 여정 중심 설계에 묶여 있으므로 현행 기준으로 사용하지 않는다. 이후 구현 단계에서 새 명세로 교체하거나 `docs/99-archive`로 이동한다.

- [[02-design/screens/journey-detail]]
- [[02-design/screens/my-journeys]]
- [[02-design/screens/session-flow]]
- [[02-design/screens/prompt-detail]]
- [[02-design/screens/prompt-sheet]]
- [[02-design/screens/library]]
- [[02-design/screens/writing-detail]]
- [[02-design/screens/writing-entry]]
- [[02-design/screens/editor]]
- [[02-design/screens/home]]
- [[02-design/screens/profile]]

## 작성 기준

- 모바일을 기본 기준으로 쓴다.
- 한 화면의 Primary CTA는 하나로 제한한다.
- 구현 방식과 API는 적지 않는다.
- 상태는 empty, analyzing, ready, collecting, seed_ready, drafting, saved처럼 사용자 행동 기준으로 나눈다.
- 문구는 기능 설명보다 첫 행동을 돕는 방향으로 쓴다.

## 관련 문서

- [[00-prd/v3]]
- [[02-design/information-architecture]]
- [[02-design/design-principles]]
