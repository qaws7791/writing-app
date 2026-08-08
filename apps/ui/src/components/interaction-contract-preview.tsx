"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/registry/luma/ui/accordion";
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
} from "@/registry/luma/ui/alert-dialog";
import { Button } from "@/registry/luma/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/luma/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/registry/luma/ui/dropdown-menu";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/registry/luma/ui/field";
import { Input } from "@/registry/luma/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/registry/luma/ui/popover";
import { Progress, ProgressLabel, ProgressValue } from "@/registry/luma/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/luma/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/luma/ui/tabs";

export const interactionContracts = [
  "accordion",
  "alert-dialog",
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
