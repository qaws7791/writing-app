import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "@workspace/ui/components/ui/button"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui/components/ui/progress"
import { Surface } from "@workspace/ui/components/ui/surface"

const meta = {
  title: "Foundations/Motion",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const MotionPreference: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      {(["full", "reduced"] as const).map((motion) => (
        <Surface
          className="grid gap-4"
          data-motion={motion}
          key={motion}
          variant="panel"
        >
          <div>
            <h2 className="text-title-lg font-black">{motion}</h2>
            <p className="text-body-sm font-medium text-muted-foreground">
              toolbar의 motion global과 같은 data 속성을 사용한다.
            </p>
          </div>
          <Button>전환 확인</Button>
          <Progress value={68}>
            <ProgressLabel>작성 루틴</ProgressLabel>
            <ProgressValue />
          </Progress>
        </Surface>
      ))}
    </div>
  ),
}
