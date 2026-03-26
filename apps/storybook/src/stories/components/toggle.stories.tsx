import type { Meta, StoryObj } from "@storybook/react-vite"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  BookmarkIcon,
  TextBoldIcon,
  TextItalicIcon,
} from "@hugeicons/core-free-icons"

import { Toggle } from "@workspace/ui/components/toggle"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Toggle",
  component: Toggle,
  parameters: shadcnParameters("toggle"),
} satisfies Meta<typeof Toggle>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Toggle defaultPressed aria-label="Toggle bold">
        <HugeiconsIcon icon={TextBoldIcon} strokeWidth={2} />
      </Toggle>
      <Toggle variant="outline" aria-label="Toggle italic">
        <HugeiconsIcon icon={TextItalicIcon} strokeWidth={2} />
        Italic
      </Toggle>
      <Toggle variant="outline" size="lg" aria-label="Bookmark writing">
        <HugeiconsIcon icon={BookmarkIcon} strokeWidth={2} />
        Bookmark
      </Toggle>
    </div>
  ),
}
