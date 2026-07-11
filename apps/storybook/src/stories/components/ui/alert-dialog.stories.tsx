import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import { AlertTriangle, Info } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "@workspace/ui"

const meta = {
  title: "Components/UI/AlertDialog",
  component: AlertDialog,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof AlertDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="outline">대화상자 열기</Button>}
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>정말로 진행하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            이 작업은 되돌릴 수 없습니다. 서버에서 귀하의 계정이 영구적으로
            삭제되며 데이터가 복구되지 않습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction>계속하기</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

export const WithMedia: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="destructive">경고 대화상자 열기</Button>}
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <AlertTriangle />
          </AlertDialogMedia>
          <AlertDialogTitle>콘텐츠 영구 삭제</AlertDialogTitle>
          <AlertDialogDescription>
            작성 중이던 모든 피드백과 글쓰기 이력이 영구적으로 삭제됩니다.
            계속해서 삭제를 진행하시겠습니까?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>돌아가기</AlertDialogCancel>
          <AlertDialogAction variant="destructive">삭제하기</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

export const SmallSize: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="outline">소형 대화상자</Button>}
      />
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-info/10 text-info">
            <Info className="size-6 text-blue-500" />
          </AlertDialogMedia>
          <AlertDialogTitle>안내 사항</AlertDialogTitle>
          <AlertDialogDescription>
            임시 저장된 데이터를 불러왔습니다. 확인을 누르면 이어서 작성을
            시작합니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction>확인</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

export const LessonExit: Story = {
  render: () => (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogTitle>학습을 중단할까요?</AlertDialogTitle>
        <AlertDialogDescription>
          진행 상황은 자동으로 저장되어 있어요.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>계속 학습</AlertDialogCancel>
          <AlertDialogAction>나가기</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
}

export const FormInteraction: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button data-testid="trigger-btn">인터랙션 테스트</Button>}
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>중요 알림</AlertDialogTitle>
          <AlertDialogDescription>
            사용자 테스트 시나리오 동작 확인을 위한 대화상자입니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="cancel-btn">취소</AlertDialogCancel>
          <AlertDialogAction data-testid="confirm-btn">확인</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByTestId("trigger-btn")

    // 대화상자 열기 클릭
    await userEvent.click(trigger)

    // 포털로 생성되는 다이얼로그 내용을 document.body에서 탐색
    const body = within(document.body)
    const title = await body.findByText("중요 알림")
    await expect(title).toBeInTheDocument()

    const cancelBtn = body.getByTestId("cancel-btn")
    // 취소 버튼 클릭하여 대화상자 닫기
    await userEvent.click(cancelBtn)

    await waitFor(() => expect(title).not.toBeInTheDocument())
  },
}
