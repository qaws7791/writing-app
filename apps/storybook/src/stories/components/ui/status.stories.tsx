import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Callout,
  CalloutContent,
  CalloutTitle,
  Spinner,
} from "@workspace/ui"

const tones = ["neutral", "success", "danger", "info"] as const

const meta = {
  title: "Components/UI/Status",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Alerts: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-4">
      {tones.map((tone) => (
        <Alert key={tone} tone={tone}>
          <AlertTitle>{tone} alert</AlertTitle>
          <AlertDescription>
            작업 결과나 현재 상태를 짧게 알릴 때 사용한다.
          </AlertDescription>
        </Alert>
      ))}
    </div>
  ),
}

export const Callouts: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-4">
      {tones.map((tone) => (
        <Callout aria-label={`${tone} 안내`} key={tone} tone={tone}>
          <CalloutTitle>{tone} callout</CalloutTitle>
          <CalloutContent>
            본문 흐름 안에서 주의, 성공, 정보, 위험 맥락을 강조한다.
          </CalloutContent>
        </Callout>
      ))}
    </div>
  ),
}

export const LoadingStates: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-5">
      <div className="flex items-center gap-2">
        <Spinner aria-label="불러오는 중" />
        <span className="text-body-sm font-medium">불러오는 중</span>
      </div>
      <Button disabled>
        <Spinner aria-hidden="true" className="size-3" />
        저장 중
      </Button>
      <Button variant="outline">
        <Spinner aria-hidden="true" className="size-3" />
        동기화
      </Button>
    </div>
  ),
}
