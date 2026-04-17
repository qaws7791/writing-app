import type { Meta, StoryObj } from "@storybook/react-vite"
import { toast } from "sonner"

import { Toaster } from "@/components/ui/sonner"
import { Button } from "@/components/ui/button"

const meta: Meta<typeof Toaster> = {
  title: "Components/Sonner",
  component: Toaster,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Toaster>

export const Default: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast("Event has been created.", {
          description: "Sunday, December 03, 2023 at 9:00 AM",
        })
      }
    >
      Show Toast
    </Button>
  ),
}

export const Success: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => toast.success("Profile updated successfully.")}
    >
      Success Toast
    </Button>
  ),
}

export const Error: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => toast.error("Something went wrong. Please try again.")}
    >
      Error Toast
    </Button>
  ),
}

export const Warning: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => toast.warning("Low disk space. Free up storage.")}
    >
      Warning Toast
    </Button>
  ),
}

export const Loading: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => {
        const id = toast.loading("Uploading file...")
        setTimeout(() => toast.success("File uploaded!", { id }), 2000)
      }}
    >
      Loading Toast
    </Button>
  ),
}
