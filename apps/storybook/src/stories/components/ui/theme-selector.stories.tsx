import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"

import {
  ThemeSelector,
  type ThemeValue,
} from "@workspace/ui/components/ui/theme-selector"

const themeValues: readonly ThemeValue[] = ["light", "dark", "system"]

const meta = {
  title: "Components/UI/ThemeSelector",
  component: ThemeSelector,
  args: {
    activeTheme: "system",
    onThemeChange: fn(),
  },
  argTypes: {
    activeTheme: {
      control: "inline-radio",
      options: themeValues,
      description: "현재 선택된 테마입니다.",
    },
    disabled: {
      control: "boolean",
      description: "테마 변경을 잠급니다.",
    },
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ThemeSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const SelectedStates: Story = {
  render: (args) => (
    <div className="grid gap-3">
      {themeValues.map((theme) => (
        <ThemeSelector {...args} activeTheme={theme} key={theme} />
      ))}
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}
