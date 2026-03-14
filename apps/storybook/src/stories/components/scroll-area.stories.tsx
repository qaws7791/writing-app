import type { Meta, StoryObj } from "@storybook/react-vite"

import { ScrollArea } from "@workspace/ui/components/scroll-area"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Scroll Area",
  component: ScrollArea,
  parameters: shadcnParameters("scroll-area"),
} satisfies Meta<typeof ScrollArea>

export default meta

type Story = StoryObj<typeof meta>

const notes = [
  "Use generous line-height to reduce fatigue during long reading sessions.",
  "Keep contrast ratios strong enough for all ages and lighting conditions.",
  "Avoid decorative motion unless it supports orientation or comprehension.",
  "Editorial UI should surface actions only when readers or writers need them.",
  "Whitespace is part of the hierarchy, not empty filler around content.",
  "Consistent grouping lowers the cost of scanning across panels and menus.",
]

export const Showcase: Story = {
  render: () => (
    <ScrollArea className="h-72 max-w-xl rounded-xl border p-4">
      <div className="flex flex-col gap-4 pr-4">
        {notes.map((note) => (
          <p key={note} className="text-sm leading-6 text-muted-foreground">
            {note}
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
}
