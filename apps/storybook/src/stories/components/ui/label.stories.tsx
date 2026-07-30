import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "@workspace/ui/components/ui/input"
import { Label } from "@workspace/ui/components/ui/label"

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
 * 필수 입력 항목을 표시하는 예제입니다.
 * 라벨 텍스트 뒤에 danger 토큰 색상의 별 기호(*)를 추가하여 시각적으로 인지할 수 있게 돕습니다.
 */
export const RequiredField: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-2">
      <Label htmlFor="required-username">
        사용자 이름 <span className="text-danger-fg font-semibold">*</span>
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
    <div className="grid w-full max-w-sm items-center gap-2">
      <Label htmlFor="disabled-input">비활성 입력 필드</Label>
      <Input
        type="text"
        id="disabled-input"
        disabled
        placeholder="입력할 수 없습니다"
        className="peer"
      />
    </div>
  ),
}
