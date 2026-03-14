import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Switch } from "@workspace/ui/components/switch"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Label",
  component: Label,
  parameters: shadcnParameters("label"),
} satisfies Meta<typeof Label>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className="grid max-w-xl gap-6">
      <div className="grid gap-2">
        <Label htmlFor="label-story-input">Author name</Label>
        <Input id="label-story-input" defaultValue="Dongheon" />
      </div>
      <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
        <div className="grid gap-1">
          <Label htmlFor="label-story-switch">Public preview</Label>
          <p className="text-sm text-muted-foreground">
            Let collaborators review the current draft before publication.
          </p>
        </div>
        <Switch id="label-story-switch" defaultChecked />
      </div>
    </div>
  ),
}
