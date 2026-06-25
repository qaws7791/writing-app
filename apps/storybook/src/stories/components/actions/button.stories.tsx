import type { Meta, StoryObj } from "@storybook/react-vite"
import { Mail, Save, Trash2 } from "lucide-react"
import { expect, fn, userEvent, within } from "storybook/test"

import { Button } from "@workspace/ui"

const variants = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "destructive",
  "link",
] as const

const sizes = ["xs", "sm", "default", "lg", "icon", "icon-sm"] as const

const meta = {
  title: "Components/Actions/Button",
  component: Button,
  args: {
    children: "저장",
    onClick: fn(),
  },
  argTypes: {
    size: {
      control: "select",
      options: sizes,
    },
    variant: {
      control: "select",
      options: variants,
    },
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {variants.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      {sizes.map((size) => (
        <Button aria-label={size} key={size} size={size}>
          {size.startsWith("icon") ? <Save aria-hidden="true" /> : size}
        </Button>
      ))}
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>기본</Button>
      <Button disabled>비활성</Button>
      <Button aria-invalid="true" variant="outline">
        오류
      </Button>
      <Button variant="destructive">
        <Trash2 data-icon="inline-start" />
        삭제
      </Button>
    </div>
  ),
}

export const ContentAndIcons: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <Mail data-icon="inline-start" />
        초대 보내기
      </Button>
      <Button variant="outline">
        저장
        <Save data-icon="inline-end" />
      </Button>
      <Button aria-label="메일 보내기" size="icon">
        <Mail aria-hidden="true" />
      </Button>
    </div>
  ),
}

export const Interaction: Story = {
  args: {
    children: "클릭 확인",
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole("button", { name: "클릭 확인" }))
    await expect(args.onClick).toHaveBeenCalled()
  },
}

export const DensityComparison: Story = {
  render: () => (
    <div className="grid gap-4 md:grid-cols-2">
      {(["comfortable", "compact"] as const).map((density) => (
        <div
          className="flex flex-wrap items-center gap-2 rounded-panel border border-border-subtle bg-bg-surface p-surface-padding-md"
          data-density={density}
          key={density}
        >
          <Button>{density}</Button>
          <Button size="sm" variant="outline">
            보조
          </Button>
        </div>
      ))}
    </div>
  ),
}
