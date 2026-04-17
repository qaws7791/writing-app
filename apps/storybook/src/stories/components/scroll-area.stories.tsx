import type { Meta, StoryObj } from "@storybook/react-vite"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

const tags = Array.from({ length: 50 }).map((_, i, a) => `v1.2.${a.length - i}`)

const meta: Meta<typeof ScrollArea> = {
  title: "Components/ScrollArea",
  component: ScrollArea,
  parameters: { layout: "centered" },
}

export default meta
type Story = StoryObj<typeof ScrollArea>

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-72 w-48 rounded-2xl border">
      <div className="p-4">
        <h4 className="mb-4 text-sm leading-none font-medium">Tags</h4>
        {tags.map((tag) => (
          <>
            <div key={tag} className="text-sm">
              {tag}
            </div>
            <Separator className="my-2" />
          </>
        ))}
      </div>
    </ScrollArea>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-96 rounded-2xl border whitespace-nowrap">
      <div className="flex w-max space-x-4 p-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="flex h-20 w-36 shrink-0 items-center justify-center rounded-xl bg-muted text-sm"
          >
            Item {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}
