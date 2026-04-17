import type { Meta, StoryObj } from "@storybook/react-vite"
import { Terminal, AlertCircle } from "lucide-react"

import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

const meta: Meta<typeof Alert> = {
  title: "Components/Alert",
  component: Alert,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Alert>

export const Default: Story = {
  render: () => (
    <Alert>
      <Terminal />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the CLI.
      </AlertDescription>
    </Alert>
  ),
}

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again.
      </AlertDescription>
    </Alert>
  ),
}

export const WithAction: Story = {
  render: () => (
    <Alert>
      <Terminal />
      <AlertTitle>Software Update Available</AlertTitle>
      <AlertDescription>
        A new version of the application is available for download.
      </AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline">
          Update
        </Button>
      </AlertAction>
    </Alert>
  ),
}

export const NoIcon: Story = {
  render: () => (
    <Alert>
      <AlertTitle>Note</AlertTitle>
      <AlertDescription>
        This alert has no icon, just a title and description.
      </AlertDescription>
    </Alert>
  ),
}
