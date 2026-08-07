import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"

import { MultipleChoiceAnswer } from "@workspace/ui/components/lesson/multiple-choice-answer"

import { multipleChoiceDefaults } from "#storybook/stories/components/lesson/mock-data"
import {
  checkedArgType,
  createOnChangeArgType,
  lessonDecorators,
  lessonParameters,
  objectArgType,
} from "#storybook/stories/components/lesson/lesson-story-shared"

const meta = {
  title: "Components/Lesson/MultipleChoiceAnswer",
  component: MultipleChoiceAnswer,
  tags: ["autodocs"],
  args: {
    ...multipleChoiceDefaults,
    onSelect: fn(),
  },
  argTypes: {
    question: {
      control: "text",
      description: "객관식 질문입니다.",
    },
    options: {
      ...objectArgType,
      description: "선택지 목록입니다.",
    },
    correctOptionId: {
      control: "text",
      description: "정답 선택지 ID입니다.",
    },
    checked: checkedArgType,
    onSelect: createOnChangeArgType("선택지를 탭할 때 호출됩니다."),
  },
  decorators: lessonDecorators,
  parameters: lessonParameters,
} satisfies Meta<typeof MultipleChoiceAnswer>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Controls로 질문·선택지·정답·채점 상태를 조작할 수 있는 Playground입니다.
 */
export const Playground: Story = {
  tags: ["ci-test"],
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
  tags: ["ci-test"],
  args: {
    checked: "wrong",
  },
}
