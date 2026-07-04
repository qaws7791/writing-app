import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"

import { SelectAnswer } from "@workspace/ui/components/lesson/select-answer"

import { selectDefaults } from "./mock-data"
import {
  checkedArgType,
  createOnChangeArgType,
  lessonDecorators,
  lessonParameters,
  objectArgType,
} from "./lesson-story-shared"

const meta = {
  title: "Components/Lesson/SelectAnswer",
  component: SelectAnswer,
  tags: ["autodocs"],
  args: {
    ...selectDefaults,
    onChange: fn(),
  },
  argTypes: {
    question: {
      control: "text",
      description: "구간 선택 질문입니다.",
    },
    segments: {
      ...objectArgType,
      description: "선택 가능한 텍스트 구간 배열입니다.",
    },
    correctIndexes: {
      ...objectArgType,
      description: "정답 구간 인덱스 배열입니다.",
    },
    layout: {
      control: "select",
      options: [undefined, "block"],
      description: "block이면 세로 블록 레이아웃입니다.",
    },
    explanation: {
      control: "text",
      description: "채점 후 표시할 해설입니다.",
    },
    checked: checkedArgType,
    onChange: createOnChangeArgType("구간 선택이 바뀔 때 호출됩니다."),
  },
  decorators: lessonDecorators,
  parameters: lessonParameters,
} satisfies Meta<typeof SelectAnswer>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Controls로 질문·구간·정답·레이아웃·채점 상태를 조작할 수 있는 Playground입니다.
 */
export const Playground: Story = {
  render: (args) => <SelectAnswer key={args.segments.join("|")} {...args} />,
}

/**
 * 블록 레이아웃 예시입니다.
 */
export const BlockLayout: Story = {
  args: {
    layout: "block",
  },
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
