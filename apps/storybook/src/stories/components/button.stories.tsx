import type { Meta, StoryObj } from "@storybook/react-vite"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Search01Icon,
  PlusSignIcon,
} from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: shadcnParameters("button"),
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link action</Button>
        <Button variant="destructive">Delete</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button size="sm">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Search
        </Button>
        <Button>
          Add chapter
          <HugeiconsIcon
            icon={PlusSignIcon}
            strokeWidth={2}
            data-icon="inline-end"
          />
        </Button>
        <Button size="icon" aria-label="Open next item">
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
        </Button>
      </div>
    </div>
  ),
}
