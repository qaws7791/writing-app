import type { Meta, StoryObj } from "@storybook/react-vite"

import { Separator } from "@workspace/ui/components/separator"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Separator",
  component: Separator,
  parameters: shadcnParameters("separator"),
} satisfies Meta<typeof Separator>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Overview</span>
        <Separator orientation="vertical" className="h-5" />
        <span className="text-sm text-muted-foreground">Revision history</span>
        <Separator orientation="vertical" className="h-5" />
        <span className="text-sm text-muted-foreground">Comments</span>
      </div>
      <Separator />
      <p className="text-sm leading-6 text-muted-foreground">
        Use the built-in separator instead of custom borders when sections need
        a simple, semantic split.
      </p>
    </div>
  ),
}
