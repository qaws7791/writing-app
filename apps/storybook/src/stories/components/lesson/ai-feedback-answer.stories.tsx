import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"

import {
  AiFeedbackAnswer,
  type AiFeedbackRequestOutcome,
} from "@workspace/ui/components/lesson/ai-feedback-answer"

import {
  aiFeedbackDefaults,
  aiFeedbackViewModel,
} from "#storybook/stories/components/lesson/mock-data"
import {
  lessonDecorators,
  lessonParameters,
} from "#storybook/stories/components/lesson/lesson-story-shared"

type AiFeedbackStoryArgs = {
  readonly allowRetry: boolean
  readonly draftText: string
  readonly focus: string
  readonly mockOutcome: "error" | "loading" | "success"
  readonly onRequest: () => Promise<AiFeedbackRequestOutcome>
}

function createMockOnRequest(
  mockOutcome: AiFeedbackStoryArgs["mockOutcome"]
): () => Promise<AiFeedbackRequestOutcome> {
  return async () => {
    if (mockOutcome === "loading") {
      await new Promise((resolve) => setTimeout(resolve, 60_000))
      return {
        status: "ok",
        feedback: aiFeedbackViewModel,
      }
    }

    if (mockOutcome === "error") {
      return {
        status: "error",
        message: "AI 코칭 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      }
    }

    return {
      status: "ok",
      feedback: aiFeedbackViewModel,
    }
  }
}

const meta = {
  title: "Components/Lesson/AiFeedbackAnswer",
  component: AiFeedbackAnswer,
  tags: ["autodocs"],
  args: {
    ...aiFeedbackDefaults,
    onRequest: fn(createMockOnRequest("success")),
  },
  argTypes: {
    focus: {
      control: "text",
      description: "코칭 초점 라벨입니다.",
    },
    draftText: {
      control: "text",
      description: "코칭 대상 작성 내용입니다.",
    },
    allowRetry: {
      control: "boolean",
      description: "재시도 버튼을 허용합니다.",
    },
    mockOutcome: {
      control: "select",
      options: ["success", "error", "loading"],
      description: "AI 코칭 요청 mock 결과입니다.",
    },
    onRequest: {
      table: { disable: true },
    },
  },
  decorators: lessonDecorators,
  parameters: lessonParameters,
  render: ({ mockOutcome, onRequest: _onRequest, ...args }) => (
    <AiFeedbackAnswer {...args} onRequest={createMockOnRequest(mockOutcome)} />
  ),
} satisfies Meta<AiFeedbackStoryArgs>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Controls로 초점·작성 내용·재시도·mock 결과를 조작할 수 있는 Playground입니다.
 */
export const Playground: Story = {}

/**
 * 작성 내용이 없을 때의 표시입니다.
 */
export const EmptyDraft: Story = {
  args: {
    draftText: "",
  },
}

/**
 * 재시도가 비활성화된 상태입니다.
 */
export const NoRetry: Story = {
  args: {
    allowRetry: false,
    mockOutcome: "success",
  },
}

/**
 * AI 코칭 결과가 즉시 반환되는 예시입니다. 버튼을 눌러 결과 UI를 확인하세요.
 */
export const WithFeedback: Story = {
  args: {
    mockOutcome: "success",
  },
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector("button")
    button?.click()
  },
}

/**
 * AI 코칭 요청 실패 상태를 확인하는 예시입니다.
 */
export const RequestError: Story = {
  args: {
    mockOutcome: "error",
  },
}
