import type { Meta, StoryObj } from "@storybook/react-vite"
import { HugeiconsIcon } from "@hugeicons/react"
import { Note01Icon, PlusSignIcon } from "@hugeicons/core-free-icons"

import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Empty",
  component: Empty,
  parameters: shadcnParameters("empty"),
} satisfies Meta<typeof Empty>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={Note01Icon} strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>No writings yet</EmptyTitle>
        <EmptyDescription>
          Start with a clean canvas and build a calm, high-contrast reading
          experience.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>
          <HugeiconsIcon
            icon={PlusSignIcon}
            strokeWidth={2}
            data-icon="inline-start"
          />
          Create first writing
        </Button>
      </EmptyContent>
    </Empty>
  ),
}
