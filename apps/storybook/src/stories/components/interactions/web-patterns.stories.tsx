import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  ChoiceCard,
  ChoiceCardGroup,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  RichText,
  StickyActionBar,
  Surface,
} from "@workspace/ui"

const meta = {
  title: "Interactions/Web Patterns",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const MenuAndDialog: Story = {
  render: () => (
    <Surface variant="panel" className="flex max-w-lg items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger className="bg-bg-surface hover:bg-bg-surface-hover">
          계정
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>프로필</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem tone="danger">로그아웃</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="outline" />}>
          나가기
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>학습을 나갈까요?</AlertDialogTitle>
          <AlertDialogDescription>
            저장된 지점부터 다시 시작할 수 있습니다.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction variant="destructive">나가기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Surface>
  ),
}

export const LessonPatterns: Story = {
  render: () => (
    <div className="grid max-w-xl gap-5">
      <ChoiceCardGroup aria-label="정답 선택">
        <ChoiceCard state="idle">문장의 중심 내용이 분명하다.</ChoiceCard>
        <ChoiceCard state="selected">근거가 주장을 뒷받침한다.</ChoiceCard>
        <ChoiceCard state="correct">독자의 질문을 예상한다.</ChoiceCard>
        <ChoiceCard state="wrong">문단마다 다른 주제를 섞는다.</ChoiceCard>
      </ChoiceCardGroup>

      <RichText>
        <h3>읽기 자료</h3>
        <p>
          긴 학습 본문은 앱이 markdown을 렌더링하고, 공용 wrapper가 토큰 기반
          typography를 맡는다.
        </p>
      </RichText>

      <StickyActionBar tone="success" className="rounded-card">
        <p className="mb-3 text-title-md font-black">정확해요!</p>
        <Button className="w-full">계속하기</Button>
      </StickyActionBar>
    </div>
  ),
}
