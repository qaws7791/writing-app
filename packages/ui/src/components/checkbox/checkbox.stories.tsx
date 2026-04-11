import type { Meta, StoryObj } from "@storybook/react"
import { Checkbox } from "./checkbox"

const meta: Meta<typeof Checkbox> = {
  title: "Components/Checkbox",
  component: Checkbox,
  args: {
    disabled: false,
  },
}

export default meta
type Story = StoryObj<typeof Checkbox>

export const Default: Story = {
  args: { children: "동의합니다" },
}

export const Checked: Story = {
  args: { children: "체크됨", defaultChecked: true },
}

export const Indeterminate: Story = {
  args: { children: "일부 선택", indeterminate: true },
}

export const Disabled: Story = {
  args: { children: "비활성화", disabled: true },
}

export const DisabledChecked: Story = {
  args: { children: "비활성화 체크", disabled: true, checked: true },
}

export const WithoutLabel: Story = {
  args: {},
}

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Checkbox>기본</Checkbox>
      <Checkbox defaultChecked>체크됨</Checkbox>
      <Checkbox indeterminate>일부 선택</Checkbox>
      <Checkbox disabled>비활성화</Checkbox>
      <Checkbox disabled checked>
        비활성화 체크
      </Checkbox>
    </div>
  ),
}
