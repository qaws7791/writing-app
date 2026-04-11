import type { Meta, StoryObj } from "@storybook/react"
import { Switch } from "./switch"

const meta: Meta<typeof Switch> = {
  title: "Components/Switch",
  component: Switch,
  args: {
    size: "md",
    disabled: false,
  },
  argTypes: {
    size: {
      control: "radio",
      options: ["sm", "md"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Switch>

export const Default: Story = {}
export const Checked: Story = { args: { defaultChecked: true } }
export const Small: Story = { args: { size: "sm" } }
export const Disabled: Story = { args: { disabled: true } }
export const DisabledChecked: Story = {
  args: { disabled: true, checked: true },
}

export const WithLabel: Story = {
  args: { children: "알림 설정" },
}

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Switch size="md">기본</Switch>
      <Switch size="md" defaultChecked>
        체크됨
      </Switch>
      <Switch size="sm">Small</Switch>
      <Switch size="sm" defaultChecked>
        Small 체크됨
      </Switch>
      <Switch disabled>비활성화</Switch>
      <Switch disabled checked>
        비활성화 체크
      </Switch>
    </div>
  ),
}
