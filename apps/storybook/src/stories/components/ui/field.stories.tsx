import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, within } from "storybook/test"

import { Button } from "@workspace/ui/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/ui/field"
import { Input } from "@workspace/ui/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/ui/select"
import { Textarea } from "@workspace/ui/components/ui/textarea"

const meta = {
  title: "Components/UI/Field",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Anatomy: Story = {
  render: () => (
    <Field className="max-w-lg">
      <FieldLabel htmlFor="field-anatomy-title">제목</FieldLabel>
      <Input id="field-anatomy-title" placeholder="코스 제목" />
      <FieldDescription>
        목록, 상세 화면, 검색 결과에 함께 노출되는 이름이다.
      </FieldDescription>
    </Field>
  ),
}

export const States: Story = {
  render: () => (
    <FieldGroup className="max-w-lg">
      <Field>
        <FieldLabel htmlFor="field-state-default">기본</FieldLabel>
        <Input id="field-state-default" placeholder="입력 가능" />
      </Field>
      <Field>
        <FieldLabel htmlFor="field-state-disabled">비활성</FieldLabel>
        <Input disabled id="field-state-disabled" value="수정할 수 없음" />
      </Field>
      <Field data-invalid>
        <FieldLabel htmlFor="field-state-error">오류</FieldLabel>
        <Input
          aria-describedby="field-state-error-message"
          aria-invalid="true"
          id="field-state-error"
          placeholder="필수 입력"
        />
        <FieldError id="field-state-error-message">
          제목을 입력해야 한다.
        </FieldError>
      </Field>
    </FieldGroup>
  ),
}

export const Groups: Story = {
  render: () => (
    <FieldSet className="max-w-2xl rounded-panel border border-border/50 p-surface-padding-md bg-bg-elevated">
      <div>
        <FieldLegend>코스 정보</FieldLegend>
        <FieldDescription>
          같은 주제의 필드는 FormSection과 FieldGroup으로 묶는다.
        </FieldDescription>
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="field-group-title">제목</FieldLabel>
          <Input id="field-group-title" placeholder="문장의 중심 찾기" />
        </Field>
        <Field>
          <FieldLabel htmlFor="field-group-status">상태</FieldLabel>
          <Select defaultValue="draft">
            <SelectTrigger id="field-group-status" variant="outlined">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">초안</SelectItem>
              <SelectItem value="published">공개</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="field-group-description">설명</FieldLabel>
          <Textarea id="field-group-description" placeholder="코스 설명" />
        </Field>
      </FieldGroup>
      <div className="flex justify-end gap-2">
        <Button variant="outline">취소</Button>
        <Button>저장</Button>
      </div>
    </FieldSet>
  ),
}

export const LongContent: Story = {
  render: () => (
    <Field className="max-w-xl">
      <FieldLabel htmlFor="field-long-label">
        관리자가 내부 검토 기준을 함께 확인할 수 있도록 충분히 구체적인 긴 라벨
      </FieldLabel>
      <Input
        id="field-long-label"
        placeholder="사용자에게 그대로 보이는 긴 제목을 입력하세요"
      />
      <FieldDescription>
        도움말이 두 줄 이상이 되어도 입력 영역과 오류 메시지의 순서가 유지된다.
      </FieldDescription>
    </Field>
  ),
}

export const Accessibility: Story = {
  render: () => (
    <Field className="max-w-3xl" data-invalid>
      <FieldLabel htmlFor="field-a11y-title">제목</FieldLabel>
      <Input
        aria-describedby="field-a11y-title-help field-a11y-title-error"
        aria-invalid="true"
        id="field-a11y-title"
        placeholder="제목"
      />
      <FieldDescription id="field-a11y-title-help">
        저장 전 사용자에게 보이는 이름을 확인한다.
      </FieldDescription>
      <FieldError id="field-a11y-title-error">
        제목은 비워둘 수 없다.
      </FieldError>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const input = within(canvasElement).getByRole("textbox", { name: "제목" })

    await expect(input).toHaveAccessibleDescription(
      /저장 전 사용자에게 보이는 이름을 확인한다\.[\s\S]*제목은 비워둘 수 없다\./u
    )
    await expect(input).toHaveAttribute("aria-invalid", "true")
  },
}
