import type { Meta, StoryObj } from "@storybook/react-vite"

import { ReadingStepView } from "@workspace/ui/components/lesson/reading-step-view"

import { readingDefaults } from "./mock-data"
import {
  lessonDecorators,
  lessonParameters,
  objectArgType,
} from "./lesson-story-shared"

const meta = {
  title: "Components/Lesson/ReadingStepView",
  component: ReadingStepView,
  tags: ["autodocs"],
  args: {
    ...readingDefaults,
  },
  argTypes: {
    title: {
      control: "text",
      description: "읽기 스텝 제목입니다.",
    },
    guide: {
      control: "text",
      description: "학습자에게 보여줄 안내 문구(마크다운)입니다.",
    },
    body: {
      control: "text",
      description: "본문 콘텐츠(마크다운)입니다.",
    },
    source: {
      control: "text",
      description: "출처 표기입니다. 비우면 숨깁니다.",
    },
  },
  decorators: lessonDecorators,
  parameters: lessonParameters,
} satisfies Meta<typeof ReadingStepView>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Controls로 제목·안내·본문·출처를 조작할 수 있는 Playground입니다.
 */
export const Playground: Story = {}

/**
 * 출처 없이 본문만 표시하는 예시입니다.
 */
export const WithoutSource: Story = {
  args: {
    source: undefined,
  },
}

/**
 * 긴 마크다운 본문을 확인하는 예시입니다.
 */
export const LongBody: Story = {
  args: {
    body: `${readingDefaults.body}\n\n---\n\n**명료성** — 문장이 단 하나의 해석으로 읽히는 정도\n\n- 한 문장에 생각이 하나인가?\n- 없애도 의미가 유지되는 단어가 있는가?\n- 독자가 다르게 해석할 여지가 있는가?`,
  },
  argTypes: {
    body: objectArgType,
  },
}
