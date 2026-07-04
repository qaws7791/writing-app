import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"

import { CategorizeAnswer } from "@workspace/ui/components/lesson/categorize-answer"

import { categorizeDefaults } from "./mock-data"
import {
  checkedArgType,
  createOnChangeArgType,
  lessonDecorators,
  lessonParameters,
  objectArgType,
} from "./lesson-story-shared"

const meta = {
  title: "Components/Lesson/CategorizeAnswer",
  component: CategorizeAnswer,
  tags: ["autodocs"],
  args: {
    ...categorizeDefaults,
    onChange: fn(),
  },
  argTypes: {
    title: {
      control: "text",
      description: "분류 스텝 제목입니다.",
    },
    guide: {
      control: "text",
      description: "안내 문구(마크다운)입니다.",
    },
    categories: {
      ...objectArgType,
      description: "분류 카테고리 목록입니다.",
    },
    items: {
      ...objectArgType,
      description: "분류할 항목 목록입니다.",
    },
    explanation: {
      control: "text",
      description: "채점 후 표시할 해설입니다.",
    },
    checked: checkedArgType,
    onChange: createOnChangeArgType("항목 분류가 바뀔 때 호출됩니다."),
  },
  decorators: lessonDecorators,
  parameters: lessonParameters,
} satisfies Meta<typeof CategorizeAnswer>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Controls로 제목·카테고리·항목·채점 상태를 조작할 수 있는 Playground입니다.
 */
export const Playground: Story = {
  render: (args) => (
    <CategorizeAnswer
      key={`${args.items.map((item) => item.id).join(",")}-${args.categories.map((category) => category.id).join(",")}`}
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
