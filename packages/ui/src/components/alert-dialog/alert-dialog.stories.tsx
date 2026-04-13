import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { AlertDialog } from "./index"

const meta = {
  title: "Components/AlertDialog",
  component: AlertDialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AlertDialog>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Basic alert dialog
 */
export const Default: Story = {
  render: () => (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <Button>Open Alert Dialog</Button>
      </AlertDialog.Trigger>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>Confirm Action</AlertDialog.Heading>
              <AlertDialog.CloseTrigger />
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>Are you sure you want to proceed with this action?</p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="ghost">Cancel</Button>
              <Button>Confirm</Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog.Root>
  ),
}

/**
 * Alert dialog with warning
 */
export const Warning: Story = {
  render: () => (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>
        <Button variant="danger">Delete Item</Button>
      </AlertDialog.Trigger>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Icon />
              <AlertDialog.Heading>Delete Confirmation</AlertDialog.Heading>
              <AlertDialog.CloseTrigger />
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>This action cannot be undone. Are you sure?</p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="ghost">Cancel</Button>
              <Button variant="danger">Delete</Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog.Root>
  ),
}

function InteractiveAlertDialog() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onPress={() => setIsOpen(true)}>Show Alert</Button>
      <AlertDialog.Root isOpen={isOpen} onOpenChange={setIsOpen}>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>Confirm</AlertDialog.Heading>
                <AlertDialog.CloseTrigger />
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p>Do you want to continue?</p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button variant="ghost" onPress={() => setIsOpen(false)}>
                  No
                </Button>
                <Button onPress={() => setIsOpen(false)}>Yes</Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog.Root>
    </>
  )
}

/**
 * Interactive alert dialog with state
 */
export const Interactive: Story = {
  render: () => <InteractiveAlertDialog />,
}
