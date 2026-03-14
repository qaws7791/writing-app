import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
} from "@hugeicons/core-free-icons"

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Toggle Group",
  component: ToggleGroup,
  parameters: shadcnParameters("toggle-group"),
} satisfies Meta<typeof ToggleGroup>

export default meta

type Story = StoryObj<typeof meta>

function ToggleGroupShowcase() {
  const [view, setView] = React.useState(["comfortable"])

  return (
    <div className="flex flex-col gap-6">
      <ToggleGroup multiple spacing={1}>
        <ToggleGroupItem value="bold" aria-label="Bold">
          <HugeiconsIcon icon={TextBoldIcon} strokeWidth={2} />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          <HugeiconsIcon icon={TextItalicIcon} strokeWidth={2} />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Underline">
          <HugeiconsIcon icon={TextUnderlineIcon} strokeWidth={2} />
        </ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup
        value={view}
        onValueChange={(value) => setView(value as string[])}
        variant="outline"
        size="sm"
        spacing={2}
      >
        <ToggleGroupItem value="comfortable" aria-label="Comfortable view">
          Comfortable
        </ToggleGroupItem>
        <ToggleGroupItem value="compact" aria-label="Compact view">
          Compact
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}

export const Showcase: Story = {
  render: () => <ToggleGroupShowcase />,
}
