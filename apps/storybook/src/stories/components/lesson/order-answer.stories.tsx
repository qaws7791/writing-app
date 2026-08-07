import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"

import { OrderAnswer } from "@workspace/ui/components/lesson/order-answer"

import { orderDefaults } from "#storybook/stories/components/lesson/mock-data"
import {
  checkedArgType,
  createOnChangeArgType,
  lessonDecorators,
  lessonParameters,
  objectArgType,
} from "#storybook/stories/components/lesson/lesson-story-shared"

const meta = {
  title: "Components/Lesson/OrderAnswer",
  component: OrderAnswer,
  tags: ["autodocs"],
  args: {
    ...orderDefaults,
    onChange: fn(),
  },
  argTypes: {
    items: {
      ...objectArgType,
      description: "정렬할 항목 목록입니다.",
    },
    correctItemIds: {
      ...objectArgType,
      description: "stable ID 기준 정답 순서입니다.",
    },
    showNumbers: {
      control: "boolean",
      description: "항목 앞에 순번을 표시합니다.",
    },
    explanation: {
      control: "text",
      description: "채점 후 표시할 해설입니다.",
    },
    checked: checkedArgType,
    onChange: createOnChangeArgType("순서가 바뀔 때 호출됩니다."),
  },
  decorators: lessonDecorators,
  parameters: lessonParameters,
} satisfies Meta<typeof OrderAnswer>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Controls로 항목·정답 순서·번호 표시·채점 상태를 조작할 수 있는 Playground입니다.
 */
export const Playground: Story = {
  tags: ["ci-test"],
  render: (args) => (
    <OrderAnswer key={args.items.map((item) => item.id).join("|")} {...args} />
  ),
}

/**
 * 순번 없이 표시하는 예시입니다.
 */
export const WithoutNumbers: Story = {
  args: {
    showNumbers: false,
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
  tags: ["ci-test"],
  args: {
    checked: "wrong",
  },
}
