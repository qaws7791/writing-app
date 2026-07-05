import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input, Label } from "@workspace/ui"

const meta = {
  title: "Components/UI/Label",
  component: Label,
  args: {
    children: "라벨 텍스트",
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

/**
 * 기본 Playground 스토리입니다.
 */
export const Playground: Story = {
  args: {
    children: "기본 라벨",
  },
}

/**
 * 가장 널리 사용되는 Input 필드와의 결합 형태입니다.
 * Label의 `htmlFor` 속성에 Input의 `id`를 매핑하여 라벨 클릭 시 인풋이 포커스되도록 합니다.
 */
export const WithInput: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-2">
      <Label htmlFor="email-input">이메일 주소</Label>
      <Input type="email" id="email-input" placeholder="example@email.com" />
    </div>
  ),
}

/**
 * Checkbox와의 결합 형태입니다.
 * 가로로 배치되며, `flex items-center gap-2`의 내부 스타일이 적용되어 깔끔하게 정렬됩니다.
 */
export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        id="terms-checkbox"
        className="peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
      <Label htmlFor="terms-checkbox" className="cursor-pointer">
        이용 약관 및 개인정보 처리방침에 동의합니다.
      </Label>
    </div>
  ),
}

/**
 * 필수 입력 항목을 표시하는 예제입니다.
 * 라벨 텍스트 뒤에 붉은색 별 기호(*)를 추가하여 시각적으로 인지할 수 있게 돕습니다.
 */
export const RequiredField: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-2">
      <Label htmlFor="required-username">
        사용자 이름 <span className="text-destructive font-semibold">*</span>
      </Label>
      <Input type="text" id="required-username" placeholder="홍길동" required />
    </div>
  ),
}

/**
 * 필드가 비활성화되었을 때 라벨의 반응성을 확인하는 스토리입니다.
 * Label 컴포넌트는 인접한 피어 요소가 disabled되면 `peer-disabled:opacity-50` 스타일을 통해
 * 자동으로 투명도가 조절되며 선택이 불가능해집니다.
 */
export const DisabledState: Story = {
  render: () => (
    <div className="grid gap-6 max-w-sm">
      <div className="grid w-full items-center gap-2">
        <Label htmlFor="disabled-input">비활성 입력 필드</Label>
        <Input
          type="text"
          id="disabled-input"
          disabled
          placeholder="입력할 수 없습니다"
          className="peer"
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="disabled-checkbox"
          disabled
          className="peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Label htmlFor="disabled-checkbox">비활성 체크박스 라벨</Label>
      </div>
    </div>
  ),
}
