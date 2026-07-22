import type { Decorator } from "@storybook/react-vite"

import { StoryFrame } from "#storybook/blocks/story-frame"

const CHECKED_OPTIONS = [false, "correct", "wrong"] as const

export const checkedArgType = {
  control: "select" as const,
  options: CHECKED_OPTIONS,
  description: "채점 결과 시각 상태입니다. false는 답안 입력 중입니다.",
}

export const objectArgType = {
  control: "object" as const,
  description: "JSON 형태로 배열·객체 데이터를 편집할 수 있습니다.",
}

export const lessonParameters = {
  layout: "fullscreen" as const,
}

export const lessonDecorators: Decorator[] = [
  (Story) => (
    <StoryFrame variant="reading">
      <Story />
    </StoryFrame>
  ),
]

export function createOnChangeArgType(description: string) {
  return {
    action: "changed",
    description,
  }
}
