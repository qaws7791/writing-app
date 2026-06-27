import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
} from "@workspace/ui"

const meta = {
  title: "Components/Forms/Input",
  component: Input,
  args: {
    placeholder: "제목을 입력하세요",
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const TypesAndSizes: Story = {
  render: () => (
    <div className="grid w-[min(32rem,calc(100vw-2rem))] gap-4">
      <Input aria-label="search input" placeholder="검색" type="search" />
      <Input
        aria-label="email input"
        placeholder="name@example.com"
        type="email"
      />
      <Input
        aria-label="password input"
        placeholder="비밀번호"
        type="password"
      />
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="grid w-[min(32rem,calc(100vw-2rem))] gap-4">
      <Input aria-label="default input" placeholder="기본" />
      <Input aria-label="filled input" defaultValue="입력된 값" />
      <Input disabled aria-label="disabled input" value="수정할 수 없음" />
      <Input
        aria-invalid="true"
        aria-label="invalid input"
        placeholder="오류"
      />
    </div>
  ),
}

export const LongContent: Story = {
  render: () => (
    <Field className="w-[min(36rem,calc(100vw-2rem))]">
      <FieldLabel htmlFor="input-long-content">
        사용자가 붙여 넣은 매우 긴 한 줄 제목
      </FieldLabel>
      <Input
        defaultValue="문장의 중심을 찾고 근거를 쌓아 독자가 끝까지 따라올 수 있는 단락 만들기"
        id="input-long-content"
      />
      <FieldDescription>컨테이너 밖으로 밀려나지 않아야 한다.</FieldDescription>
    </Field>
  ),
}

export const FormInteraction: Story = {
  render: () => (
    <Field data-invalid className="w-[min(32rem,calc(100vw-2rem))]">
      <FieldLabel htmlFor="input-interaction">제목</FieldLabel>
      <Input
        aria-describedby="input-interaction-error"
        aria-invalid="true"
        id="input-interaction"
        placeholder="제목"
      />
      <FieldError id="input-interaction-error">제목을 입력하세요.</FieldError>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByLabelText("제목")
    await userEvent.type(input, "문장의 중심 찾기")
    await expect(input).toHaveValue("문장의 중심 찾기")
  },
}
