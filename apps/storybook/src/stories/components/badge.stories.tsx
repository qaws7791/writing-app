import type { Meta, StoryObj } from "@storybook/react-vite"
import { HugeiconsIcon } from "@hugeicons/react"
import { SparklesIcon } from "@hugeicons/core-free-icons"

import { Badge } from "@workspace/ui/components/badge"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Badge",
  component: Badge,
  parameters: shadcnParameters("badge"),
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Badge>Published</Badge>
      <Badge variant="secondary">Writing</Badge>
      <Badge variant="outline">Needs review</Badge>
      <Badge variant="destructive">Overdue</Badge>
      <Badge variant="link" render={<a href="#badge-link" />}>
        Guidelines
      </Badge>
      <Badge>
        <HugeiconsIcon
          icon={SparklesIcon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        Featured
      </Badge>
    </div>
  ),
}
