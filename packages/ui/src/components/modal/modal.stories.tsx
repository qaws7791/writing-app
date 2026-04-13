import type { Meta, StoryObj } from "@storybook/react"
import { useState } from "react"

import { Button } from "@workspace/ui/components/button"
import { Modal } from "./index"

const meta = {
  title: "Components/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

function DefaultModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onPress={() => setIsOpen(true)}>Open Modal</Button>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Modal Title</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p>This is the modal content</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onPress={() => setIsOpen(false)}>Confirm</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  )
}

/**
 * Default modal with basic button trigger
 */
export const Default: Story = {
  render: () => <DefaultModal />,
}

function SizeModal({ size }: { size: "sm" | "md" | "lg" }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div>
      <Button onPress={() => setIsOpen(true)}>Open {size}</Button>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop>
          <Modal.Container size={size}>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>{size} Modal</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p>This is a {size} modal</p>
              </Modal.Body>
              <Modal.Footer>
                <Button onPress={() => setIsOpen(false)}>Close</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  )
}

/**
 * Modal with different sizes
 */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <SizeModal key={size} size={size} />
      ))}
    </div>
  ),
}

function ScrollableContentModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onPress={() => setIsOpen(true)}>Open Scrollable Modal</Button>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop>
          <Modal.Container size="md" scroll="inside">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Long Content Modal</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="space-y-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <p key={i}>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      Sed do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua.
                    </p>
                  ))}
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button onPress={() => setIsOpen(false)}>Close</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  )
}

/**
 * Modal with scrollable content
 */
export const ScrollableContent: Story = {
  render: () => <ScrollableContentModal />,
}

function WithIconModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onPress={() => setIsOpen(true)}>Open Modal with Icon</Button>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Icon>ℹ️</Modal.Icon>
                <Modal.Heading>Information</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p>This modal includes an icon in the header</p>
              </Modal.Body>
              <Modal.Footer>
                <Button onPress={() => setIsOpen(false)}>Close</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  )
}

/**
 * Modal with icon
 */
export const WithIcon: Story = {
  render: () => <WithIconModal />,
}

function WithCloseButtonModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onPress={() => setIsOpen(true)}>Open Modal</Button>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Modal Title</Modal.Heading>
                <Modal.CloseTrigger onPress={() => setIsOpen(false)} />
              </Modal.Header>
              <Modal.Body>
                <p>This modal has a close button in the header</p>
              </Modal.Body>
              <Modal.Footer>
                <Button onPress={() => setIsOpen(false)}>Close</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  )
}

/**
 * Modal with close button
 */
export const WithCloseButton: Story = {
  render: () => <WithCloseButtonModal />,
}

function PlaygroundModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onPress={() => setIsOpen(true)}>Open Modal</Button>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Interactive Modal</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p>Customize modal properties using Storybook controls</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onPress={() => setIsOpen(false)}>Confirm</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  )
}

/**
 * Playground with all props controllable
 */
export const Playground: Story = {
  render: () => <PlaygroundModal />,
}
