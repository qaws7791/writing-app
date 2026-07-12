import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"

import { MatchAnswer } from "@workspace/ui/components/lesson/match-answer"

import { matchDefaults } from "#storybook/stories/components/lesson/mock-data"
import {
  checkedArgType,
  createOnChangeArgType,
  lessonDecorators,
  lessonParameters,
  objectArgType,
} from "#storybook/stories/components/lesson/lesson-story-shared"

const meta = {
  title: "Components/Lesson/MatchAnswer",
  component: MatchAnswer,
  tags: ["autodocs"],
  args: {
    ...matchDefaults,
    onChange: fn(),
  },
  argTypes: {
    title: {
      control: "text",
      description: "매칭 스텝 제목입니다.",
    },
    guide: {
      control: "text",
      description: "안내 문구(마크다운)입니다.",
    },
    pairs: {
      ...objectArgType,
      description: "왼쪽·오른쪽 짝 목록입니다.",
    },
    explanation: {
      control: "text",
      description: "채점 후 표시할 해설입니다.",
    },
    checked: checkedArgType,
    onChange: createOnChangeArgType("짝이 맞춰질 때 호출됩니다."),
  },
  decorators: lessonDecorators,
  parameters: lessonParameters,
} satisfies Meta<typeof MatchAnswer>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Controls로 제목·안내·짝 목록·채점 상태를 조작할 수 있는 Playground입니다.
 */
export const Playground: Story = {
  render: (args) => (
    <MatchAnswer
      key={args.pairs.map((pair) => `${pair.left}-${pair.right}`).join("|")}
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
