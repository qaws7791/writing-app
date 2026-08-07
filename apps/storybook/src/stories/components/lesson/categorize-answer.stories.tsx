import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"

import { CategorizeAnswer } from "@workspace/ui/components/lesson/categorize-answer"

import { categorizeDefaults } from "#storybook/stories/components/lesson/mock-data"
import {
  checkedArgType,
  createOnChangeArgType,
  lessonDecorators,
  lessonParameters,
  objectArgType,
} from "#storybook/stories/components/lesson/lesson-story-shared"

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
  tags: ["ci-test"],
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

/**
 * 긴 태그 라벨과 좁은 모바일 폭에서 분류된 항목 레이아웃입니다.
 */
export const NarrowWithLongTags: Story = {
  decorators: [
    (Story) => (
      <div className="mx-auto w-[320px] rounded-3xl border border-border p-4">
        <Story />
      </div>
    ),
    ...lessonDecorators,
  ],
  args: {
    categories: [
      { id: "A", label: "주제문 (핵심 주장)" },
      { id: "B", label: "뒷받침 문장 (근거·설명)" },
      { id: "C", label: "구체적 예시 (사례)" },
    ],
    checked: "correct",
    defaultPlacements: {
      i1: "A",
      i2: "B",
      i3: "C",
    },
    items: [
      {
        categoryId: "A",
        id: "i1",
        text: "꾸준한 글쓰기는 사고를 정돈한다.",
      },
      {
        categoryId: "B",
        id: "i2",
        text: "매일 쓰는 사람은 자기 생각을 더 명확히 표현한다.",
      },
      {
        categoryId: "C",
        id: "i3",
        text: "예컨대 일기를 3년 쓴 이는 회의에서도 핵심을 빠르게 짚는다.",
      },
    ],
  },
}
