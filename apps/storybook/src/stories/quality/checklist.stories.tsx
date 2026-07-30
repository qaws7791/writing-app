import type { ReactNode } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "@workspace/ui/components/ui/button"

const meta = {
  title: "Quality/Checklist",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function DoDont({
  doExample,
  dontExample,
}: {
  readonly doExample: ReactNode
  readonly dontExample: ReactNode
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="grid gap-3 rounded-panel border border-success-fg/25 bg-surface p-surface-padding-md text-foreground">
        <h3 className="text-title-md font-black text-success-foreground">Do</h3>
        {doExample}
      </section>
      <section className="grid gap-3 rounded-panel border border-danger-fg/25 bg-surface p-surface-padding-md text-foreground">
        <h3 className="text-title-md font-black text-danger-foreground">
          Do not
        </h3>
        {dontExample}
      </section>
    </div>
  )
}

export const ContentContracts: Story = {
  render: () => (
    <DoDont
      doExample={
        <div className="grid gap-3">
          <Button>저장</Button>
          <p className="text-body-sm font-semibold">
            동사는 짧게 쓰고 결과를 예측할 수 있게 한다.
          </p>
        </div>
      }
      dontExample={
        <div className="grid gap-3">
          <Button>확인</Button>
          <p className="text-body-sm font-semibold">
            같은 화면에서 확인, 적용, 완료를 섞어 쓰지 않는다.
          </p>
        </div>
      }
    />
  ),
}
