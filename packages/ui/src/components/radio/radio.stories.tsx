import type { Meta, StoryObj } from "@storybook/react"
import { RadioGroup, Radio } from "./radio"

const meta: Meta<typeof RadioGroup> = {
  title: "Components/Radio",
  component: RadioGroup,
}

export default meta
type Story = StoryObj<typeof RadioGroup>

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="option1">
      <Radio value="option1">옵션 1</Radio>
      <Radio value="option2">옵션 2</Radio>
      <Radio value="option3">옵션 3</Radio>
    </RadioGroup>
  ),
}

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="option1" disabled>
      <Radio value="option1">옵션 1</Radio>
      <Radio value="option2">옵션 2</Radio>
    </RadioGroup>
  ),
}

export const SingleDisabled: Story = {
  render: () => (
    <RadioGroup defaultValue="option1">
      <Radio value="option1">활성화</Radio>
      <Radio value="option2" disabled>
        비활성화
      </Radio>
      <Radio value="option3">활성화</Radio>
    </RadioGroup>
  ),
}

export const WithoutLabels: Story = {
  render: () => (
    <RadioGroup defaultValue="a" className="flex-row gap-4">
      <Radio value="a" />
      <Radio value="b" />
      <Radio value="c" />
    </RadioGroup>
  ),
}
