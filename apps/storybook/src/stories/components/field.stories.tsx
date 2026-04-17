import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldSet,
  FieldLegend,
  FieldContent,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

const meta: Meta = {
  title: "Components/Field",
  parameters: { layout: "centered" },
}

export default meta
type Story = StoryObj

export const Default: Story = {
  render: () => (
    <Field className="w-[350px]">
      <FieldLabel htmlFor="email">Email address</FieldLabel>
      <Input id="email" type="email" placeholder="name@example.com" />
      <FieldDescription>
        We&apos;ll never share your email with anyone else.
      </FieldDescription>
    </Field>
  ),
}

export const WithError: Story = {
  render: () => (
    <Field className="w-[350px]">
      <FieldLabel htmlFor="email-error">Email address</FieldLabel>
      <Input
        id="email-error"
        type="email"
        placeholder="name@example.com"
        aria-invalid
      />
      <FieldError>Please enter a valid email address.</FieldError>
    </Field>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <Field orientation="horizontal" className="w-[400px]">
      <FieldLabel htmlFor="username">Username</FieldLabel>
      <Input id="username" placeholder="johndoe" />
    </Field>
  ),
}

export const FieldGroupExample: Story = {
  render: () => (
    <FieldGroup className="w-[350px]">
      <Field>
        <FieldLabel htmlFor="first-name">First name</FieldLabel>
        <Input id="first-name" placeholder="John" />
      </Field>
      <Field>
        <FieldLabel htmlFor="last-name">Last name</FieldLabel>
        <Input id="last-name" placeholder="Doe" />
      </Field>
      <Field>
        <FieldLabel htmlFor="bio">Bio</FieldLabel>
        <Textarea id="bio" placeholder="Tell us about yourself..." />
        <FieldDescription>Maximum 160 characters.</FieldDescription>
      </Field>
    </FieldGroup>
  ),
}

export const FieldSetExample: Story = {
  render: () => (
    <FieldSet className="w-[350px]">
      <FieldLegend>Personal Information</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="fs-name">Name</FieldLabel>
          <Input id="fs-name" placeholder="Your name" />
        </Field>
        <Field>
          <FieldLabel htmlFor="fs-email">Email</FieldLabel>
          <Input id="fs-email" type="email" placeholder="your@email.com" />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
}
