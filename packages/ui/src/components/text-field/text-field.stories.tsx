import type { Meta, StoryObj } from "@storybook/react"
import { TextField } from "./text-field"
import { Textarea } from "./textarea"

const meta: Meta<typeof TextField> = {
  title: "Components/TextField",
  component: TextField,
  args: {
    label: "레이블",
    placeholder: "입력하세요",
    variant: "filled",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["filled", "outlined"],
    },
  },
}

export default meta
type Story = StoryObj<typeof TextField>

export const Filled: Story = { args: { variant: "filled" } }
export const Outlined: Story = { args: { variant: "outlined" } }

export const WithHelper: Story = {
  args: { helperText: "도움말 텍스트입니다." },
}

export const WithError: Story = {
  args: { errorText: "필수 입력 항목입니다." },
}

export const Disabled: Story = {
  args: { disabled: true, value: "비활성화됨" },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      <TextField
        variant="filled"
        label="이름"
        placeholder="이름을 입력하세요"
      />
      <TextField
        variant="outlined"
        label="이메일"
        placeholder="이메일을 입력하세요"
      />
      <TextField variant="filled" label="오류" errorText="잘못된 입력입니다." />
      <TextField variant="outlined" label="도움말" helperText="도움말 텍스트" />
    </div>
  ),
}

export const TextareaFilled: StoryObj<typeof Textarea> = {
  render: () => (
    <div className="w-80">
      <Textarea variant="filled" label="내용" placeholder="내용을 입력하세요" />
    </div>
  ),
}

export const TextareaOutlined: StoryObj<typeof Textarea> = {
  render: () => (
    <div className="w-80">
      <Textarea
        variant="outlined"
        label="내용"
        placeholder="내용을 입력하세요"
      />
    </div>
  ),
}

export const TextareaWithError: StoryObj<typeof Textarea> = {
  render: () => (
    <div className="w-80">
      <Textarea
        variant="filled"
        label="메모"
        errorText="100자 이내로 입력하세요."
      />
    </div>
  ),
}
