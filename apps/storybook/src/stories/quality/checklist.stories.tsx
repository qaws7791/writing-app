import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button, Field, FieldError, FieldLabel, Input } from "@workspace/ui"

import { DoDont } from "../../blocks/do-dont"
import { KeyboardTable } from "../../blocks/keyboard-table"

const meta = {
  title: "Quality/Checklist",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const AccessibilityContracts: Story = {
  render: () => (
    <div className="grid max-w-4xl gap-6">
      <DoDont
        doExample={
          <Field data-invalid>
            <FieldLabel htmlFor="quality-title">제목</FieldLabel>
            <Input
              aria-describedby="quality-title-error"
              aria-invalid="true"
              id="quality-title"
            />
            <FieldError id="quality-title-error">
              제목을 입력해야 한다.
            </FieldError>
          </Field>
        }
        dontExample={
          <div className="grid gap-2">
            <span className="text-label-md font-bold">제목</span>
            <Input aria-invalid="true" placeholder="오류만 표시" />
            <p className="text-label-sm font-bold">빨간색으로만 오류 표시</p>
          </div>
        }
      />
      <KeyboardTable
        rows={[
          {
            action: "초점 순서가 시각 순서와 일치해야 한다.",
            keyName: "Tab",
          },
          {
            action: "토글 버튼은 눌림 상태를 aria-pressed로 노출한다.",
            keyName: "Space",
          },
          {
            action: "취소 가능한 overlay나 임시 상태는 닫을 수 있어야 한다.",
            keyName: "Escape",
          },
        ]}
      />
    </div>
  ),
}

export const ContentContracts: Story = {
  render: () => (
    <DoDont
      doExample={
        <div className="grid gap-3">
          <Button>저장</Button>
          <p className="text-body-sm font-semibold">
            동사는 짧게 쓰고 결과를 예측할 수 있게 한다.
          </p>
        </div>
      }
      dontExample={
        <div className="grid gap-3">
          <Button>확인</Button>
          <p className="text-body-sm font-semibold">
            같은 화면에서 확인, 적용, 완료를 섞어 쓰지 않는다.
          </p>
        </div>
      }
    />
  ),
}
