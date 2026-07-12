import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, waitFor, within } from "storybook/test"
import {
  Cloud,
  CreditCard,
  Keyboard,
  Link,
  LogOut,
  Mail,
  MessageSquare,
  PlusCircle,
  Settings,
  User,
  UserPlus,
  Users,
} from "lucide-react"

import { Button } from "@workspace/ui/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu"

const meta = {
  title: "Components/UI/DropdownMenu",
  component: DropdownMenu,
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline">내 계정 메뉴</Button>}
      />
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>내 계정</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User />
            <span>프로필</span>
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard />
            <span>결제 정보</span>
            <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings />
            <span>설정</span>
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Keyboard />
            <span>단축키</span>
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Cloud />
          <span>API (비활성화)</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <LogOut />
          <span>로그아웃</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}

export const Checkboxes: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [showStatusBar, setShowStatusBar] = React.useState<boolean>(true)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [showActivityBar, setShowActivityBar] = React.useState<boolean>(false)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [showPanel, setShowPanel] = React.useState<boolean>(true)

    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline">뷰 옵션</Button>}
        />
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>레이아웃 설정</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={showStatusBar}
            onCheckedChange={setShowStatusBar}
          >
            상태 표시줄 활성화
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={showActivityBar}
            onCheckedChange={setShowActivityBar}
          >
            액티비티 바 표시
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={showPanel}
            onCheckedChange={setShowPanel}
          >
            하단 콘솔 패널
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
}

export const RadioGroup: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [position, setPosition] = React.useState<string>("bottom")

    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline">도크 정렬</Button>}
        />
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>도크 위치</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
            <DropdownMenuRadioItem value="top">
              상단 (Top)
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="bottom">
              하단 (Bottom)
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="left">
              좌측 (Left)
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="right">
              우측 (Right)
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
}

export const Submenu: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline">사용자 초대</Button>}
      />
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>공유 & 초대</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <UserPlus />
              <span>사용자 초대</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>
                  <Mail />
                  <span>이메일 전송</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageSquare />
                  <span>메시지 전송</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <PlusCircle />
                  <span>더 보기...</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem>
            <Users />
            <span>팀 스페이스 공유</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}

export const ComplexOverlay: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [theme, setTheme] = React.useState<string>("system")
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [notifications, setNotifications] = React.useState<boolean>(true)

    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline">고급 설정</Button>}
        />
        <DropdownMenuContent className="w-64">
          <DropdownMenuLabel>프로젝트 설정</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Settings />
              <span>워크스페이스 관리</span>
              <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <UserPlus />
                <span>팀원 초대</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>
                    <Mail />
                    <span>이메일</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link />
                    <span>외부 링크 연동</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>환경설정</DropdownMenuLabel>

          <DropdownMenuCheckboxItem
            checked={notifications}
            onCheckedChange={setNotifications}
          >
            알림 활성화
          </DropdownMenuCheckboxItem>

          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>테마 설정</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="light">
                    라이트 모드
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    다크 모드
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">
                    시스템 설정
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <LogOut />
            <span>연결 해제</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
}

export const FormInteraction: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button data-testid="trigger-btn">메뉴 열기</Button>}
      />
      <DropdownMenuContent className="w-56" data-testid="menu-content">
        <DropdownMenuItem data-testid="item-profile">프로필</DropdownMenuItem>
        <DropdownMenuItem data-testid="item-settings">설정</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByTestId("trigger-btn")

    // 드롭다운 메뉴 열기
    await userEvent.click(trigger)

    // 포털 레이어 확인
    const body = within(document.body)
    const profileItem = await body.findByTestId("item-profile")
    await expect(profileItem).toBeInTheDocument()

    // 설정 메뉴 아이템 클릭
    const settingsItem = body.getByTestId("item-settings")
    await userEvent.click(settingsItem)

    await waitFor(() => expect(profileItem).not.toBeInTheDocument())
  },
}
