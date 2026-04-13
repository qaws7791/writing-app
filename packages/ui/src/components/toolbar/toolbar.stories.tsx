import type { Meta, StoryObj } from "@storybook/react"

import { Button } from "@workspace/ui/components/button"
import { Toolbar } from "./index"

const meta = {
  title: "Components/Toolbar",
  component: Toolbar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Toolbar>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default toolbar
 */
export const Default: Story = {
  render: () => (
    <Toolbar.Root className="flex gap-2 rounded border p-2">
      <Button size="sm" variant="ghost">
        Save
      </Button>
      <Button size="sm" variant="ghost">
        Edit
      </Button>
      <Button size="sm" variant="ghost">
        Delete
      </Button>
    </Toolbar.Root>
  ),
}

/**
 * Toolbar with groups
 */
export const WithGroups: Story = {
  render: () => (
    <Toolbar.Root className="flex gap-2 rounded border p-2">
      <div className="flex gap-1">
        <Button size="sm" variant="ghost">
          Bold
        </Button>
        <Button size="sm" variant="ghost">
          Italic
        </Button>
      </div>
      <div className="border-l" />
      <div className="flex gap-1">
        <Button size="sm" variant="ghost">
          Left
        </Button>
        <Button size="sm" variant="ghost">
          Center
        </Button>
        <Button size="sm" variant="ghost">
          Right
        </Button>
      </div>
    </Toolbar.Root>
  ),
}

/**
 * Complex toolbar
 */
export const Complex: Story = {
  render: () => (
    <Toolbar.Root className="flex gap-2 rounded border bg-gray-50 p-3">
      <Button size="sm" variant="ghost">
        Undo
      </Button>
      <Button size="sm" variant="ghost">
        Redo
      </Button>
      <div className="mx-1 border-l" />
      <select className="rounded border px-2 py-1 text-sm">
        <option>Normal</option>
        <option>H1</option>
        <option>H2</option>
      </select>
      <select className="rounded border px-2 py-1 text-sm">
        <option>Font</option>
      </select>
      <div className="mx-1 border-l" />
      <Button size="sm" variant="ghost">
        📷
      </Button>
      <Button size="sm" variant="ghost">
        🔗
      </Button>
      <Button size="sm" variant="ghost">
        🎨
      </Button>
    </Toolbar.Root>
  ),
}
