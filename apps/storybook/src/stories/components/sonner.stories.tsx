import type { Meta, StoryObj } from "@storybook/react-vite"
import { toast } from "sonner"

import { Button } from "@workspace/ui/components/button"
import { Toaster } from "@workspace/ui/components/sonner"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Sonner",
  component: Toaster,
  parameters: shadcnParameters("sonner"),
} satisfies Meta<typeof Toaster>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Toaster />
      <Button
        variant="outline"
        onClick={() => toast("Writing saved successfully.")}
      >
        Basic toast
      </Button>
      <Button
        onClick={() =>
          toast("Editorial review requested.", {
            description: "The writing has been sent to the assigned editor.",
          })
        }
      >
        Toast with description
      </Button>
    </div>
  ),
}
