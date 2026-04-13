import type { Meta, StoryObj } from "@storybook/react"

import { Form } from "./index"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

const meta = {
  title: "Components/Form",
  component: Form,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Form>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default form
 */
export const Default: Story = {
  render: () => (
    <Form.Root
      onSubmit={(e) => {
        e.preventDefault()
        alert("Form submitted!")
      }}
    >
      <div className="flex w-80 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Enter your name" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="Enter your email" />
        </div>
        <button type="submit">Submit</button>
      </div>
    </Form.Root>
  ),
}

/**
 * Form with multiple fields
 */
export const Detailed: Story = {
  render: () => (
    <Form.Root>
      <div className="flex w-96 flex-col gap-6">
        <h2>Registration Form</h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fname">First Name</Label>
          <Input id="fname" placeholder="John" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="lname">Last Name</Label>
          <Input id="lname" placeholder="Doe" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" placeholder="john@example.com" />
        </div>
        <button type="submit" className="rounded bg-blue-500 py-2 text-white">
          Register
        </button>
      </div>
    </Form.Root>
  ),
}
