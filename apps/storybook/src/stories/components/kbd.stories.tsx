import type { Meta, StoryObj } from "@storybook/react-vite"

import { Kbd, KbdGroup } from "@workspace/ui/components/kbd"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Kbd",
  component: Kbd,
  parameters: shadcnParameters("kbd"),
} satisfies Meta<typeof Kbd>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className="flex flex-col gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        Open command menu
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </div>
      <div className="flex items-center gap-2">
        Publish current draft
        <KbdGroup>
          <Kbd>Shift</Kbd>
          <Kbd>Enter</Kbd>
        </KbdGroup>
      </div>
    </div>
  ),
}
