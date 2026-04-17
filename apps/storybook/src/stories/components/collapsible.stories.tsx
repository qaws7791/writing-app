import type { Meta, StoryObj } from "@storybook/react-vite"
import { ChevronsUpDown, Plus, X } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"

const meta: Meta<typeof Collapsible> = {
  title: "Components/Collapsible",
  component: Collapsible,
  parameters: { layout: "centered" },
}

export default meta
type Story = StoryObj<typeof Collapsible>

export const Default: Story = {
  render: () => (
    <Collapsible className="w-[350px] space-y-2">
      <div className="flex items-center justify-between space-x-4 px-4">
        <h4 className="text-sm font-semibold">
          @peduarte starred 3 repositories
        </h4>
        <CollapsibleTrigger
          render={<Button variant="ghost" size="icon" className="size-8" />}
        >
          <ChevronsUpDown className="size-4" />
          <span className="sr-only">Toggle</span>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-2xl border border-border px-4 py-3 font-mono text-sm">
        @radix-ui/primitives
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-2xl border border-border px-4 py-3 font-mono text-sm">
          @radix-ui/colors
        </div>
        <div className="rounded-2xl border border-border px-4 py-3 font-mono text-sm">
          @stitches/react
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
}
