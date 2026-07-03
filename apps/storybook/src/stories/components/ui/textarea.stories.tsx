import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Label,
  Textarea,
} from "@workspace/ui"

const meta = {
  title: "Components/UI/Textarea",
  component: Textarea,
  args: {
    placeholder: "본문을 입력하세요",
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const SizesAndResize: Story = {
  render: () => (
    <div className="grid w-[min(34rem,calc(100vw-2rem))] gap-4">
      <Textarea aria-label="default textarea" placeholder="기본 높이" />
      <Textarea
        aria-label="large textarea"
        className="min-h-40"
        placeholder="긴 글 작성 영역"
      />
      <Textarea
        aria-label="fixed textarea"
        className="resize-none"
        placeholder="크기 고정"
      />
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="grid w-[min(34rem,calc(100vw-2rem))] gap-4">
      <Textarea aria-label="default textarea" placeholder="기본" />
      <Textarea aria-label="filled textarea" defaultValue="입력된 본문" />
      <Textarea
        disabled
        aria-label="disabled textarea"
        value="수정할 수 없음"
      />
      <Textarea
        aria-invalid="true"
        aria-label="invalid textarea"
        placeholder="오류"
      />
    </div>
  ),
}

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-[min(34rem,calc(100vw-2rem))] gap-1.5">
      <Label htmlFor="message">메시지</Label>
      <Textarea placeholder="메시지를 입력하세요." id="message" />
    </div>
  ),
}

export const WithText: Story = {
  render: () => (
    <div className="grid w-[min(34rem,calc(100vw-2rem))] gap-1.5">
      <Label htmlFor="message-2">메시지</Label>
      <Textarea placeholder="메시지를 입력하세요." id="message-2" />
      <p className="text-sm text-muted-foreground">
        이 내용은 관리자에게 전송됩니다.
      </p>
    </div>
  ),
}

export const WithButton: Story = {
  render: () => (
    <div className="grid w-[min(34rem,calc(100vw-2rem))] gap-2">
      <Textarea placeholder="피드백이나 문의사항을 입력하세요." />
      <Button className="w-fit justify-self-end">보내기</Button>
    </div>
  ),
}

export const CounterComposition: Story = {
  render: () => (
    <Field className="w-[min(36rem,calc(100vw-2rem))]">
      <div className="flex items-center justify-between gap-3">
        <FieldLabel htmlFor="textarea-counter">피드백</FieldLabel>
        <span className="text-caption font-bold text-muted-foreground/70">
          42 / 500
        </span>
      </div>
      <Textarea
        defaultValue="문장의 흐름은 좋아졌지만 두 번째 근거가 조금 더 구체적이면 좋겠습니다."
        id="textarea-counter"
      />
      <FieldDescription>카운터는 필드 외부 조합으로 유지한다.</FieldDescription>
    </Field>
  ),
}

export const FormInteraction: Story = {
  render: () => (
    <Field data-invalid className="w-[min(36rem,calc(100vw-2rem))]">
      <FieldLabel htmlFor="textarea-interaction">본문</FieldLabel>
      <Textarea
        aria-describedby="textarea-interaction-error"
        aria-invalid="true"
        id="textarea-interaction"
        placeholder="본문"
      />
      <FieldError id="textarea-interaction-error">
        본문을 입력해야 한다.
      </FieldError>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const textarea = canvas.getByLabelText("본문")
    await userEvent.type(textarea, "첫 문장을 작성합니다.")
    await expect(textarea).toHaveValue("첫 문장을 작성합니다.")
  },
}
