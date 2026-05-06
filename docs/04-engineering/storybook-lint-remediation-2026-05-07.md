---
title: Storybook lint remediation 2026-05-07
description: pre-push 단계에서 storybook lint가 실패한 원인과 조치 현황을 기록합니다.
---

# Storybook lint remediation 2026-05-07

## 상태

- 진행 상태: 완료
- 시작일: 2026-05-07
- 범위: `apps/storybook` ESLint 실패 원인 확인 및 최소 수정

## 원인

`git push origin master:master` 과정에서 실행된 push 검증이 `apps/storybook`의 `bun run lint` 실패로 중단되었습니다.

초기 재현 결과, 실패 원인은 Storybook story 파일의 미사용 import입니다.

## 조치

다음 Storybook story 파일에서 사용하지 않는 import만 제거했습니다.

- `apps/storybook/src/stories/components/collapsible.stories.tsx`
- `apps/storybook/src/stories/components/dialog.stories.tsx`
- `apps/storybook/src/stories/components/field.stories.tsx`
- `apps/storybook/src/stories/components/input-group.stories.tsx`
- `apps/storybook/src/stories/components/item.stories.tsx`
- `apps/storybook/src/stories/components/toggle.stories.tsx`

## 검증 결과

- `apps/storybook`에서 `bun run lint` 통과
- `bun lefthook run pre-push` 통과
- `@workspace/core` lint에서 coverage 생성물의 unused eslint-disable warning 3건이 출력되지만, 에러가 아니므로 push 훅은 통과합니다.
