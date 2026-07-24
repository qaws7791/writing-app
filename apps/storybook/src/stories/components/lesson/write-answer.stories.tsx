import type { Meta, StoryObj } from "@storybook/react-vite"
import { useState, type ComponentProps } from "react"
import { fn } from "storybook/test"

import { WriteAnswer } from "@workspace/ui/components/lesson/write-answer"

import { writeDefaults } from "#storybook/stories/components/lesson/mock-data"
import {
  checkedArgType,
  createOnChangeArgType,
  lessonDecorators,
  lessonParameters,
} from "#storybook/stories/components/lesson/lesson-story-shared"

const meta = {
  title: "Components/Lesson/WriteAnswer",
  component: WriteAnswer,
  tags: ["autodocs"],
  args: {
    ...writeDefaults,
    onChange: fn(),
    text: "",
  },
  argTypes: {
    title: {
      control: "text",
      description: "쓰기 스텝 제목입니다.",
    },
    badge: {
      control: "text",
      description: "제목 아래 배지 텍스트입니다.",
    },
    guide: {
      control: "text",
      description: "안내 문구(마크다운)입니다.",
    },
    reference: {
      control: "text",
      description: "참고 원문입니다.",
    },
    structure: {
      control: "text",
      description: "구조 가이드입니다.",
    },
    claim: {
      control: "text",
      description: "대상 주장 텍스트입니다.",
    },
    claimLabel: {
      control: "text",
      description: "주장 영역 라벨입니다.",
    },
    min: {
      control: { type: "number", min: 1 },
      description: "최소 글자 수입니다.",
    },
    max: {
      control: { type: "number", min: 10 },
      description: "최대 글자 수입니다.",
    },
    goal: {
      control: { type: "number", min: 1 },
      description: "목표 글자 수입니다.",
    },
    placeholder: {
      control: "text",
      description: "입력창 placeholder입니다.",
    },
    sample: {
      control: "text",
      description: "채점 후 참조 답안입니다.",
    },
    text: {
      control: "text",
      description: "현재 입력 본문입니다.",
    },
    checked: checkedArgType,
    onChange: createOnChangeArgType("본문이 바뀔 때 호출됩니다."),
  },
  decorators: lessonDecorators,
  parameters: lessonParameters,
  render: (args) => <ControlledWriteAnswer key={args.text} {...args} />,
} satisfies Meta<typeof WriteAnswer>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Controls로 제목·안내·참고문·글자 수 제한·채점 상태를 조작할 수 있는 Playground입니다.
 */
export const Playground: Story = {}

/**
 * 주장·반박 모드 예시입니다.
 */
export const WithClaim: Story = {
  args: {
    title: "반박 쓰기",
    badge: "반박 쓰기",
    claim: "꾸준한 글쓰기는 사고를 정돈한다.",
    claimLabel: "대상 주장",
    goal: 100,
    reference: undefined,
    sample: undefined,
  },
}

/**
 * 채점 후 참조 답안이 표시되는 상태입니다.
 */
export const CheckedWithSample: Story = {
  args: {
    checked: "correct",
  },
}

function ControlledWriteAnswer(args: ComponentProps<typeof WriteAnswer>) {
  const [text, setText] = useState(args.text)

  return (
    <WriteAnswer
      {...args}
      onChange={(nextText) => {
        setText(nextText)
        args.onChange?.(nextText)
      }}
      text={text}
    />
  )
}
