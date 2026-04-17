import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

const meta: Meta<typeof Tooltip> = {
  title: "Components/Tooltip",
  component: Tooltip,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>
        Hover
      </TooltipTrigger>
      <TooltipContent>
        <p>Add to library</p>
      </TooltipContent>
    </Tooltip>
  ),
}

export const Sides: Story = {
  render: () => (
    <div className="flex gap-4">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger
            render={<Button variant="outline" className="capitalize" />}
          >
            {side}
          </TooltipTrigger>
          <TooltipContent side={side}>
            <p>Tooltip on the {side}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
}
