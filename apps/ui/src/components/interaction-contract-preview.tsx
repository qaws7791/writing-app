"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/primitives/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/primitives/alert-dialog";
import { Button } from "@workspace/ui/components/primitives/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/primitives/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/primitives/dropdown-menu";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/primitives/field";
import { Input } from "@workspace/ui/components/primitives/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/primitives/popover";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@workspace/ui/components/primitives/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/primitives/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/primitives/tabs";
import {
  ComposeCanvas,
  ComposeFeedbackMarksPlugin,
} from "@workspace/ui/components/learning/compose-canvas";
import { useState } from "react";

export const interactionContracts = [
  "accordion",
  "alert-dialog",
  "compose-canvas",
  "compose-feedback-marks",
  "dialog",
  "dropdown-menu",
  "field",
  "popover",
  "progress",
  "select",
  "tabs",
] as const;
export type InteractionContract = (typeof interactionContracts)[number];

export default function InteractionContractPreview({
  contract,
}: {
  contract: InteractionContract;
}) {
  switch (contract) {
    case "accordion":
      return (
        <Accordion className="max-w-2xl">
          <AccordionItem value="lesson-1">
            <AccordionTrigger>확인할 항목</AccordionTrigger>
            <AccordionContent>클릭하면 표시되는 내용이다.</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    case "alert-dialog":
      return (
        <AlertDialog>
          <AlertDialogTrigger render={<Button />}>인터랙션 테스트</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>중요 알림</AlertDialogTitle>
              <AlertDialogDescription>
                사용자 테스트 시나리오 동작 확인을 위한 대화상자입니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction>확인</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    case "compose-canvas":
      return <ComposeCanvasContract />;
    case "compose-feedback-marks":
      return <ComposeFeedbackMarksContract />;
    case "dialog":
      return (
        <Dialog>
          <DialogTrigger render={<Button />}>프로필 수정</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>프로필을 수정할까요?</DialogTitle>
              <DialogDescription>
                저장하면 새 프로필 정보가 학습자 화면에 표시됩니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>취소</DialogClose>
              <DialogClose render={<Button />}>저장</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    case "dropdown-menu":
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button />}>메뉴 열기</DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem>프로필</DropdownMenuItem>
            <DropdownMenuItem>설정</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    case "field":
      return (
        <Field data-invalid>
          <FieldLabel htmlFor="field-a11y-title">제목</FieldLabel>
          <Input
            id="field-a11y-title"
            aria-describedby="field-a11y-title-help field-a11y-title-error"
            aria-invalid="true"
            placeholder="제목"
          />
          <FieldDescription id="field-a11y-title-help">
            저장 전 사용자에게 보이는 이름을 확인한다.
          </FieldDescription>
          <FieldError id="field-a11y-title-error">제목은 비워둘 수 없다.</FieldError>
        </Field>
      );
    case "popover":
      return (
        <Popover>
          <PopoverTrigger render={<Button />}>학습 도움말</PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>문장의 중심 찾기</PopoverTitle>
              <PopoverDescription>
                반복되는 낱말과 문단의 첫 문장을 먼저 확인하세요.
              </PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      );
    case "progress":
      return (
        <Progress aria-label="전체 코스 진행률" className="max-w-3xl" value={58}>
          <ProgressLabel>전체 코스 진행률</ProgressLabel>
          <ProgressValue />
        </Progress>
      );
    case "select":
      return (
        <Field data-invalid>
          <FieldLabel htmlFor="select-interaction">상태</FieldLabel>
          <Select
            items={[
              { label: "초안", value: "draft" },
              { label: "공개", value: "published" },
            ]}
          >
            <SelectTrigger
              id="select-interaction"
              aria-describedby="select-interaction-error"
              aria-invalid="true"
            >
              <SelectValue placeholder="상태 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">초안</SelectItem>
              <SelectItem value="published">공개</SelectItem>
            </SelectContent>
          </Select>
          <FieldError id="select-interaction-error">상태를 선택해야 한다.</FieldError>
        </Field>
      );
    case "tabs":
      return (
        <Tabs className="w-[400px] max-w-full" defaultValue="in_progress">
          <TabsList>
            <TabsTrigger value="in_progress">진행중</TabsTrigger>
            <TabsTrigger value="completed">완료</TabsTrigger>
          </TabsList>
          <TabsContent value="in_progress">진행 중인 학습 목록</TabsContent>
          <TabsContent value="completed">완료한 학습 목록</TabsContent>
        </Tabs>
      );
  }
}

function ComposeCanvasContract() {
  const [value, setValue] = useState("");

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <ComposeCanvas
        aria-label="본문"
        className="min-h-64 rounded-3xl border border-border/40 bg-card"
        id="compose-canvas-contract"
        onChange={setValue}
        placeholder="여기에 글을 씁니다."
        value={value}
      />
      <p data-testid="compose-canvas-value">{value}</p>
      <Button type="button">다음 칸</Button>
    </div>
  );
}

function ComposeFeedbackMarksContract() {
  const [value, setValue] = useState("반대하는 사람도 있다. 그래서 저는 숙제를 줄여야 해요.");
  const [items, setItems] = useState([
    {
      example: "어떤 부담인지 한 예를 붙입니다.",
      id: "revision-0",
      quote: "반대하는 사람도 있다.",
      reason: "반론이 한 문장으로 끝납니다.",
      title: "반론을 구체화하세요",
    },
    {
      example: "격식체를 맞춥니다.",
      id: "revision-1",
      quote: "그래서 저는 숙제를 줄여야 해요.",
      reason: "한 문장만 해요로 바뀝니다.",
      title: "격식체를 맞추세요",
    },
  ]);

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <ComposeCanvas
        aria-label="본문"
        className="min-h-64 rounded-3xl border border-border/40 bg-card"
        id="compose-feedback-marks-contract"
        onChange={setValue}
        value={value}
      >
        <ComposeFeedbackMarksPlugin
          items={items}
          onDismiss={(id) => setItems((current) => current.filter((item) => item.id !== id))}
        />
      </ComposeCanvas>
    </div>
  );
}
