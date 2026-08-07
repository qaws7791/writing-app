import type { Meta, StoryObj } from "@storybook/react-vite"
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  AlertAction,
} from "@workspace/ui/components/ui/alert"
import { Button } from "@workspace/ui/components/ui/button"

const meta = {
  title: "Components/UI/Alert",
  component: Alert,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="w-[min(32rem,calc(100vw-2rem))]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const WithAction: Story = {
  render: () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>알림 업데이트</AlertTitle>
      <AlertDescription>
        새로운 소프트웨어 업데이트를 사용할 수 있습니다. 지금 설치하시겠습니까?
      </AlertDescription>
      <AlertAction>
        <Button variant="outline" size="sm">
          업데이트
        </Button>
      </AlertAction>
    </Alert>
  ),
}

export const Tones: Story = {
  tags: ["ci-test"],
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert tone="neutral">
        <Info className="h-4 w-4" />
        <AlertTitle>Neutral Tone</AlertTitle>
        <AlertDescription>
          이것은 중립적인 톤의 안내 메시지입니다.
        </AlertDescription>
      </Alert>

      <Alert tone="info">
        <Info className="h-4 w-4" />
        <AlertTitle>Info Tone</AlertTitle>
        <AlertDescription>정보를 제공하는 안내 메시지입니다.</AlertDescription>
      </Alert>

      <Alert tone="success">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Success Tone</AlertTitle>
        <AlertDescription>
          작업이 성공적으로 완료되었음을 나타냅니다.
        </AlertDescription>
      </Alert>

      <Alert tone="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Warning Tone (Destructive variant)</AlertTitle>
        <AlertDescription>
          주의가 필요한 경고 상황을 사용자에게 알립니다.
        </AlertDescription>
      </Alert>

      <Alert tone="danger">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Danger Tone (Destructive variant)</AlertTitle>
        <AlertDescription>
          위험하거나 오류가 발생한 상태를 나타냅니다.
        </AlertDescription>
      </Alert>
    </div>
  ),
}

export const Simple: Story = {
  render: () => (
    <Alert>
      <AlertDescription>
        별도의 제목 없이 설명으로만 구성된 단순한 형태의 알림 창입니다.
      </AlertDescription>
    </Alert>
  ),
}
