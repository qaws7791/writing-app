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

const leftChoices = matchDefaults.pairs.map((pair, index) => ({
  id: `left-${index + 1}`,
  text: pair.left,
}))
const rightChoices = matchDefaults.pairs
  .map((pair, index) => ({
    id: `right-${index + 1}`,
    text: pair.right,
  }))
  .reverse()
const correctConnections = matchDefaults.pairs.map((_, index) => ({
  leftChoiceId: `left-${index + 1}`,
  rightChoiceId: `right-${index + 1}`,
  tone: "correct" as const,
}))
const wrongConnections = matchDefaults.pairs.map((_, index, pairs) => ({
  leftChoiceId: `left-${index + 1}`,
  rightChoiceId: `right-${((index + 1) % pairs.length) + 1}`,
  tone: "wrong" as const,
}))

const meta = {
  title: "Components/Lesson/MatchAnswer",
  component: MatchAnswer,
  tags: ["autodocs"],
  args: {
    checked: false,
    connections: [],
    explanation: matchDefaults.explanation,
    guide: matchDefaults.guide,
    leftChoices,
    onChoiceSelect: fn(),
    pendingChoice: null,
    rightChoices,
    title: matchDefaults.title,
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
    leftChoices: {
      ...objectArgType,
      description: "왼쪽에 표시할 선택지입니다.",
    },
    rightChoices: {
      ...objectArgType,
      description: "오른쪽에 표시할 선택지입니다.",
    },
    connections: {
      ...objectArgType,
      description: "현재 연결과 표시 tone입니다.",
    },
    pendingChoice: {
      ...objectArgType,
      description: "다음 짝을 기다리는 선택지입니다.",
    },
    explanation: {
      control: "text",
      description: "채점 후 표시할 해설입니다.",
    },
    checked: checkedArgType,
    onChoiceSelect: createOnChangeArgType(
      "왼쪽 또는 오른쪽 선택지를 누를 때 호출됩니다."
    ),
  },
  decorators: lessonDecorators,
  parameters: lessonParameters,
} satisfies Meta<typeof MatchAnswer>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Controls로 제목·안내·선택지·연결·채점 상태를 조작할 수 있는 Playground입니다.
 */
export const Playground: Story = {}

/**
 * 한쪽 선택지를 눌러 다음 짝을 기다리는 중간 상태입니다.
 */
export const PendingChoice: Story = {
  args: {
    pendingChoice: { id: "left-1", side: "left" },
  },
}

/**
 * 채점 전 연결이 하나 만들어진 상태입니다.
 */
export const Connected: Story = {
  args: {
    connections: [
      { leftChoiceId: "left-1", rightChoiceId: "right-1", tone: "default" },
    ],
  },
}

/**
 * 정답 채점 후 시각 상태입니다.
 */
export const CheckedCorrect: Story = {
  args: {
    checked: "correct",
    connections: correctConnections,
  },
}

/**
 * 오답 채점 후 시각 상태입니다.
 */
export const CheckedWrong: Story = {
  args: {
    checked: "wrong",
    connections: wrongConnections,
  },
}
