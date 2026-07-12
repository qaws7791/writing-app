import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"

import { FillBlankAnswer } from "@workspace/ui/components/lesson/fill-blank-answer"

import { fillBlankDefaults } from "#storybook/stories/components/lesson/mock-data"
import {
  checkedArgType,
  createOnChangeArgType,
  lessonDecorators,
  lessonParameters,
  objectArgType,
} from "#storybook/stories/components/lesson/lesson-story-shared"

const meta = {
  title: "Components/Lesson/FillBlankAnswer",
  component: FillBlankAnswer,
  tags: ["autodocs"],
  args: {
    ...fillBlankDefaults,
    onChange: fn(),
  },
  argTypes: {
    template: {
      control: "text",
      description: "빈칸이 `___`로 표시된 문장 템플릿입니다.",
    },
    words: {
      ...objectArgType,
      description: "선택 가능한 단어 목록입니다.",
    },
    blankCount: {
      control: { type: "number", min: 1, max: 5 },
      description: "빈칸 개수입니다.",
    },
    checked: checkedArgType,
    onChange: createOnChangeArgType("빈칸 선택이 바뀔 때 호출됩니다."),
  },
  decorators: lessonDecorators,
  parameters: lessonParameters,
} satisfies Meta<typeof FillBlankAnswer>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Controls로 템플릿·단어·빈칸 수·채점 상태를 조작할 수 있는 Playground입니다.
 */
export const Playground: Story = {
  render: (args) => (
    <FillBlankAnswer
      key={`${args.template}-${args.blankCount}-${args.words.join(",")}`}
      {...args}
    />
  ),
}

/**
 * 정답 채점 후 시각 상태입니다.
 */
export const CheckedCorrect: Story = {
  args: {
    checked: "correct",
  },
}

/**
 * 오답 채점 후 시각 상태입니다.
 */
export const CheckedWrong: Story = {
  args: {
    checked: "wrong",
  },
}
