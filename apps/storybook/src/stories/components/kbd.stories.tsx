import type { Meta, StoryObj } from "@storybook/react-vite"

import { Kbd, KbdGroup } from "@/components/ui/kbd"

const meta: Meta<typeof Kbd> = {
  title: "Components/Kbd",
  component: Kbd,
  parameters: { layout: "centered" },
}

export default meta
type Story = StoryObj<typeof Kbd>

export const Default: Story = {
  render: () => <Kbd>K</Kbd>,
}

export const Group: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
}

export const Examples: Story = {
  render: () => (
    <div className="flex flex-col gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span>Copy</span>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>C</Kbd>
        </KbdGroup>
      </div>
      <div className="flex items-center gap-2">
        <span>Paste</span>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>V</Kbd>
        </KbdGroup>
      </div>
      <div className="flex items-center gap-2">
        <span>Save</span>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>S</Kbd>
        </KbdGroup>
      </div>
    </div>
  ),
}
