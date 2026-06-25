import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog"
import { ChoiceCard, ChoiceCardGroup } from "./choice-card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { RichText } from "./rich-text"
import { StickyActionBar } from "./sticky-action-bar"

describe("web pattern primitives", () => {
  it("opens dropdown menu content from a trigger", async () => {
    const user = userEvent.setup()

    render(
      <DropdownMenu>
        <DropdownMenuTrigger>계정</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>프로필</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    await user.click(screen.getByRole("button", { name: "계정" }))

    expect(screen.getByRole("menu")).toBeInTheDocument()
    expect(screen.getByRole("menuitem", { name: "프로필" })).toHaveAttribute(
      "data-slot",
      "dropdown-menu-item"
    )
  })

  it("renders alert dialog with accessible title and actions", async () => {
    const user = userEvent.setup()

    render(
      <AlertDialog>
        <AlertDialogTrigger>나가기</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>학습을 나갈까요?</AlertDialogTitle>
          <AlertDialogDescription>
            저장된 지점부터 다시 시작할 수 있습니다.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction>나가기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )

    await user.click(screen.getByRole("button", { name: "나가기" }))

    expect(
      screen.getByRole("alertdialog", { name: "학습을 나갈까요?" })
    ).toBeInTheDocument()
    expect(
      screen.getByText("저장된 지점부터 다시 시작할 수 있습니다.")
    ).toBeInTheDocument()
  })

  it("exposes choice and sticky action state through data attributes", () => {
    render(
      <>
        <ChoiceCardGroup aria-label="정답 선택">
          <ChoiceCard state="selected">첫 번째 선택지</ChoiceCard>
        </ChoiceCardGroup>
        <StickyActionBar tone="success">정답 피드백</StickyActionBar>
      </>
    )

    expect(screen.getByRole("group", { name: "정답 선택" })).toHaveAttribute(
      "data-slot",
      "choice-card-group"
    )
    expect(
      screen.getByRole("button", { name: "첫 번째 선택지" })
    ).toHaveAttribute("data-state", "selected")
    expect(screen.getByText("정답 피드백")).toHaveAttribute(
      "data-tone",
      "success"
    )
  })

  it("keeps rich text as a simple wrapper around markdown output", () => {
    render(
      <RichText>
        <p>문장을 읽고 핵심을 찾으세요.</p>
      </RichText>
    )

    expect(
      screen.getByText("문장을 읽고 핵심을 찾으세요.").parentElement
    ).toHaveAttribute("data-slot", "rich-text")
  })
})
