import type { Meta, StoryObj } from "@storybook/react-vite"

import { Badge } from "@workspace/ui/components/ui/badge"
import { Button } from "@workspace/ui/components/ui/button"
import { Surface } from "@workspace/ui/components/ui/surface"

const variants = ["default", "elevated", "panel"] as const
const sizes = ["none", "sm", "md", "lg"] as const

const meta = {
  title: "Components/UI/Surface",
  component: Surface,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof Surface>

export default meta
type Story = StoryObj<typeof meta>

export const Variants: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-3">
      {variants.map((variant) => (
        <Surface
          className="grid min-h-40 content-between gap-4"
          key={variant}
          variant={variant}
        >
          <div>
            <h2 className="text-title-lg font-black">{variant}</h2>
            <p className="text-body-sm font-semibold text-muted-foreground">
              배경, 테두리, padding은 token으로만 결정한다.
            </p>
          </div>
          <Badge variant="secondary">surface</Badge>
        </Surface>
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-4">
      {sizes.map((size) => (
        <Surface key={size} size={size} variant="panel">
          <h2 className="text-title-md font-black">{size}</h2>
          <p className="text-body-sm font-semibold text-muted-foreground">
            surface padding token
          </p>
        </Surface>
      ))}
    </div>
  ),
}

export const Composition: Story = {
  render: () => (
    <Surface className="grid max-w-xl gap-4" variant="panel">
      <div>
        <h2 className="text-title-lg font-black">검토 요청</h2>
        <p className="text-body-sm font-semibold text-muted-foreground">
          Surface는 의미 없는 카드가 아니라 배경과 경계만 제공한다.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline">취소</Button>
        <Button>보내기</Button>
      </div>
    </Surface>
  ),
}
