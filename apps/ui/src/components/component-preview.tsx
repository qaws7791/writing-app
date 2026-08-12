"use client";

import { lazy, Suspense, useMemo, useState, type ComponentType } from "react";
import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  File01Icon,
  InformationCircleIcon,
  MoreHorizontalIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { AdminPreview, isAdminPreview } from "@/src/components/admin-demos";
import { isLearningPreview, LearningPreview } from "@/src/components/learning-demos";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/primitives/accordion";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/primitives/alert";
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
import { AspectRatio } from "@workspace/ui/components/primitives/aspect-ratio";
import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@workspace/ui/components/primitives/attachment";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@workspace/ui/components/primitives/avatar";
import { Badge } from "@workspace/ui/components/primitives/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/primitives/breadcrumb";
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
  BubbleReactions,
} from "@workspace/ui/components/primitives/bubble";
import { Button } from "@workspace/ui/components/primitives/button";
import {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "@workspace/ui/components/primitives/button-group";
import { Calendar } from "@workspace/ui/components/primitives/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/primitives/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/primitives/chart";
import { Checkbox } from "@workspace/ui/components/primitives/checkbox";
import {
  Choice,
  ChoiceContent,
  ChoiceGroup,
  ChoiceLabel,
} from "@workspace/ui/components/learning/choice";
import {
  Classify,
  ClassifyCategories,
  ClassifyCategory,
  ClassifyItem,
  ClassifyItemLabel,
  ClassifyItemTag,
  ClassifyPool,
} from "@workspace/ui/components/learning/classify";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/primitives/collapsible";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@workspace/ui/components/primitives/combobox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/primitives/command";
import {
  Compare,
  ComparePanel,
  CompareVersion,
  CompareVersionList,
  CompareVersions,
} from "@workspace/ui/components/learning/compare";
import { Compose, ComposeEditor, ComposeMeter } from "@workspace/ui/components/learning/compose";
import {
  Dialog,
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/primitives/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/primitives/empty";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/primitives/field";
import { Input } from "@workspace/ui/components/primitives/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@workspace/ui/components/primitives/input-group";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@workspace/ui/components/primitives/input-otp";
import {
  Insight,
  InsightDescription,
  InsightEyebrow,
  InsightTitle,
} from "@workspace/ui/components/learning/insight";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/primitives/item";
import { Kbd, KbdGroup } from "@workspace/ui/components/primitives/kbd";
import { Label } from "@workspace/ui/components/primitives/label";
import {
  Lesson,
  LessonActions,
  LessonBody,
  LessonClose,
  LessonFooter,
  LessonHeader,
  LessonMeta,
  LessonProgress,
} from "@workspace/ui/components/learning/lesson";
import { Marker, MarkerContent, MarkerIcon } from "@workspace/ui/components/primitives/marker";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@workspace/ui/components/primitives/message";
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@workspace/ui/components/primitives/message-scroller";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@workspace/ui/components/primitives/navigation-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/primitives/pagination";
import {
  PairBoard,
  PairColumn,
  PairItem,
  PairLabel,
  PairMarker,
} from "@workspace/ui/components/learning/pair";
import {
  Path,
  PathConnector,
  PathNode,
  PathNodeMeta,
  PathNodeTitle,
  PathStep,
  PathTrail,
  PathUnit,
  PathUnitDescription,
  PathUnitHeader,
  PathUnitTitle,
} from "@workspace/ui/components/learning/path";
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
import { Prose, ProseBody, ProseSource } from "@workspace/ui/components/learning/prose";
import { RadioGroup, RadioGroupItem } from "@workspace/ui/components/primitives/radio-group";
import { ScrollArea } from "@workspace/ui/components/primitives/scroll-area";
import { Segment, SegmentGroup } from "@workspace/ui/components/learning/segment";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/primitives/select";
import { Separator } from "@workspace/ui/components/primitives/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/primitives/sheet";
import {
  SidebarCard,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuChevron,
  SidebarMenuItem,
  SidebarMenuStatus,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSearch,
} from "@workspace/ui/components/primitives/sidebar";
import { Skeleton } from "@workspace/ui/components/primitives/skeleton";
import { Slider } from "@workspace/ui/components/primitives/slider";
import {
  Sortable,
  SortableContent,
  SortableHandle,
  SortableItem,
} from "@workspace/ui/components/learning/sortable";
import { Spinner } from "@workspace/ui/components/primitives/spinner";
import {
  Step,
  StepActions,
  StepBody,
  StepHeader,
  StepTitle,
} from "@workspace/ui/components/learning/step";
import { Switch } from "@workspace/ui/components/primitives/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/primitives/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/primitives/tabs";
import { Textarea } from "@workspace/ui/components/primitives/textarea";
import { Toaster, toast } from "@workspace/ui/components/primitives/toast";
import {
  Token,
  TokenBank,
  TokenSentence,
  TokenSlot,
} from "@workspace/ui/components/learning/token";
import { Toggle } from "@workspace/ui/components/primitives/toggle";
import { ToggleGroup, ToggleGroupItem } from "@workspace/ui/components/primitives/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/primitives/tooltip";

type ComponentPreviewProps = { slug: string; example?: string };

type ExampleModule = { default: ComponentType };

const exampleModules = import.meta.glob<ExampleModule>(
  "/src/generated/component-examples/**/*.tsx",
);

const frameworks = ["Astro", "React", "Vite", "Next.js"];
const chartData = [
  { month: "1월", value: 48 },
  { month: "2월", value: 72 },
  { month: "3월", value: 58 },
  { month: "4월", value: 86 },
];

const sortablePreviewItems = [
  { id: "claim", label: "주장 제시" },
  { id: "reason", label: "근거 제시" },
  { id: "close", label: "결론" },
] as const;

function GeneratedExamplePreview({ slug, example }: Required<ComponentPreviewProps>) {
  const loader = exampleModules[`/src/generated/component-examples/${slug}/${example}.tsx`];
  const Example = useMemo(() => (loader ? lazy(loader) : undefined), [loader]);

  if (!Example) return <DefaultComponentPreview slug={slug} />;

  const isSidebarDemo = slug === "sidebar";

  return (
    <Suspense
      fallback={
        <output data-preview-loading className="h-10 w-40 animate-pulse rounded-xl bg-muted">
          <span className="sr-only">예제 불러오는 중</span>
        </output>
      }
    >
      {isSidebarDemo ? (
        <div className="relative h-[32rem] w-full overflow-hidden rounded-3xl border border-border/80 bg-background [transform:translateZ(0)]">
          <Example />
        </div>
      ) : (
        <div className="flex w-full items-center justify-center">
          <Example />
        </div>
      )}
    </Suspense>
  );
}

export default function ComponentPreview({ slug, example }: ComponentPreviewProps) {
  if (example) return <GeneratedExamplePreview slug={slug} example={example} />;
  return <DefaultComponentPreview slug={slug} />;
}

function DefaultComponentPreview({ slug }: { slug: string }) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [sortableOrder, setSortableOrder] = useState(["claim", "reason", "close"]);

  if (isAdminPreview(slug)) {
    return <AdminPreview slug={slug} />;
  }

  if (isLearningPreview(slug)) {
    return <LearningPreview slug={slug} />;
  }

  switch (slug) {
    case "accordion":
      return (
        <Accordion defaultValue={["shipping"]} className="w-full max-w-lg">
          <AccordionItem value="shipping">
            <AccordionTrigger>배송 옵션은 무엇인가요?</AccordionTrigger>
            <AccordionContent>일반 배송과 빠른 배송을 선택할 수 있습니다.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="return">
            <AccordionTrigger>반품 정책은 어떻게 되나요?</AccordionTrigger>
            <AccordionContent>수령 후 14일 안에 무료로 반품할 수 있습니다.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="support">
            <AccordionTrigger>고객 지원에 어떻게 연락하나요?</AccordionTrigger>
            <AccordionContent>평일 오전 9시부터 오후 6시까지 운영합니다.</AccordionContent>
          </AccordionItem>
        </Accordion>
      );
    case "alert":
      return (
        <Alert className="max-w-lg">
          <HugeiconsIcon icon={InformationCircleIcon} />
          <AlertTitle>새 버전을 사용할 수 있습니다.</AlertTitle>
          <AlertDescription>변경 사항을 확인한 후 안전하게 업데이트하세요.</AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline">
              확인
            </Button>
          </AlertAction>
        </Alert>
      );
    case "alert-dialog":
      return (
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" />}>
            프로젝트 삭제
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정말 삭제할까요?</AlertDialogTitle>
              <AlertDialogDescription>이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction>삭제</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    case "aspect-ratio":
      return (
        <AspectRatio ratio={16 / 9} className="max-w-xl overflow-hidden rounded-3xl bg-muted">
          <div className="hero-grid grid place-items-center">
            <span className="font-heading text-2xl font-semibold">16 : 9</span>
          </div>
        </AspectRatio>
      );
    case "attachment":
      return (
        <Attachment>
          <AttachmentMedia>
            <HugeiconsIcon icon={File01Icon} />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>design-system.pdf</AttachmentTitle>
            <AttachmentDescription>2.4 MB · 업로드 완료</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      );
    case "avatar":
      return (
        <AvatarGroup>
          <Avatar>
            <AvatarFallback>김</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>이</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>박</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>+4</AvatarGroupCount>
        </AvatarGroup>
      );
    case "badge":
      return (
        <div className="flex flex-wrap gap-2">
          <Badge>공개</Badge>
          <Badge variant="secondary">초안</Badge>
          <Badge variant="outline">보관됨</Badge>
          <Badge variant="ghost">내부용</Badge>
          <Badge variant="success">완료</Badge>
          <Badge variant="warning">주의</Badge>
          <Badge variant="info">안내</Badge>
          <Badge variant="purple">실험</Badge>
          <Badge variant="destructive">실패</Badge>
        </div>
      );
    case "breadcrumb":
      return (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">문서</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">컴포넌트</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
    case "bubble":
      return (
        <BubbleGroup className="w-full max-w-md">
          <Bubble variant="secondary">
            <BubbleContent>오늘 일정 요약을 보여주세요.</BubbleContent>
          </Bubble>
          <Bubble align="end">
            <BubbleContent>오후 2시 디자인 리뷰와 4시 회고가 있습니다.</BubbleContent>
            <BubbleReactions>👍 2</BubbleReactions>
          </Bubble>
        </BubbleGroup>
      );
    case "button":
      return (
        <div className="flex flex-wrap gap-3">
          <Button>기본 버튼</Button>
          <Button variant="secondary">보조 버튼</Button>
          <Button variant="outline">외곽선</Button>
          <Button variant="ghost">고스트</Button>
        </div>
      );
    case "button-group":
      return (
        <ButtonGroup>
          <Button variant="outline">저장</Button>
          <ButtonGroupSeparator />
          <ButtonGroupText>⌘S</ButtonGroupText>
          <Button variant="outline" size="icon">
            <HugeiconsIcon icon={MoreHorizontalIcon} />
          </Button>
        </ButtonGroup>
      );
    case "calendar":
      return (
        <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-3xl border" />
      );
    case "card":
      return (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>이번 주 진행률</CardTitle>
            <CardDescription>목표 12개 중 8개를 완료했습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={67}>
              <ProgressLabel>완료</ProgressLabel>
              <ProgressValue />
            </Progress>
          </CardContent>
          <CardFooter>
            <Button className="w-full">작업 보기</Button>
          </CardFooter>
        </Card>
      );
    case "chart":
      return (
        <ChartContainer
          className="h-64 w-full max-w-lg"
          config={{ value: { label: "방문", color: "var(--primary)" } }}
        >
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={8} />
          </BarChart>
        </ChartContainer>
      );
    case "checkbox":
      return (
        <label htmlFor="preview-terms" className="flex items-center gap-3 text-sm">
          <Checkbox id="preview-terms" defaultChecked />
          이용약관에 동의합니다.
        </label>
      );
    case "choice":
      return (
        <ChoiceGroup type="single" className="w-full max-w-md">
          <Choice mode="single" selected>
            <ChoiceContent>
              <ChoiceLabel>주장을 먼저 밝히고 근거를 붙인다</ChoiceLabel>
            </ChoiceContent>
          </Choice>
          <Choice mode="single">
            <ChoiceContent>
              <ChoiceLabel>감정을 강조해 설득력을 높인다</ChoiceLabel>
            </ChoiceContent>
          </Choice>
        </ChoiceGroup>
      );
    case "classify":
      return (
        <Classify className="w-full max-w-md">
          <ClassifyCategories>
            <ClassifyCategory state="active">주장</ClassifyCategory>
            <ClassifyCategory>근거</ClassifyCategory>
          </ClassifyCategories>
          <ClassifyPool>
            <ClassifyItem state="placed">
              <ClassifyItemLabel>학교는 토론을 늘려야 한다</ClassifyItemLabel>
              <ClassifyItemTag>주장</ClassifyItemTag>
            </ClassifyItem>
            <ClassifyItem>
              <ClassifyItemLabel>참여 학생이 늘었다는 조사</ClassifyItemLabel>
            </ClassifyItem>
          </ClassifyPool>
        </Classify>
      );
    case "collapsible":
      return (
        <Collapsible className="w-full max-w-md rounded-3xl border p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium">고급 설정</p>
            <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>
              열기
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="pt-4 text-sm text-muted-foreground">
            배포 환경과 캐시 정책을 설정할 수 있습니다.
          </CollapsibleContent>
        </Collapsible>
      );
    case "combobox":
      return (
        <Combobox items={frameworks}>
          <ComboboxInput placeholder="프레임워크 검색" />
          <ComboboxContent>
            <ComboboxEmpty>결과가 없습니다.</ComboboxEmpty>
            <ComboboxList>
              {frameworks.map((framework) => (
                <ComboboxItem key={framework} value={framework}>
                  {framework}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      );
    case "command":
      return (
        <Command className="w-full max-w-md rounded-3xl border">
          <CommandInput placeholder="명령 검색" />
          <CommandList>
            <CommandEmpty>결과가 없습니다.</CommandEmpty>
            <CommandGroup heading="빠른 이동">
              <CommandItem>컴포넌트 열기</CommandItem>
              <CommandItem>테마 변경</CommandItem>
              <CommandItem>레지스트리 복사</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      );
    case "compare":
      return (
        <Compare className="w-full max-w-md">
          <CompareVersions defaultValue="a">
            <CompareVersionList>
              <CompareVersion value="a">초고</CompareVersion>
              <CompareVersion value="b">다듬은 글</CompareVersion>
            </CompareVersionList>
            <ComparePanel value="a">주장은 뒤에 있고 근거가 앞섭니다.</ComparePanel>
            <ComparePanel value="b">주장을 먼저 두고 근거를 붙였습니다.</ComparePanel>
          </CompareVersions>
        </Compare>
      );
    case "compose":
      return (
        <Compose className="w-full max-w-md">
          <ComposeEditor placeholder="반박 문단을 작성하세요." defaultValue="숙제 폐지는…" />
          <ComposeMeter value={42} min={80} goal={120} max={200} />
        </Compose>
      );
    case "dialog":
      return (
        <Dialog>
          <DialogTrigger render={<Button />}>프로필 편집</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>프로필 편집</DialogTitle>
              <DialogDescription>공개 프로필에 표시할 정보를 변경합니다.</DialogDescription>
            </DialogHeader>
            <Input defaultValue="홍길동" />
            <DialogFooter>
              <Button>변경 저장</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    case "dropdown-menu":
      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>작업 메뉴</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>프로젝트</DropdownMenuLabel>
              <DropdownMenuItem>
                <HugeiconsIcon icon={Settings02Icon} />
                설정
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">삭제</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    case "empty":
      return (
        <Empty className="w-full max-w-lg">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={File01Icon} />
            </EmptyMedia>
            <EmptyTitle>아직 파일이 없습니다.</EmptyTitle>
            <EmptyDescription>첫 파일을 업로드해 프로젝트를 시작하세요.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button>파일 업로드</Button>
          </EmptyContent>
        </Empty>
      );
    case "field":
      return (
        <FieldGroup className="w-full max-w-md">
          <Field>
            <FieldLabel htmlFor="docs-email">이메일</FieldLabel>
            <Input id="docs-email" type="email" placeholder="name@example.com" />
            <FieldDescription>업데이트 알림을 받을 주소입니다.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="docs-message">메시지</FieldLabel>
            <Textarea id="docs-message" placeholder="내용을 입력하세요." />
          </Field>
        </FieldGroup>
      );
    case "input":
      return <Input className="max-w-sm" placeholder="이메일 주소" type="email" />;
    case "input-group":
      return (
        <InputGroup className="max-w-sm">
          <InputGroupAddon>https://</InputGroupAddon>
          <InputGroupInput placeholder="example.com" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      );
    case "input-otp":
      return (
        <InputOTP maxLength={6}>
          <InputOTPGroup>
            {[0, 1, 2].map((index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            {[3, 4, 5].map((index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      );
    case "insight":
      return (
        <Insight tone="correct" className="w-full max-w-md">
          <InsightEyebrow>해설</InsightEyebrow>
          <InsightTitle>정답입니다</InsightTitle>
          <InsightDescription>
            반박은 상대 주장의 전제를 드러낼 때 설득력이 커집니다.
          </InsightDescription>
        </Insight>
      );
    case "item":
      return (
        <Item className="w-full max-w-lg" variant="outline">
          <ItemMedia variant="icon">
            <HugeiconsIcon icon={File01Icon} />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>brand-guidelines.pdf</ItemTitle>
            <ItemDescription>오늘 오후 2:34 · 4.2 MB</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="ghost" size="icon-sm">
              <HugeiconsIcon icon={MoreHorizontalIcon} />
            </Button>
          </ItemActions>
        </Item>
      );
    case "kbd":
      return (
        <div className="flex items-center gap-3 text-sm">
          <span>명령 팔레트</span>
          <KbdGroup>
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </div>
      );
    case "label":
      return (
        <div className="grid w-full max-w-sm gap-2">
          <Label htmlFor="docs-name">표시 이름</Label>
          <Input id="docs-name" placeholder="홍길동" />
        </div>
      );
    case "lesson":
      return (
        <Lesson className="w-full max-w-md rounded-4xl border border-border/70 px-4 py-4">
          <LessonHeader>
            <LessonClose />
            <LessonProgress value={40} />
            <LessonMeta>2 / 5</LessonMeta>
          </LessonHeader>
          <LessonBody>
            <Step>
              <StepHeader>
                <StepTitle>질문을 고르세요</StepTitle>
              </StepHeader>
            </Step>
          </LessonBody>
          <LessonFooter className="border-0 bg-transparent px-0 py-0 backdrop-blur-none">
            <LessonActions>
              <Button size="sm">확인하기</Button>
            </LessonActions>
          </LessonFooter>
        </Lesson>
      );
    case "marker":
      return (
        <div className="w-full max-w-md space-y-4">
          <Marker variant="separator">
            <MarkerContent>오늘</MarkerContent>
          </Marker>
          <Marker>
            <MarkerIcon>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} />
            </MarkerIcon>
            <MarkerContent>모든 변경 사항이 저장되었습니다.</MarkerContent>
          </Marker>
        </div>
      );
    case "message":
      return (
        <MessageGroup className="w-full max-w-lg">
          <Message>
            <MessageAvatar>
              <Avatar>
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>
              <MessageHeader>Luma Assistant</MessageHeader>
              <Bubble variant="secondary">
                <BubbleContent>무엇을 도와드릴까요?</BubbleContent>
              </Bubble>
              <MessageFooter>방금 전</MessageFooter>
            </MessageContent>
          </Message>
          <Message align="end">
            <MessageContent>
              <Bubble>
                <BubbleContent>오늘 변경 사항을 요약해 주세요.</BubbleContent>
              </Bubble>
            </MessageContent>
          </Message>
        </MessageGroup>
      );
    case "message-scroller":
      return (
        <MessageScrollerProvider>
          <MessageScroller className="h-64 w-full max-w-lg rounded-3xl border">
            <MessageScrollerViewport>
              <MessageScrollerContent className="p-4">
                {[1, 2, 3, 4].map((item) => (
                  <MessageScrollerItem key={item} className="rounded-2xl bg-muted p-4 text-sm">
                    대화 메시지 {item}
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
          </MessageScroller>
        </MessageScrollerProvider>
      );
    case "navigation-menu":
      return (
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>시작하기</NavigationMenuTrigger>
              <NavigationMenuContent className="p-3">
                <div className="grid w-64 gap-1">
                  <NavigationMenuLink href="#" className="rounded-xl p-3 hover:bg-muted">
                    설치
                  </NavigationMenuLink>
                  <NavigationMenuLink href="#" className="rounded-xl p-3 hover:bg-muted">
                    컴포넌트
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#">GitHub</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      );
    case "pagination":
      return (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
    case "pair":
      return (
        <PairBoard className="w-full max-w-lg">
          <PairColumn side="left">
            <PairItem state="active">
              <PairMarker />
              <PairLabel>주장</PairLabel>
            </PairItem>
            <PairItem>
              <PairMarker />
              <PairLabel>근거</PairLabel>
            </PairItem>
          </PairColumn>
          <PairColumn side="right">
            <PairItem>
              <PairMarker />
              <PairLabel>무엇을 말하려는가</PairLabel>
            </PairItem>
            <PairItem state="paired">
              <PairMarker />
              <PairLabel>왜 믿을 수 있는가</PairLabel>
            </PairItem>
          </PairColumn>
        </PairBoard>
      );
    case "path":
      return (
        <Path>
          <PathUnit>
            <PathUnitHeader>
              <PathUnitTitle>유닛 1 · 주장 세우기</PathUnitTitle>
              <PathUnitDescription>한 문장 주장을 또렷하게 쓰는 연습</PathUnitDescription>
            </PathUnitHeader>
            <PathTrail>
              <PathStep>
                <PathNode state="completed">1</PathNode>
                <PathNodeMeta>
                  <PathNodeTitle>주장 고르기</PathNodeTitle>
                </PathNodeMeta>
              </PathStep>
              <PathConnector />
              <PathStep>
                <PathNode state="current">2</PathNode>
                <PathNodeMeta>
                  <PathNodeTitle>근거 붙이기</PathNodeTitle>
                </PathNodeMeta>
              </PathStep>
              <PathConnector />
              <PathStep>
                <PathNode state="locked">3</PathNode>
                <PathNodeMeta>
                  <PathNodeTitle>자기반박</PathNodeTitle>
                </PathNodeMeta>
              </PathStep>
            </PathTrail>
          </PathUnit>
        </Path>
      );
    case "popover":
      return (
        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>상태 변경</PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>프로젝트 상태</PopoverTitle>
              <PopoverDescription>팀에 표시할 현재 상태를 선택하세요.</PopoverDescription>
            </PopoverHeader>
            <RadioGroup defaultValue="active" className="mt-4">
              <label htmlFor="preview-status-active" className="flex items-center gap-2">
                <RadioGroupItem id="preview-status-active" value="active" />
                진행 중
              </label>
              <label htmlFor="preview-status-paused" className="flex items-center gap-2">
                <RadioGroupItem id="preview-status-paused" value="paused" />
                일시 중지
              </label>
            </RadioGroup>
          </PopoverContent>
        </Popover>
      );
    case "progress":
      return (
        <Progress value={68} className="w-full max-w-md">
          <ProgressLabel>업로드 진행률</ProgressLabel>
          <ProgressValue />
        </Progress>
      );
    case "prose":
      return (
        <Prose className="w-full max-w-md">
          <ProseBody>
            <p>설득문에서 주장은 독자가 붙잡을 수 있는 한 문장이어야 합니다.</p>
          </ProseBody>
          <ProseSource>출처: 글쓰기 워크북</ProseSource>
        </Prose>
      );
    case "radio-group":
      return (
        <RadioGroup defaultValue="comfortable" className="grid gap-3">
          {[
            ["default", "기본"],
            ["comfortable", "편안하게"],
            ["compact", "간결하게"],
          ].map(([value, label]) => (
            <label key={value} className="flex items-center gap-3 text-sm">
              <RadioGroupItem value={value} />
              {label}
            </label>
          ))}
        </RadioGroup>
      );
    case "scroll-area":
      return (
        <ScrollArea className="h-64 w-full max-w-sm rounded-3xl border">
          <div className="space-y-2 p-4">
            {Array.from({ length: 14 }, (_, index) => (
              <div key={index} className="rounded-2xl bg-muted px-3 py-2 text-sm">
                스크롤 항목 {index + 1}
              </div>
            ))}
          </div>
        </ScrollArea>
      );
    case "segment":
      return (
        <SegmentGroup layout="inline" className="w-full max-w-md">
          <Segment>기후 위기는</Segment>
          <Segment selected>개인의 습관만으로</Segment>
          <Segment>해결되지 않는다.</Segment>
        </SegmentGroup>
      );
    case "select":
      return (
        <Select defaultValue="astro">
          <SelectTrigger className="w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="astro">Astro</SelectItem>
            <SelectItem value="react">React</SelectItem>
            <SelectItem value="vite">Vite</SelectItem>
          </SelectContent>
        </Select>
      );
    case "separator":
      return (
        <div className="w-full max-w-md">
          <div className="flex items-center gap-4 text-sm">
            <span>문서</span>
            <Separator orientation="vertical" className="h-5" />
            <span>컴포넌트</span>
            <Separator orientation="vertical" className="h-5" />
            <span>레지스트리</span>
          </div>
          <Separator className="my-5" />
          <p className="text-sm text-muted-foreground">구분선은 콘텐츠 그룹을 명확하게 나눕니다.</p>
        </div>
      );
    case "sheet":
      return (
        <Sheet>
          <SheetTrigger render={<Button variant="outline" />}>설정 열기</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>프로젝트 설정</SheetTitle>
              <SheetDescription>이름과 공개 범위를 변경합니다.</SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 px-6">
              <Field>
                <FieldLabel htmlFor="sheet-name">이름</FieldLabel>
                <Input id="sheet-name" defaultValue="Luma UI" />
              </Field>
              <Button>저장</Button>
            </div>
          </SheetContent>
        </Sheet>
      );
    case "sidebar":
      return (
        <SidebarProvider className="min-h-0! h-[28rem] w-full max-w-[17rem] overflow-hidden rounded-3xl border border-border/80 bg-sidebar shadow-2xs">
          <div className="flex h-full w-full flex-col">
            <SidebarHeader>
              <div className="flex items-center gap-2.5 px-0.5">
                <div className="flex size-7 items-center justify-center rounded-xl bg-foreground text-xs font-semibold text-background">
                  L
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold tracking-[-0.01em]">Luma Studio</p>
                </div>
                <HugeiconsIcon
                  icon={MoreHorizontalIcon}
                  strokeWidth={2}
                  className="size-4 text-muted-foreground"
                />
              </div>
              <SidebarSearch aria-label="탐색 검색" placeholder="검색..." shortcut="⌘K" />
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>플랫폼</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton isActive>
                        <HugeiconsIcon icon={File01Icon} />
                        <span>개요</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <HugeiconsIcon icon={File01Icon} />
                        <span>파이프라인</span>
                        <SidebarMenuChevron open />
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton href="#">빌드 실행</SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton href="#" isActive>
                            배포
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton href="#">릴리스 게이트</SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <HugeiconsIcon icon={Settings02Icon} />
                        <span>관찰성</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge variant="success">14</SidebarMenuBadge>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarGroup>
                <SidebarGroupLabel>리소스</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {(
                      [
                        ["API Gateway", "success", "Prod"],
                        ["ML Pipeline", "purple", null],
                        ["Database", "info", "US-East"],
                      ] as const
                    ).map(([label, tone, badge]) => (
                      <SidebarMenuItem key={label}>
                        <SidebarMenuButton>
                          <SidebarMenuStatus tone={tone} />
                          <span>{label}</span>
                        </SidebarMenuButton>
                        {badge ? <SidebarMenuBadge variant="soft">{badge}</SidebarMenuBadge> : null}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <SidebarCard variant="frame" className="gap-1.5 py-2.5">
                <p className="text-xs font-medium">팀 초대</p>
                <p className="text-[0.6875rem] leading-4 text-muted-foreground">
                  협업할 동료를 워크스페이스에 추가합니다.
                </p>
              </SidebarCard>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" className="px-2">
                    <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      NB
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-medium">Nick Bold</p>
                      <p className="truncate text-xs text-muted-foreground">Atlas</p>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </div>
        </SidebarProvider>
      );
    case "skeleton":
      return (
        <div className="flex w-full max-w-sm items-center gap-4">
          <Skeleton className="size-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      );
    case "slider":
      return (
        <div className="w-full max-w-md space-y-3">
          <div className="flex justify-between text-sm">
            <span>볼륨</span>
            <span className="text-muted-foreground">65%</span>
          </div>
          <Slider defaultValue={[65]} max={100} step={1} />
        </div>
      );
    case "toast":
      return (
        <>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() =>
                toast.add({
                  title: "저장 완료",
                  description: "변경 사항이 안전하게 저장되었습니다.",
                  type: "success",
                })
              }
            >
              성공 알림
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast.add({
                  title: "항목을 보관했습니다.",
                  description: "보관함에서 다시 꺼낼 수 있습니다.",
                  actionProps: {
                    children: "되돌리기",
                    onClick() {
                      toast.add({ type: "success", title: "복원했습니다." });
                    },
                  },
                })
              }
            >
              되돌리기 알림
            </Button>
          </div>
          <Toaster />
        </>
      );
    case "sortable":
      return (
        <Sortable
          value={sortableOrder}
          onValueChange={setSortableOrder}
          getItemLabel={(id) =>
            sortablePreviewItems.find((item) => item.id === id)?.label ?? String(id)
          }
          aria-label="설득문 순서"
          className="w-full max-w-md"
        >
          {sortableOrder.map((id) => {
            const item = sortablePreviewItems.find((entry) => entry.id === id)!;
            return (
              <SortableItem key={id} value={id}>
                <SortableContent>{item.label}</SortableContent>
                <SortableHandle />
              </SortableItem>
            );
          })}
        </Sortable>
      );
    case "spinner":
      return (
        <div className="flex items-center gap-3 text-sm">
          <Spinner />
          데이터를 불러오는 중...
        </div>
      );
    case "step":
      return (
        <Step className="w-full max-w-md">
          <StepHeader>
            <StepTitle>주장과 근거의 거리</StepTitle>
          </StepHeader>
          <StepBody>
            <p className="text-sm leading-6 text-muted-foreground">
              설득의 핵심은 주장과 근거의 거리입니다.
            </p>
          </StepBody>
          <StepActions>
            <Button size="sm">확인</Button>
          </StepActions>
        </Step>
      );
    case "switch":
      return (
        <label htmlFor="preview-email-switch" className="flex items-center gap-3 text-sm">
          <Switch id="preview-email-switch" defaultChecked />
          이메일 알림 받기
        </label>
      );
    case "table":
      return (
        <div className="w-full max-w-xl rounded-3xl border">
          <Table>
            <TableCaption>최근 배포 기록</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>버전</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">시간</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ["v0.3.0", "성공", "2분 전"],
                ["v0.2.1", "성공", "어제"],
                ["v0.2.0", "실패", "3일 전"],
              ].map((row) => (
                <TableRow key={row[0]}>
                  {row.map((cell, index) => (
                    <TableCell key={cell} className={index === 2 ? "text-right" : undefined}>
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    case "tabs":
      return (
        <Tabs defaultValue="preview" className="w-full max-w-lg">
          <TabsList>
            <TabsTrigger value="preview">미리보기</TabsTrigger>
            <TabsTrigger value="code">코드</TabsTrigger>
            <TabsTrigger value="accessibility">접근성</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="rounded-3xl border p-5 text-sm">
            Luma 스타일 컴포넌트 미리보기입니다.
          </TabsContent>
          <TabsContent value="code" className="rounded-3xl bg-muted p-5 font-mono text-sm">
            {'import { Tabs } from "@workspace/ui/components/primitives/tabs"'}
          </TabsContent>
          <TabsContent value="accessibility" className="rounded-3xl border p-5 text-sm">
            키보드 방향키 탐색을 지원합니다.
          </TabsContent>
        </Tabs>
      );
    case "textarea":
      return (
        <Textarea className="max-w-md" placeholder="프로젝트에 대한 설명을 입력하세요." rows={5} />
      );
    case "token":
      return (
        <div className="flex w-full max-w-md flex-col gap-6">
          <TokenSentence>
            좋은 반박은
            <TokenSlot state="filled">약한 고리</TokenSlot>
            를 먼저 드러낸다.
          </TokenSentence>
          <TokenBank>
            <Token state="used">약한 고리</Token>
            <Token>감정</Token>
            <Token>비꼼</Token>
          </TokenBank>
        </div>
      );
    case "toggle":
      return (
        <div className="flex gap-2">
          <Toggle aria-label="굵게">B</Toggle>
          <Toggle variant="outline" aria-label="기울임">
            I
          </Toggle>
        </div>
      );
    case "toggle-group":
      return (
        <ToggleGroup defaultValue={["center"]}>
          <ToggleGroupItem value="left">왼쪽</ToggleGroupItem>
          <ToggleGroupItem value="center">가운데</ToggleGroupItem>
          <ToggleGroupItem value="right">오른쪽</ToggleGroupItem>
        </ToggleGroup>
      );
    case "tooltip":
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline" size="icon" />}>
              <HugeiconsIcon icon={Alert02Icon} />
            </TooltipTrigger>
            <TooltipContent>도움말을 확인하세요.</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    default:
      return (
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>{slug}</CardTitle>
            <CardDescription>컴포넌트 미리보기</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            이 컴포넌트는 @workspace/ui에서 가져올 수 있습니다.
          </CardContent>
        </Card>
      );
  }
}
