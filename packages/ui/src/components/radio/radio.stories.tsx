import type { Meta, StoryObj } from "@storybook/react"

import { RadioGroup } from "react-aria-components"

import { Radio } from "./index"

const meta = {
  title: "Components/Radio",
  component: Radio,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Radio>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default radio button used inside a RadioGroup
 */
export const Default: Story = {
  render: () => (
    <RadioGroup aria-label="Favorite color">
      <Radio value="red">
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <Radio.Content>Red</Radio.Content>
      </Radio>
      <Radio value="green">
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <Radio.Content>Green</Radio.Content>
      </Radio>
      <Radio value="blue">
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <Radio.Content>Blue</Radio.Content>
      </Radio>
    </RadioGroup>
  ),
}

/**
 * Radio group with a pre-selected value
 */
export const WithDefaultValue: Story = {
  render: () => (
    <RadioGroup aria-label="Subscription plan" defaultValue="pro">
      <Radio value="free">
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <Radio.Content>Free</Radio.Content>
      </Radio>
      <Radio value="pro">
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <Radio.Content>Pro</Radio.Content>
      </Radio>
      <Radio value="enterprise">
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <Radio.Content>Enterprise</Radio.Content>
      </Radio>
    </RadioGroup>
  ),
}

/**
 * Disabled radio button
 */
export const Disabled: Story = {
  render: () => (
    <RadioGroup aria-label="Disabled options">
      <Radio value="option1">
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <Radio.Content>Available option</Radio.Content>
      </Radio>
      <Radio isDisabled value="option2">
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <Radio.Content>Unavailable option</Radio.Content>
      </Radio>
    </RadioGroup>
  ),
}

/**
 * Entire group disabled
 */
export const GroupDisabled: Story = {
  render: () => (
    <RadioGroup aria-label="Disabled group" isDisabled>
      <Radio value="opt1">
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <Radio.Content>Option A</Radio.Content>
      </Radio>
      <Radio value="opt2">
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <Radio.Content>Option B</Radio.Content>
      </Radio>
      <Radio value="opt3">
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <Radio.Content>Option C</Radio.Content>
      </Radio>
    </RadioGroup>
  ),
}

/**
 * Radio options in a horizontal layout
 */
export const Horizontal: Story = {
  render: () => (
    <RadioGroup aria-label="Notification frequency" orientation="horizontal">
      <Radio value="daily">
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <Radio.Content>Daily</Radio.Content>
      </Radio>
      <Radio value="weekly">
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <Radio.Content>Weekly</Radio.Content>
      </Radio>
      <Radio value="monthly">
        <Radio.Control>
          <Radio.Indicator />
        </Radio.Control>
        <Radio.Content>Monthly</Radio.Content>
      </Radio>
    </RadioGroup>
  ),
}
