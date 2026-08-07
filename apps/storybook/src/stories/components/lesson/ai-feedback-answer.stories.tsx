import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"

import {
  AiFeedbackAnswer,
  type AiFeedbackContinueOutcome,
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
  readonly mockOutcome: "error" | "limit" | "quota" | "success"
  readonly onContinueWithoutFeedback: () => Promise<AiFeedbackContinueOutcome>
  readonly onRequest: () => Promise<AiFeedbackRequestOutcome>
}

function createMockOnRequest(
  mockOutcome: AiFeedbackStoryArgs["mockOutcome"]
): () => Promise<AiFeedbackRequestOutcome> {
  return async () => {
    if (mockOutcome === "error") {
      return {
        kind: "retryable",
        message: "AI 코칭 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        status: "error",
      }
    }

    if (mockOutcome === "quota") {
      return {
        kind: "quota",
        message: "오늘의 AI 코칭 요청 한도를 모두 사용했습니다.",
        retryAfterSeconds: 3_600,
        status: "error",
      }
    }

    if (mockOutcome === "limit") {
      return {
        kind: "limit",
        message: "이 단계의 AI 코칭 3회를 모두 사용했습니다.",
        status: "error",
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
    onContinueWithoutFeedback: fn(
      async (): Promise<AiFeedbackContinueOutcome> => ({ status: "ok" })
    ),
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
      options: ["success", "error", "quota", "limit"],
      description: "AI 코칭 요청 mock 결과입니다.",
    },
    onRequest: {
      table: { disable: true },
    },
    onContinueWithoutFeedback: {
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
export const Playground: Story = {
  tags: ["ci-test"],
}

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
}

/**
 * AI 코칭 요청 실패 상태를 확인하는 예시입니다. 버튼을 눌러 결과 UI를 확인하세요.
 */
export const RequestError: Story = {
  tags: ["ci-test"],
  args: {
    mockOutcome: "error",
  },
}

/**
 * 일일 요청 한도와 서울 시간 기준 재시도 안내를 확인하는 예시입니다. 버튼을 눌러
 * 결과 UI를 확인하세요.
 */
export const DailyQuota: Story = {
  tags: ["ci-test"],
  args: {
    mockOutcome: "quota",
  },
}

/**
 * 한 스텝에서 성공한 AI 코칭 3회를 모두 사용한 영구 한도 예시입니다. 버튼을 눌러
 * 결과 UI를 확인하세요.
 */
export const AttemptLimit: Story = {
  args: {
    mockOutcome: "limit",
  },
}
