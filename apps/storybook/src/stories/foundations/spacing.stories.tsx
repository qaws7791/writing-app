import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button, Input, Surface } from "@workspace/ui"

const spacingTokens = [
  { className: "w-1", label: "1", token: "spacing-1" },
  { className: "w-2", label: "2", token: "spacing-2" },
  { className: "w-3", label: "3", token: "spacing-3" },
  { className: "w-4", label: "4", token: "spacing-4" },
  { className: "w-6", label: "6", token: "spacing-6" },
  { className: "w-8", label: "8", token: "spacing-8" },
  { className: "w-10", label: "10", token: "spacing-10" },
  { className: "w-12", label: "12", token: "spacing-12" },
] as const

const meta = {
  title: "Foundations/Spacing",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Scale: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-3">
      {spacingTokens.map((item) => (
        <div
          className="grid grid-cols-[7rem_1fr] items-center gap-4"
          key={item.token}
        >
          <span className="text-label-sm font-bold text-fg-muted">
            {item.token}
          </span>
          <div className="flex items-center gap-3">
            <span
              className={`${item.className} block h-6 bg-action-primary-bg`}
            />
            <span className="text-caption font-bold text-fg-subtle">
              {item.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  ),
}

export const DensityComparison: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      {(["comfortable", "compact"] as const).map((density) => (
        <Surface
          className="grid gap-4"
          data-density={density}
          key={density}
          variant="panel"
        >
          <div>
            <h2 className="text-title-lg font-black">{density}</h2>
            <p className="text-body-sm font-medium text-fg-muted">
              control과 surface 토큰이 같은 구성의 공간감을 바꾼다.
            </p>
          </div>
          <Input aria-label={`${density} 검색`} placeholder="코스 검색" />
          <div className="flex flex-wrap gap-2">
            <Button>저장</Button>
            <Button variant="outline">취소</Button>
          </div>
        </Surface>
      ))}
    </div>
  ),
}
