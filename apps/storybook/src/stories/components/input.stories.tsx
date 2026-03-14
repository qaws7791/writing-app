import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "@workspace/ui/components/input"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Input",
  component: Input,
  parameters: shadcnParameters("input"),
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className="grid max-w-2xl gap-4">
      <Input defaultValue="Quiet interfaces help readers stay with the text." />
      <Input type="email" placeholder="editor@writing.app" />
      <Input aria-invalid defaultValue="slug with spaces" />
      <Input disabled defaultValue="Locked after publication" />
    </div>
  ),
}
