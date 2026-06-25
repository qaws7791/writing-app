import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FormSection,
  Input,
  NativeSelect,
  Textarea,
} from "@workspace/ui"

import { KeyboardTable } from "../../../blocks/keyboard-table"

const meta = {
  title: "Components/Forms/Field",
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
      <Field invalid>
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
    <FormSection className="max-w-2xl rounded-panel border border-border-subtle bg-bg-surface p-surface-padding-md">
      <div>
        <h2 className="text-title-lg font-black">코스 정보</h2>
        <p className="text-body-sm font-medium text-fg-muted">
          같은 주제의 필드는 FormSection과 FieldGroup으로 묶는다.
        </p>
      </div>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="field-group-title">제목</FieldLabel>
          <Input id="field-group-title" placeholder="문장의 중심 찾기" />
        </Field>
        <Field>
          <FieldLabel htmlFor="field-group-status">상태</FieldLabel>
          <NativeSelect id="field-group-status" defaultValue="draft">
            <option value="draft">초안</option>
            <option value="published">공개</option>
          </NativeSelect>
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
    </FormSection>
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
    <div className="grid max-w-3xl gap-6">
      <Field invalid>
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
      <KeyboardTable
        rows={[
          {
            action: "라벨 다음의 입력 컨트롤로 초점이 이동한다.",
            keyName: "Tab",
          },
          {
            action: "이전 컨트롤로 초점이 돌아간다.",
            keyName: "Shift + Tab",
          },
        ]}
      />
    </div>
  ),
}
