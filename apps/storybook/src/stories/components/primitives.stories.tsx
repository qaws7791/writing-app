import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Callout,
  CalloutContent,
  CalloutTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Spinner,
  Surface,
  Textarea,
} from "@workspace/ui"

const meta = {
  title: "Components/Primitives",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const SurfaceAndFeedback: Story = {
  render: () => (
    <div className="grid max-w-4xl gap-5 md:grid-cols-2">
      <Surface variant="panel" className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-title-lg font-black">Surface</h2>
            <p className="text-body-sm font-medium text-fg-muted">
              panel variant와 badge 조합
            </p>
          </div>
          <Badge tone="selected">선택됨</Badge>
        </div>
        <Separator />
        <div className="flex flex-wrap gap-2">
          <Badge>기본</Badge>
          <Badge tone="success">성공</Badge>
          <Badge tone="danger">위험</Badge>
          <Badge tone="info">정보</Badge>
        </div>
      </Surface>

      <div className="grid gap-4">
        <Alert tone="danger">
          <AlertTitle>삭제할 수 없음</AlertTitle>
          <AlertDescription>연결된 항목을 먼저 정리해야 한다.</AlertDescription>
        </Alert>
        <Callout tone="info">
          <CalloutTitle>작성 참고</CalloutTitle>
          <CalloutContent>
            공용 callout은 문구를 갖지 않고 tone과 anatomy만 제공한다.
          </CalloutContent>
        </Callout>
      </div>
    </div>
  ),
}

export const FormControls: Story = {
  render: () => (
    <Surface variant="panel" className="grid max-w-xl gap-5">
      <Field>
        <FieldLabel htmlFor="primitive-title">제목</FieldLabel>
        <Input id="primitive-title" placeholder="제목을 입력하세요" />
        <FieldDescription>목록과 상세 화면에 함께 노출된다.</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="primitive-status">상태</FieldLabel>
        <Select defaultValue="draft">
          <SelectTrigger id="primitive-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">초안</SelectItem>
            <SelectItem value="published">공개</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field data-invalid>
        <FieldLabel htmlFor="primitive-body">본문</FieldLabel>
        <Textarea
          id="primitive-body"
          aria-invalid="true"
          aria-describedby="primitive-body-error"
          placeholder="본문을 입력하세요"
        />
        <FieldError id="primitive-body-error">본문을 입력하세요.</FieldError>
      </Field>

      <div className="flex justify-end gap-2">
        <Button variant="outline">취소</Button>
        <Button>저장</Button>
      </div>
    </Surface>
  ),
}

export const UtilityPrimitives: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-5">
      <Avatar>
        <AvatarFallback>ㄱㄱ</AvatarFallback>
      </Avatar>
      <Spinner label="불러오는 중" />
      <Separator decorative={false} orientation="vertical" className="h-10" />
      <Button variant="outline">
        <Spinner aria-hidden className="size-3" />
        처리 중
      </Button>
    </div>
  ),
}
