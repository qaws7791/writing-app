import type { ComponentGuideMap } from "./types";

export const overlayNavigationGuides: ComponentGuideMap = {
  accordion: {
    slug: "accordion",
    summary:
      "서로 관련된 긴 내용을 제목 단위로 접어 정보 밀도를 낮춥니다. Luma의 넉넉한 행 높이와 조용한 구분선을 유지하면서 한 항목 또는 여러 항목을 펼칠 수 있습니다.",
    examples: [
      {
        id: "accordion-basic",
        title: "기본",
        description: "배열 형태의 defaultValue로 처음 펼쳐 둘 항목을 지정합니다.",
        preview: "default",
        code: `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/primitives/accordion"

export function AccordionBasic() {
  return (
    <Accordion defaultValue={["shipping"]} className="max-w-lg">
      <AccordionItem value="shipping">
        <AccordionTrigger>배송은 얼마나 걸리나요?</AccordionTrigger>
        <AccordionContent>주문 후 영업일 기준 2~3일이 걸립니다.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="return">
        <AccordionTrigger>반품할 수 있나요?</AccordionTrigger>
        <AccordionContent>수령 후 14일 안에 신청할 수 있습니다.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}`,
      },
      {
        id: "accordion-multiple",
        title: "여러 항목 펼치기",
        description:
          "multiple을 켜면 사용자가 비교해야 하는 여러 답변을 동시에 열어 둘 수 있습니다.",
        code: `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/primitives/accordion"

export function AccordionMultiple() {
  return (
    <Accordion multiple defaultValue={["plan", "billing"]} className="max-w-lg">
      <AccordionItem value="plan">
        <AccordionTrigger>요금제</AccordionTrigger>
        <AccordionContent>팀 규모에 따라 언제든 변경할 수 있습니다.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="billing">
        <AccordionTrigger>결제 주기</AccordionTrigger>
        <AccordionContent>월간 또는 연간 결제를 선택할 수 있습니다.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}`,
      },
      {
        id: "accordion-border",
        title: "보더 스타일",
        description:
          "기본 하단 구분선 대신 각 항목에 테두리를 두고 gap으로 분리합니다. FAQ처럼 독립된 질문 목록에 맞습니다.",
        code: `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/primitives/accordion"

export function AccordionBorder() {
  return (
    <Accordion defaultValue={["billing"]} className="max-w-lg gap-2">
      <AccordionItem value="billing" className="rounded-xl border px-4 last:border-b">
        <AccordionTrigger>결제는 어떻게 이루어지나요?</AccordionTrigger>
        <AccordionContent>월간 청구이며 카드와 계좌 이체를 지원합니다.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="security" className="rounded-xl border px-4 last:border-b">
        <AccordionTrigger>데이터는 안전한가요?</AccordionTrigger>
        <AccordionContent>전송 구간은 암호화되며 접근 권한은 역할 단위로 관리합니다.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="integrations" className="rounded-xl border px-4 last:border-b">
        <AccordionTrigger>어떤 연동을 지원하나요?</AccordionTrigger>
        <AccordionContent>캘린더, 스토리지, 알림 채널과 연결할 수 있습니다.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}`,
      },
      {
        id: "accordion-secondary",
        title: "Secondary 배경",
        description:
          "bg-secondary와 테두리로 각 항목을 독립된 표면으로 만듭니다. FAQ처럼 질문 단위가 또렷해야 할 때 적합합니다.",
        code: `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/primitives/accordion"

export function AccordionSecondary() {
  return (
    <Accordion defaultValue={["billing"]} className="max-w-lg gap-2">
      <AccordionItem
        value="billing"
        className="rounded-xl border bg-secondary px-4 last:border-b"
      >
        <AccordionTrigger>결제는 어떻게 이루어지나요?</AccordionTrigger>
        <AccordionContent>월간 청구이며 카드와 계좌 이체를 지원합니다.</AccordionContent>
      </AccordionItem>
      <AccordionItem
        value="security"
        className="rounded-xl border bg-secondary px-4 last:border-b"
      >
        <AccordionTrigger>데이터는 안전한가요?</AccordionTrigger>
        <AccordionContent>전송 구간은 암호화되며 접근 권한은 역할 단위로 관리합니다.</AccordionContent>
      </AccordionItem>
      <AccordionItem
        value="integrations"
        className="rounded-xl border bg-secondary px-4 last:border-b"
      >
        <AccordionTrigger>어떤 연동을 지원하나요?</AccordionTrigger>
        <AccordionContent>캘린더, 스토리지, 알림 채널과 연결할 수 있습니다.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}`,
      },
      {
        id: "accordion-controlled",
        title: "제어된 상태",
        description: "value와 onValueChange를 사용해 펼침 상태를 외부 상태나 URL과 동기화합니다.",
        code: `import * as React from "react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/primitives/accordion"

export function AccordionControlled() {
  const [value, setValue] = React.useState<string[]>(["details"])

  return (
    <Accordion value={value} onValueChange={setValue} className="max-w-lg">
      <AccordionItem value="details">
        <AccordionTrigger>세부 정보</AccordionTrigger>
        <AccordionContent>현재 열린 항목은 외부 상태가 관리합니다.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}`,
      },
      {
        id: "accordion-disabled",
        title: "비활성 항목",
        description: "일부 답변을 아직 제공할 수 없다면 해당 AccordionItem만 비활성화합니다.",
        code: `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/primitives/accordion"

export function AccordionDisabled() {
  return (
    <Accordion className="max-w-lg">
      <AccordionItem value="available">
        <AccordionTrigger>공개된 기능</AccordionTrigger>
        <AccordionContent>모든 계정에서 사용할 수 있습니다.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="future" disabled>
        <AccordionTrigger>준비 중인 기능</AccordionTrigger>
        <AccordionContent>출시 후 내용을 확인할 수 있습니다.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}`,
      },
      {
        id: "accordion-card",
        title: "Card와 조합",
        description:
          "중요한 설정 묶음은 Card 안에 두되 Accordion 자체의 구분선과 여백은 유지합니다.",
        code: `import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/primitives/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card"

export function AccordionCard() {
  return (
    <Card className="max-w-xl">
      <CardHeader><CardTitle>개인정보 설정</CardTitle></CardHeader>
      <CardContent>
        <Accordion>
          <AccordionItem value="visibility">
            <AccordionTrigger>프로필 공개 범위</AccordionTrigger>
            <AccordionContent>검색과 팀 디렉터리 노출 범위를 정합니다.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}`,
      },
    ],
    usageNotes: [
      "서로 독립적인 여러 섹션을 한 번에 하나만 열려면 기본값을, 비교가 필요하면 multiple을 사용합니다.",
      "Accordion의 value와 defaultValue는 단일 문자열이 아니라 항목 값의 배열입니다.",
      "항목을 카드처럼 보이게 하려면 Accordion에 gap을 두고 AccordionItem의 기본 border-b를 className으로 덮어씁니다.",
      "페이지 내 검색으로 닫힌 내용을 찾게 해야 한다면 hiddenUntilFound를 고려하고, 애니메이션이나 상태 보존이 필요하면 keepMounted를 사용합니다.",
    ],
    accessibility: [
      "AccordionTrigger는 실제 제목을 포함해야 하며 아이콘만으로 펼침 상태를 설명하지 않습니다.",
      "키보드 사용자는 각 트리거를 Tab으로 이동하고 Enter 또는 Space로 패널을 전환할 수 있습니다.",
    ],
    props: [
      {
        name: "value",
        type: "unknown[]",
        defaultValue: "—",
        description: "현재 펼쳐진 항목 값 배열입니다.",
      },
      {
        name: "defaultValue",
        type: "unknown[]",
        defaultValue: "[]",
        description: "처음 펼쳐 둘 항목 값 배열입니다.",
      },
      {
        name: "onValueChange",
        type: "(value, details) => void",
        defaultValue: "—",
        description: "펼침 항목이 바뀔 때 호출됩니다.",
      },
      {
        name: "multiple",
        type: "boolean",
        defaultValue: "false",
        description: "여러 항목을 동시에 펼칠지 정합니다.",
      },
      {
        name: "disabled",
        type: "boolean",
        defaultValue: "false",
        description: "Root 전체 또는 개별 Item의 상호작용을 막습니다.",
      },
      {
        name: "hiddenUntilFound",
        type: "boolean",
        defaultValue: "false",
        description: "브라우저 페이지 검색이 닫힌 패널을 찾고 펼치도록 합니다.",
      },
      {
        name: "keepMounted",
        type: "boolean",
        defaultValue: "false",
        description: "닫힌 패널도 DOM에 유지합니다.",
      },
    ],
    related: ["collapsible", "card", "separator"],
  },
  "alert-dialog": {
    slug: "alert-dialog",
    summary:
      "되돌리기 어렵거나 명시적인 응답이 필요한 작업을 중단형 대화상자로 확인합니다. 일반 안내나 편집 작업에는 Dialog를 사용합니다.",
    examples: [
      {
        id: "alert-dialog-basic",
        title: "기본",
        description: "제목과 결과를 설명하고 취소와 확인 행동을 명확히 분리합니다.",
        preview: "default",
        code: `import { Button } from "@/components/primitives/button"
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
} from "@/components/primitives/alert-dialog"

export function AlertDialogBasic() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="outline" />}>보관하기</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>프로젝트를 보관할까요?</AlertDialogTitle>
          <AlertDialogDescription>팀 화면에서 숨겨지며 나중에 다시 복원할 수 있습니다.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction>보관</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}`,
      },
      {
        id: "alert-dialog-small",
        title: "작은 크기",
        description: "짧고 단순한 선택은 size=sm으로 더 응축된 확인 흐름을 만듭니다.",
        code: `import { Button } from "@/components/primitives/button"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/primitives/alert-dialog"

export function AlertDialogSmall() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button />}>로그아웃</AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>로그아웃할까요?</AlertDialogTitle>
          <AlertDialogDescription>저장하지 않은 변경 사항을 먼저 확인하세요.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>머무르기</AlertDialogCancel>
          <AlertDialogAction>로그아웃</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}`,
      },
      {
        id: "alert-dialog-media",
        title: "미디어 강조",
        description: "AlertDialogMedia에 상태 아이콘을 넣어 중요한 맥락을 한 번만 강조합니다.",
        code: `import { Delete02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/primitives/button"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/primitives/alert-dialog"

export function AlertDialogMediaExample() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>삭제</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia><HugeiconsIcon icon={Delete02Icon} /></AlertDialogMedia>
          <AlertDialogTitle>파일을 영구 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>휴지통으로 이동하지 않으며 되돌릴 수 없습니다.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction variant="destructive">영구 삭제</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}`,
      },
      {
        id: "alert-dialog-controlled",
        title: "비동기 작업과 제어 상태",
        description: "서버 작업이 끝날 때까지 open을 유지하고 성공한 뒤에만 닫습니다.",
        code: `import * as React from "react"
import { Button } from "@/components/primitives/button"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/primitives/alert-dialog"

export function AlertDialogControlled() {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  async function remove() {
    setPending(true)
    await Promise.resolve()
    setPending(false)
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>멤버 제거</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>멤버를 제거할까요?</AlertDialogTitle>
          <AlertDialogDescription>공유 문서 접근 권한도 함께 사라집니다.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>취소</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={remove}>
            {pending ? "제거 중…" : "제거"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}`,
      },
    ],
    usageNotes: [
      "삭제, 결제, 권한 회수처럼 사용자가 결과를 반드시 이해하고 선택해야 하는 순간에만 사용합니다.",
      "AlertDialogAction은 자동으로 destructive가 되지 않으므로 파괴적 작업에는 variant=destructive를 명시합니다.",
      "size=sm은 문장이 짧고 행동이 두 개뿐인 경우에 적합하며 긴 설명이나 폼에는 기본 크기 또는 Dialog를 사용합니다.",
    ],
    accessibility: [
      "AlertDialogTitle과 AlertDialogDescription을 함께 제공해 초점이 이동했을 때 목적과 결과가 읽히게 합니다.",
      "안전한 행동을 취소 버튼으로 제공하고 버튼 레이블에는 '확인'보다 실제 결과인 '영구 삭제'를 씁니다.",
    ],
    props: [
      { name: "open", type: "boolean", defaultValue: "—", description: "제어된 열림 상태입니다." },
      {
        name: "defaultOpen",
        type: "boolean",
        defaultValue: "false",
        description: "비제어 초기 열림 상태입니다.",
      },
      {
        name: "onOpenChange",
        type: "(open, details) => void",
        defaultValue: "—",
        description: "열림 상태 변경 콜백입니다.",
      },
      {
        name: "AlertDialogContent.size",
        type: '"default" | "sm"',
        defaultValue: '"default"',
        description: "대화상자의 레이아웃 밀도를 선택합니다.",
      },
      {
        name: "AlertDialogCancel.variant",
        type: "Button variant",
        defaultValue: '"outline"',
        description: "취소 버튼의 시각 표현입니다.",
      },
      {
        name: "AlertDialogCancel.size",
        type: "Button size",
        defaultValue: '"default"',
        description: "취소 버튼 크기입니다.",
      },
    ],
    related: ["dialog", "button", "toast"],
  },
  breadcrumb: {
    slug: "breadcrumb",
    summary:
      "현재 페이지가 정보 구조 안에서 어디에 있는지 보여 주는 계층형 탐색입니다. 링크는 조용하게 두고 현재 페이지만 분명하게 강조합니다.",
    examples: [
      {
        id: "breadcrumb-basic",
        title: "기본",
        description: "마지막 항목은 링크가 아닌 BreadcrumbPage로 현재 위치를 표시합니다.",
        preview: "default",
        code: `import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/primitives/breadcrumb"

export function BreadcrumbBasic() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink href="/docs">문서</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbLink href="/docs/components">컴포넌트</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbPage>Breadcrumb</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}`,
      },
      {
        id: "breadcrumb-custom-separator",
        title: "사용자 정의 구분자",
        description:
          "BreadcrumbSeparator의 children으로 문맥에 맞는 간결한 구분 기호를 전달합니다.",
        code: `import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/primitives/breadcrumb"

export function BreadcrumbCustomSeparator() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink href="/library">라이브러리</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem><BreadcrumbPage>최근 항목</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}`,
      },
      {
        id: "breadcrumb-collapsed",
        title: "긴 경로 접기",
        description:
          "중간 경로가 길면 Ellipsis와 DropdownMenu를 조합해 시작과 현재 위치를 보존합니다.",
        code: `import {
  Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/primitives/breadcrumb"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/primitives/dropdown-menu"

export function BreadcrumbCollapsed() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink href="/">홈</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="생략된 경로 열기"><BreadcrumbEllipsis /></DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>워크스페이스</DropdownMenuItem>
              <DropdownMenuItem>프로젝트</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbPage>에셋</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}`,
      },
      {
        id: "breadcrumb-router-link",
        title: "라우터 링크",
        description:
          "render로 프레임워크 링크를 합성해 클라이언트 탐색과 Breadcrumb 스타일을 함께 유지합니다.",
        code: `import type { ComponentProps } from "react"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/primitives/breadcrumb"

function AppLink(props: ComponentProps<"a">) {
  return <a {...props} />
}

export function BreadcrumbRouterLink() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<AppLink href="/projects" />}>프로젝트</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbPage>봄 캠페인</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}`,
        note: "AppLink를 사용 중인 라우터의 Link 컴포넌트로 교체할 수 있습니다.",
      },
    ],
    usageNotes: [
      "현재 페이지를 포함해 짧은 경로는 3~5단계 정도만 노출하고 더 긴 중간 단계는 Ellipsis로 접습니다.",
      "BreadcrumbEllipsis 자체는 메뉴를 열지 않으므로 필요한 경우 DropdownMenuTrigger와 조합합니다.",
      "구분자는 장식 요소이며 컴포넌트가 기본적으로 스크린 리더에서 숨깁니다.",
    ],
    accessibility: [
      "Breadcrumb는 aria-label=breadcrumb가 있는 nav를 렌더링하고 현재 페이지에는 aria-current=page를 제공합니다.",
      "접힌 경로를 여는 트리거에는 '생략된 경로 열기'처럼 목적이 드러나는 접근 가능한 이름을 붙입니다.",
    ],
    props: [
      {
        name: "BreadcrumbLink.render",
        type: "ReactElement | function",
        defaultValue: '"a"',
        description: "라우터 링크 등 다른 요소와 합성합니다.",
      },
      {
        name: "BreadcrumbSeparator.children",
        type: "ReactNode",
        defaultValue: "ArrowRight01Icon",
        description: "기본 화살표 대신 사용할 구분자입니다.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "—",
        description: "각 슬롯의 기본 스타일과 병합할 클래스입니다.",
      },
    ],
    related: ["dropdown-menu", "navigation-menu", "pagination"],
  },
  collapsible: {
    slug: "collapsible",
    summary:
      "하나의 보조 영역을 필요할 때 펼치는 가장 작은 disclosure primitive입니다. 여러 형제 섹션을 다룰 때는 Accordion을 사용합니다.",
    examples: [
      {
        id: "collapsible-basic",
        title: "기본",
        description: "트리거와 콘텐츠의 외형을 사용 맥락에 맞는 Button과 표면으로 구성합니다.",
        preview: "default",
        code: `import { Button } from "@/components/primitives/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/primitives/collapsible"

export function CollapsibleBasic() {
  return (
    <Collapsible className="max-w-md rounded-3xl border p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="font-medium">고급 설정</p>
        <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>열기</CollapsibleTrigger>
      </div>
      <CollapsibleContent className="pt-4 text-sm text-muted-foreground">
        캐시와 배포 환경을 세부 조정할 수 있습니다.
      </CollapsibleContent>
    </Collapsible>
  )
}`,
      },
      {
        id: "collapsible-controlled",
        title: "제어된 상태",
        description: "트리거 문구와 아이콘을 실제 open 상태에 맞춰 바꿉니다.",
        code: `import * as React from "react"
import { Button } from "@/components/primitives/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/primitives/collapsible"

export function CollapsibleControlled() {
  const [open, setOpen] = React.useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="max-w-md">
      <CollapsibleTrigger render={<Button variant="outline" />}>
        {open ? "변경 기록 닫기" : "변경 기록 보기"}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-4 text-sm text-muted-foreground">
        오늘 이름과 공개 범위가 변경되었습니다.
      </CollapsibleContent>
    </Collapsible>
  )
}`,
      },
      {
        id: "collapsible-settings",
        title: "설정 패널",
        description: "자주 쓰지 않는 설정을 숨기되 현재 값이 무엇인지 트리거 근처에서 알려 줍니다.",
        code: `import { Button } from "@/components/primitives/button"
import { Switch } from "@/components/primitives/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/primitives/collapsible"

export function CollapsibleSettings() {
  return (
    <Collapsible defaultOpen className="max-w-md space-y-3">
      <div className="flex items-center justify-between">
        <div><p className="font-medium">알림 설정</p><p className="text-sm text-muted-foreground">이메일 사용 중</p></div>
        <CollapsibleTrigger render={<Button variant="ghost" size="sm" />}>세부 설정</CollapsibleTrigger>
      </div>
      <CollapsibleContent className="rounded-3xl bg-muted/50 p-4">
        <label className="flex items-center justify-between gap-4 text-sm">
          댓글 알림 <Switch defaultChecked />
        </label>
      </CollapsibleContent>
    </Collapsible>
  )
}`,
      },
      {
        id: "collapsible-disabled",
        title: "비활성 상태",
        description:
          "권한이나 선행 조건이 부족한 영역은 Root의 disabled로 전체 상호작용을 막습니다.",
        code: `import { Button } from "@/components/primitives/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/primitives/collapsible"

export function CollapsibleDisabled() {
  return (
    <Collapsible disabled className="max-w-md opacity-60">
      <CollapsibleTrigger render={<Button variant="outline" />}>관리자 설정</CollapsibleTrigger>
      <CollapsibleContent>관리자만 변경할 수 있습니다.</CollapsibleContent>
      <p className="mt-2 text-sm text-muted-foreground">관리자 권한이 필요합니다.</p>
    </Collapsible>
  )
}`,
      },
    ],
    usageNotes: [
      "Collapsible은 스타일을 거의 강제하지 않으므로 트리거의 눌림 가능성과 콘텐츠 경계를 사용 맥락에 맞게 표현합니다.",
      "여러 섹션 사이에서 한 항목만 열어야 한다면 상태를 직접 조율하기보다 Accordion을 사용합니다.",
      "비싼 콘텐츠를 닫힌 상태에도 유지해야 한다면 CollapsibleContent의 keepMounted를 사용합니다.",
    ],
    accessibility: [
      "CollapsibleTrigger는 버튼으로 렌더링되며 열림 상태와 패널 관계를 Base UI가 연결합니다.",
      "트리거 레이블은 '더 보기'만 쓰지 말고 무엇을 펼치는지 함께 설명합니다.",
    ],
    props: [
      { name: "open", type: "boolean", defaultValue: "—", description: "제어된 열림 상태입니다." },
      {
        name: "defaultOpen",
        type: "boolean",
        defaultValue: "false",
        description: "비제어 초기 열림 상태입니다.",
      },
      {
        name: "onOpenChange",
        type: "(open, details) => void",
        defaultValue: "—",
        description: "열림 상태 변경 콜백입니다.",
      },
      {
        name: "disabled",
        type: "boolean",
        defaultValue: "false",
        description: "트리거 상호작용을 비활성화합니다.",
      },
      {
        name: "CollapsibleContent.keepMounted",
        type: "boolean",
        defaultValue: "false",
        description: "닫혀도 패널을 DOM에 유지합니다.",
      },
    ],
    related: ["accordion", "sidebar", "button"],
  },
  command: {
    slug: "command",
    summary:
      "검색과 키보드 탐색을 중심으로 빠른 이동과 작업 실행을 묶는 명령 목록입니다. cmdk의 필터링 API와 Luma Dialog 조합을 함께 제공합니다.",
    examples: [
      {
        id: "command-basic",
        title: "기본",
        description: "Input, List, Empty, Group, Item 순서로 검색 가능한 명령 목록을 구성합니다.",
        preview: "default",
        code: `import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/primitives/command"

export function CommandBasic() {
  return (
    <Command label="빠른 이동" className="max-w-md border">
      <CommandInput placeholder="페이지 또는 작업 검색" />
      <CommandList>
        <CommandEmpty>일치하는 결과가 없습니다.</CommandEmpty>
        <CommandGroup heading="빠른 이동">
          <CommandItem value="projects">프로젝트</CommandItem>
          <CommandItem value="settings">설정</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}`,
      },
      {
        id: "command-dialog",
        title: "명령 팔레트",
        description: "CommandDialog를 제어 상태로 열어 앱 전체에서 호출하는 팔레트를 만듭니다.",
        code: `import * as React from "react"
import {
  Command, CommandDialog, CommandEmpty, CommandGroup,
  CommandInput, CommandItem, CommandList, CommandShortcut,
} from "@/components/primitives/command"

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="명령 팔레트" description="실행할 작업을 검색하세요.">
      <Command>
        <CommandInput placeholder="명령 검색" />
        <CommandList>
          <CommandEmpty>결과가 없습니다.</CommandEmpty>
          <CommandGroup heading="작업">
            <CommandItem onSelect={() => setOpen(false)}>새 프로젝트<CommandShortcut>⌘N</CommandShortcut></CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}`,
      },
      {
        id: "command-groups",
        title: "그룹, 구분선, 단축키",
        description: "행동 유형을 그룹으로 나누고 이미 존재하는 단축키만 보조 정보로 표시합니다.",
        code: `import {
  Command, CommandGroup, CommandInput, CommandItem, CommandList,
  CommandSeparator, CommandShortcut,
} from "@/components/primitives/command"

export function CommandGroups() {
  return (
    <Command className="max-w-md border">
      <CommandInput placeholder="검색" />
      <CommandList>
        <CommandGroup heading="이동">
          <CommandItem>대시보드<CommandShortcut>G D</CommandShortcut></CommandItem>
          <CommandItem>프로젝트<CommandShortcut>G P</CommandShortcut></CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="계정">
          <CommandItem>프로필</CommandItem>
          <CommandItem disabled>결제 관리</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}`,
      },
      {
        id: "command-controlled-search",
        title: "검색어와 사용자 필터",
        description:
          "CommandInput의 검색어를 제어하고 keywords와 filter로 한국어 동의어 검색을 보완합니다.",
        code: `import * as React from "react"
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/primitives/command"

export function CommandControlledSearch() {
  const [search, setSearch] = React.useState("")

  return (
    <Command filter={(value, query, keywords = []) => {
      const text = [value, ...keywords].join(" ").toLowerCase()
      return text.includes(query.toLowerCase()) ? 1 : 0
    }} className="max-w-md border">
      <CommandInput value={search} onValueChange={setSearch} placeholder="설정 검색" />
      <CommandList>
        <CommandEmpty>“{search}”에 대한 결과가 없습니다.</CommandEmpty>
        <CommandItem value="appearance" keywords={["테마", "화면"]}>모양</CommandItem>
        <CommandItem value="notifications" keywords={["알림", "메일"]}>알림</CommandItem>
      </CommandList>
    </Command>
  )
}`,
      },
      {
        id: "command-selection",
        title: "선택 상태",
        description:
          "checked data 상태가 필요한 선택 목록은 value를 안정적으로 지정하고 Item 선택으로 외부 상태를 갱신합니다.",
        code: `import * as React from "react"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/primitives/command"

export function CommandSelection() {
  const [team, setTeam] = React.useState("design")

  return (
    <Command className="max-w-sm border">
      <CommandList>
        <CommandGroup heading="팀 전환">
          <CommandItem value="design" data-checked={team === "design"} onSelect={setTeam}>디자인</CommandItem>
          <CommandItem value="product" data-checked={team === "product"} onSelect={setTeam}>프로덕트</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
}`,
      },
    ],
    usageNotes: [
      "동적으로 바뀌는 텍스트를 가진 CommandItem에는 추론에 맡기지 말고 안정적인 value를 지정합니다.",
      "shouldFilter=false를 쓰면 검색 결과의 필터링과 조건부 렌더링을 애플리케이션이 직접 책임집니다.",
      "CommandDialog는 기본 showCloseButton=false이며 title과 description은 화면에 숨겨진 접근성 레이블로 사용됩니다.",
    ],
    accessibility: [
      "Command와 CommandList에 목록의 목적을 설명하는 label을 제공하고 Empty 상태도 읽을 수 있는 문장으로 작성합니다.",
      "시각적 CommandShortcut은 실제 키보드 이벤트를 등록하지 않으므로 별도의 이벤트 처리와 충돌 검사를 구현합니다.",
      "Item의 onSelect는 포인터와 키보드 선택을 모두 처리하므로 클릭 전용 핸들러보다 우선합니다.",
    ],
    props: [
      {
        name: "label",
        type: "string",
        defaultValue: "—",
        description: "화면에는 보이지 않는 명령 메뉴의 접근 가능한 이름입니다.",
      },
      {
        name: "shouldFilter",
        type: "boolean",
        defaultValue: "true",
        description: "cmdk의 자동 필터링과 정렬을 사용할지 정합니다.",
      },
      {
        name: "filter",
        type: "(value, search, keywords?) => number",
        defaultValue: "cmdk defaultFilter",
        description: "0~1 점수를 반환하는 사용자 필터입니다.",
      },
      {
        name: "value",
        type: "string",
        defaultValue: "—",
        description: "현재 선택된 Item의 제어 값입니다.",
      },
      {
        name: "onValueChange",
        type: "(value: string) => void",
        defaultValue: "—",
        description: "선택 Item이 바뀔 때 호출됩니다.",
      },
      {
        name: "loop",
        type: "boolean",
        defaultValue: "false",
        description: "끝에서 방향키 탐색을 순환할지 정합니다.",
      },
      {
        name: "CommandInput.value",
        type: "string",
        defaultValue: "—",
        description: "제어된 검색어입니다.",
      },
      {
        name: "CommandItem.onSelect",
        type: "(value: string) => void",
        defaultValue: "—",
        description: "항목이 키보드나 포인터로 선택될 때 호출됩니다.",
      },
      {
        name: "CommandDialog.showCloseButton",
        type: "boolean",
        defaultValue: "false",
        description: "Dialog의 닫기 버튼 노출 여부입니다.",
      },
    ],
    related: ["dialog", "dropdown-menu", "kbd"],
  },
  dialog: {
    slug: "dialog",
    summary:
      "현재 화면 위에서 하나의 편집이나 확인 작업에 집중시키는 모달 표면입니다. Luma의 넓은 여백, 큰 라운드, 반투명 배경 분리를 기본으로 제공합니다.",
    examples: [
      {
        id: "dialog-basic",
        title: "기본",
        description:
          "Trigger, Content, Header, Title, Description, Footer를 기본 골격으로 사용합니다.",
        preview: "default",
        code: `import { Button } from "@/components/primitives/button"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/primitives/dialog"

export function DialogBasic() {
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>프로필 편집</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>프로필 편집</DialogTitle>
          <DialogDescription>팀에 공개할 이름과 소개를 변경합니다.</DialogDescription>
        </DialogHeader>
        <DialogFooter><Button>저장</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}`,
      },
      {
        id: "dialog-form",
        title: "폼",
        description: "Field와 Input을 조합하고 제출 행동은 Footer에 고정된 순서로 배치합니다.",
        code: `import { Button } from "@/components/primitives/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/primitives/dialog"
import { Field, FieldLabel } from "@/components/primitives/field"
import { Input } from "@/components/primitives/input"

export function DialogForm() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>워크스페이스 이름 변경</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>워크스페이스 이름</DialogTitle>
          <DialogDescription>모든 멤버에게 표시되는 이름입니다.</DialogDescription>
        </DialogHeader>
        <Field><FieldLabel htmlFor="workspace-name">이름</FieldLabel><Input id="workspace-name" defaultValue="Luma" /></Field>
        <DialogFooter showCloseButton><Button>변경 저장</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}`,
      },
      {
        id: "dialog-custom-close",
        title: "닫기 컨트롤",
        description:
          "기본 우측 상단 닫기 버튼을 숨기고 문맥이 분명한 DialogClose를 직접 배치합니다.",
        code: `import { Button } from "@/components/primitives/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/primitives/dialog"

export function DialogCustomClose() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>안내 보기</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>검토가 완료되었습니다</DialogTitle>
          <DialogDescription>이제 변경 내용을 팀에 공유할 수 있습니다.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button />}>완료</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}`,
      },
      {
        id: "dialog-controlled",
        title: "제어 상태와 초점 복귀",
        description:
          "open을 외부에서 관리하고 닫힌 뒤 초점이 돌아갈 요소를 finalFocus로 지정합니다.",
        code: `import * as React from "react"
import { Button } from "@/components/primitives/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/primitives/dialog"

export function DialogControlled() {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  return (
    <>
      <Button ref={triggerRef} onClick={() => setOpen(true)}>초대 만들기</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent finalFocus={triggerRef}>
          <DialogHeader>
            <DialogTitle>초대 링크</DialogTitle>
            <DialogDescription>링크를 가진 사람은 워크스페이스에 참여할 수 있습니다.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}`,
      },
      {
        id: "dialog-scrollable",
        title: "긴 콘텐츠와 고정 Footer",
        description:
          "Content의 높이를 제한하고 본문만 스크롤해 행동 버튼이 화면 밖으로 밀리지 않게 합니다.",
        code: `import { Button } from "@/components/primitives/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/primitives/dialog"

export function DialogScrollable() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>약관 읽기</DialogTrigger>
      <DialogContent className="max-h-[80dvh] grid-rows-[auto_minmax(0,1fr)_auto]">
        <DialogHeader><DialogTitle>서비스 약관</DialogTitle><DialogDescription>계속하기 전에 내용을 확인하세요.</DialogDescription></DialogHeader>
        <div className="overflow-y-auto pr-2 text-sm leading-7">긴 약관 내용이 이 영역에서 스크롤됩니다.</div>
        <DialogFooter showCloseButton><Button>동의하고 계속</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}`,
      },
    ],
    usageNotes: [
      "일반 편집과 보조 작업에는 Dialog를, 반드시 응답해야 하는 위험한 결정에는 AlertDialog를 사용합니다.",
      "modal=false는 배경 상호작용을 허용합니다. 닫히지 않는 비모달 패널이 필요하면 disablePointerDismissal도 함께 검토합니다.",
      "긴 콘텐츠에서는 전체 Content가 아니라 가운데 본문만 스크롤하도록 grid 또는 flex의 minmax(0,1fr)를 사용합니다.",
    ],
    accessibility: [
      "DialogTitle과 DialogDescription을 제공해 모달이 열린 이유와 작업 범위를 전달합니다.",
      "모달 또는 trap-focus 모드에서는 터치 스크린 리더가 빠져나올 수 있도록 DialogClose를 Content 안에 유지합니다.",
      "기본 초점 이동을 끄는 initialFocus=false는 대체 초점 전략이 있을 때만 사용합니다.",
    ],
    props: [
      { name: "open", type: "boolean", defaultValue: "—", description: "제어된 열림 상태입니다." },
      {
        name: "defaultOpen",
        type: "boolean",
        defaultValue: "false",
        description: "비제어 초기 열림 상태입니다.",
      },
      {
        name: "onOpenChange",
        type: "(open, details) => void",
        defaultValue: "—",
        description: "열림 상태 변경 콜백입니다.",
      },
      {
        name: "modal",
        type: 'boolean | "trap-focus"',
        defaultValue: "true",
        description: "초점, 스크롤, 외부 포인터 제한 방식을 정합니다.",
      },
      {
        name: "disablePointerDismissal",
        type: "boolean",
        defaultValue: "false",
        description: "바깥 클릭으로 닫히는 것을 막습니다.",
      },
      {
        name: "DialogContent.showCloseButton",
        type: "boolean",
        defaultValue: "true",
        description: "기본 닫기 버튼을 표시합니다.",
      },
      {
        name: "DialogContent.initialFocus",
        type: "boolean | RefObject | function",
        defaultValue: "true",
        description: "열릴 때 이동할 초점을 정합니다.",
      },
      {
        name: "DialogContent.finalFocus",
        type: "boolean | RefObject | function",
        defaultValue: "true",
        description: "닫힐 때 복귀할 초점을 정합니다.",
      },
    ],
    related: ["alert-dialog", "sheet"],
  },
  "dropdown-menu": {
    slug: "dropdown-menu",
    summary:
      "버튼이나 아바타에서 시작되는 짧은 작업 목록입니다. 그룹, 체크박스, 라디오, 하위 메뉴를 한 표면 안에서 키보드로 탐색할 수 있습니다.",
    examples: [
      {
        id: "dropdown-menu-basic",
        title: "기본",
        description: "관련 행동은 Separator로만 나누고, 라벨은 꼭 필요할 때만 둡니다.",
        preview: "default",
        code: `import { Button } from "@/components/primitives/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/primitives/dropdown-menu"

export function DropdownMenuBasic() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>작업</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>이름 변경</DropdownMenuItem>
        <DropdownMenuItem>복제</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">삭제</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}`,
      },
      {
        id: "dropdown-menu-account",
        title: "계정 메뉴",
        description:
          "헤더·CTA·아이콘 액션·텍스트 링크·푸터처럼 역할이 다른 블록을 한 표면에 구성합니다. 모든 행에 아이콘을 넣지 않습니다.",
        code: `import {
  ArrowUpRight01Icon,
  PlusSignIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Badge } from "@/components/primitives/badge"
import { Button } from "@/components/primitives/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/primitives/dropdown-menu"

export function DropdownMenuAccount() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>수진</DropdownMenuTrigger>
      <DropdownMenuContent className="w-[17.5rem]" align="end">
        <div className="pt-1 pb-2.5">
          <p className="px-2.5 text-sm font-semibold tracking-[-0.01em]">수진</p>
          <p className="mt-0.5 px-2.5 text-xs text-muted-foreground">abcd@gmail.com</p>
          <Button size="sm" className="mt-3 w-full">
            프로필 설정
          </Button>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <HugeiconsIcon icon={PlusSignIcon} />
          콘텐츠 요청
        </DropdownMenuItem>
        <DropdownMenuItem>
          <HugeiconsIcon icon={Settings02Icon} />
          설정
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>요금제</DropdownMenuItem>
        <DropdownMenuItem>변경 로그</DropdownMenuItem>
        <DropdownMenuItem>블로그</DropdownMenuItem>
        <DropdownMenuItem>
          채용
          <HugeiconsIcon icon={ArrowUpRight01Icon} className="ml-auto size-3.5 text-muted-foreground" />
        </DropdownMenuItem>
        <DropdownMenuItem>
          <span className="flex items-center gap-1.5">
            굿즈
            <Badge variant="secondary" className="h-4 rounded-md px-1.5 text-[10px]">
              New
            </Badge>
          </span>
          <HugeiconsIcon icon={ArrowUpRight01Icon} className="ml-auto size-3.5 text-muted-foreground" />
        </DropdownMenuItem>
        <DropdownMenuItem>
          고객 지원
          <HugeiconsIcon icon={ArrowUpRight01Icon} className="ml-auto size-3.5 text-muted-foreground" />
        </DropdownMenuItem>
        <DropdownMenuItem>로그아웃</DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="flex gap-2 px-2.5 py-1 text-[11px] text-muted-foreground">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Copyright</span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}`,
      },
      {
        id: "dropdown-menu-actions",
        title: "프로젝트 액션",
        description: "구역은 Separator로만 나누고, 아이콘·단축키·하위 메뉴는 필요한 행에만 둡니다.",
        code: `import * as React from "react"
import {
  Copy01Icon,
  Delete02Icon,
  Download01Icon,
  Edit02Icon,
  Link01Icon,
  Pin02Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/primitives/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/primitives/dropdown-menu"

export function DropdownMenuActions() {
  const [pinned, setPinned] = React.useState(true)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>프로젝트</DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuItem>
          <HugeiconsIcon icon={Edit02Icon} />
          이름 변경
          <DropdownMenuShortcut>F2</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <HugeiconsIcon icon={Copy01Icon} />
          복제
          <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <HugeiconsIcon icon={Link01Icon} />
          링크 복사
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>멤버 초대</DropdownMenuItem>
        <DropdownMenuItem>권한 관리</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <HugeiconsIcon icon={Download01Icon} />
            내보내기
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>PDF</DropdownMenuItem>
            <DropdownMenuItem>Markdown</DropdownMenuItem>
            <DropdownMenuItem>ZIP</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={pinned} onCheckedChange={setPinned}>
          <HugeiconsIcon icon={Pin02Icon} />
          사이드바에 고정
        </DropdownMenuCheckboxItem>
        <DropdownMenuItem>
          <HugeiconsIcon icon={Settings02Icon} />
          프로젝트 설정
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <HugeiconsIcon icon={Delete02Icon} />
          삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}`,
      },
      {
        id: "dropdown-menu-shortcuts",
        title: "아이콘과 단축키",
        description:
          "아이콘은 스캔을 돕고 Shortcut은 이미 동작하는 키 조합을 보조적으로 표시합니다.",
        code: `import { Copy01Icon, Edit02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/primitives/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuShortcut, DropdownMenuTrigger } from "@/components/primitives/dropdown-menu"

export function DropdownMenuShortcuts() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>파일</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem><HugeiconsIcon icon={Edit02Icon} />이름 변경<DropdownMenuShortcut>F2</DropdownMenuShortcut></DropdownMenuItem>
        <DropdownMenuItem><HugeiconsIcon icon={Copy01Icon} />복제<DropdownMenuShortcut>⌘D</DropdownMenuShortcut></DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}`,
      },
      {
        id: "dropdown-menu-checkboxes",
        title: "체크박스 항목",
        description: "서로 독립적인 표시 옵션은 메뉴를 닫지 않는 CheckboxItem으로 토글합니다.",
        code: `import * as React from "react"
import { Button } from "@/components/primitives/button"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/primitives/dropdown-menu"

export function DropdownMenuCheckboxes() {
  const [grid, setGrid] = React.useState(true)
  const [guides, setGuides] = React.useState(false)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>보기</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>캔버스</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>격자 표시</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={guides} onCheckedChange={setGuides}>안내선 표시</DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}`,
      },
      {
        id: "dropdown-menu-radio",
        title: "라디오 그룹",
        description: "서로 배타적인 정렬이나 밀도 선택은 RadioGroup으로 하나만 활성화합니다.",
        code: `import * as React from "react"
import { Button } from "@/components/primitives/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/primitives/dropdown-menu"

export function DropdownMenuRadio() {
  const [density, setDensity] = React.useState("comfortable")
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>밀도</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value={density} onValueChange={setDensity}>
          <DropdownMenuLabel>목록 밀도</DropdownMenuLabel>
          <DropdownMenuRadioItem value="comfortable">편안하게</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="compact">간결하게</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}`,
      },
      {
        id: "dropdown-menu-submenu",
        title: "하위 메뉴와 비활성 항목",
        description:
          "두 번째 단계의 행동만 Submenu에 두고 현재 실행할 수 없는 항목은 disabled로 설명 가능한 상태를 유지합니다.",
        code: `import { Button } from "@/components/primitives/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/primitives/dropdown-menu"

export function DropdownMenuSubmenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>공유</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem disabled>최근 대상 없음</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>내보내기</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>PDF</DropdownMenuItem><DropdownMenuItem>PNG</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}`,
      },
    ],
    usageNotes: [
      "variant=destructive는 되돌릴 수 없는 Item에만 사용하고 Separator로 일반 행동과 분리합니다.",
      "DropdownMenuLabel은 GroupLabel이므로 DropdownMenuGroup 또는 DropdownMenuRadioGroup 안에서만 사용합니다. 구역 구분은 가능하면 Separator와 여백만으로 합니다.",
      "모든 행에 아이콘·단축키·배지를 넣지 않습니다. 스캔이 필요한 액션에만 보조 신호를 둡니다.",
      "CheckboxItem은 기본 closeOnClick=false, 일반 Item은 true입니다. 메뉴를 유지해야 하는 일반 행동은 closeOnClick=false를 명시합니다.",
      "하위 메뉴는 한 단계 정도로 제한하고 더 복잡한 설정은 Popover, Dialog 또는 별도 화면으로 옮깁니다.",
    ],
    accessibility: [
      "아이콘만 있는 DropdownMenuTrigger에는 메뉴의 목적이 드러나는 aria-label을 제공합니다.",
      "방향키, Home/End, 문자 검색을 사용할 수 있으므로 Item의 label 또는 보이는 텍스트를 고유하고 예측 가능하게 유지합니다.",
      "Shortcut 텍스트는 키보드 동작을 만들지 않으므로 실제 단축키 구현과 함께 사용합니다.",
    ],
    props: [
      {
        name: "open",
        type: "boolean",
        defaultValue: "—",
        description: "제어된 메뉴 열림 상태입니다.",
      },
      {
        name: "modal",
        type: "boolean",
        defaultValue: "true",
        description: "열릴 때 배경 상호작용을 제한합니다.",
      },
      {
        name: "loopFocus",
        type: "boolean",
        defaultValue: "true",
        description: "방향키 탐색을 처음과 끝에서 순환합니다.",
      },
      {
        name: "DropdownMenuContent.align",
        type: '"start" | "center" | "end"',
        defaultValue: '"start"',
        description: "트리거를 기준으로 정렬합니다.",
      },
      {
        name: "DropdownMenuContent.side",
        type: "Positioner side",
        defaultValue: '"bottom"',
        description: "메뉴가 우선 배치될 면입니다.",
      },
      {
        name: "DropdownMenuContent.sideOffset",
        type: "number",
        defaultValue: "4",
        description: "트리거와 메뉴 사이 거리입니다.",
      },
      {
        name: "DropdownMenuItem.variant",
        type: '"default" | "destructive"',
        defaultValue: '"default"',
        description: "일반 또는 파괴적 항목 표현입니다.",
      },
      {
        name: "DropdownMenuItem.inset",
        type: "boolean",
        defaultValue: "false",
        description: "아이콘 없는 항목을 들여씁니다.",
      },
      {
        name: "DropdownMenuCheckboxItem.checked",
        type: "boolean",
        defaultValue: "—",
        description: "제어된 체크 상태입니다.",
      },
      {
        name: "DropdownMenuRadioGroup.value",
        type: "unknown",
        defaultValue: "—",
        description: "선택된 라디오 항목 값입니다.",
      },
    ],
    related: ["command", "popover", "navigation-menu"],
  },
  "navigation-menu": {
    slug: "navigation-menu",
    summary:
      "사이트의 주요 목적지와 설명형 하위 링크를 가로 탐색으로 구성합니다. 단순 행동 메뉴가 아니라 실제 페이지 이동을 위한 링크 중심 컴포넌트입니다.",
    examples: [
      {
        id: "navigation-menu-basic",
        title: "기본",
        description:
          "Trigger와 Content를 가진 항목, 직접 이동하는 Link 항목을 한 목록에 조합합니다.",
        preview: "default",
        code: `import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/primitives/navigation-menu"

export function NavigationMenuBasic() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>제품</NavigationMenuTrigger>
          <NavigationMenuContent className="w-72">
            <NavigationMenuLink href="/components">컴포넌트<p>제품에 바로 사용하는 UI</p></NavigationMenuLink>
            <NavigationMenuLink href="/blocks">블록<p>완성된 화면 패턴</p></NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem><NavigationMenuLink href="/docs">문서</NavigationMenuLink></NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}`,
      },
      {
        id: "navigation-menu-rich-content",
        title: "설명형 링크 그리드",
        description: "하위 링크가 많으면 제목과 한 줄 설명을 가진 열린 그리드로 묶습니다.",
        code: `import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/primitives/navigation-menu"

export function NavigationMenuRichContent() {
  return (
    <NavigationMenu align="start">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>리소스</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[32rem] grid-cols-2 gap-1">
              <NavigationMenuLink href="/guides">가이드<p>단계별 구현 방법</p></NavigationMenuLink>
              <NavigationMenuLink href="/examples">예제<p>실제 제품 조합</p></NavigationMenuLink>
              <NavigationMenuLink href="/changelog">변경 기록<p>새 기능과 수정 사항</p></NavigationMenuLink>
              <NavigationMenuLink href="/support">지원<p>도움말과 문의</p></NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}`,
      },
      {
        id: "navigation-menu-router-link",
        title: "라우터 링크와 활성 상태",
        description: "render로 라우터 Link를 합성하고 active로 현재 페이지를 표시합니다.",
        code: `import type { ComponentProps } from "react"
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, navigationMenuTriggerStyle } from "@/components/primitives/navigation-menu"

function AppLink(props: ComponentProps<"a">) {
  return <a {...props} />
}

export function NavigationMenuRouterLink() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink render={<AppLink href="/docs" />} active className={navigationMenuTriggerStyle()}>
            문서
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}`,
        note: "AppLink를 사용 중인 라우터 Link로 교체하고 현재 경로에서 active를 계산하세요.",
      },
      {
        id: "navigation-menu-controlled",
        title: "제어 상태와 지연",
        description:
          "value를 제어해 열린 항목을 추적하고 포인터 이동이 잦은 헤더에서는 delay를 조정합니다.",
        code: `import * as React from "react"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/primitives/navigation-menu"

export function NavigationMenuControlled() {
  const [value, setValue] = React.useState<string | null>(null)
  return (
    <NavigationMenu value={value} onValueChange={setValue} delay={100} closeDelay={150} align="start">
      <NavigationMenuList>
        <NavigationMenuItem value="learn">
          <NavigationMenuTrigger>배우기</NavigationMenuTrigger>
          <NavigationMenuContent><NavigationMenuLink href="/learn/start">시작하기</NavigationMenuLink></NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}`,
      },
    ],
    usageNotes: [
      "페이지 이동에는 NavigationMenuLink를 사용하고 저장, 삭제 같은 명령에는 DropdownMenu를 사용합니다.",
      "현재 래퍼는 Root 안에 Positioner를 자동으로 만들며 align 기본값은 start입니다.",
      "하위 콘텐츠는 짧은 설명형 링크 중심으로 유지하고 폼이나 복잡한 상호작용은 넣지 않습니다.",
    ],
    accessibility: [
      "NavigationMenuLink는 실제 href 또는 라우터 링크로 렌더링하고 현재 페이지에는 active를 전달합니다.",
      "Trigger 이름은 펼쳐지는 링크 그룹을 설명해야 하며 키보드 사용자는 방향키와 Escape로 탐색할 수 있습니다.",
      "모바일에서는 hover에 의존하지 말고 별도의 Sheet나 Sidebar 탐색 패턴을 제공하는 편이 안전합니다.",
    ],
    props: [
      {
        name: "value",
        type: "unknown | null",
        defaultValue: "null",
        description: "현재 열린 Item의 제어 값입니다.",
      },
      {
        name: "defaultValue",
        type: "unknown | null",
        defaultValue: "null",
        description: "처음 열어 둘 Item 값입니다.",
      },
      {
        name: "onValueChange",
        type: "(value, details) => void",
        defaultValue: "—",
        description: "열린 Item 변경 콜백입니다.",
      },
      {
        name: "delay",
        type: "number",
        defaultValue: "50",
        description: "팝업을 열기 전 지연(ms)입니다.",
      },
      {
        name: "closeDelay",
        type: "number",
        defaultValue: "50",
        description: "팝업을 닫기 전 지연(ms)입니다.",
      },
      {
        name: "align",
        type: '"start" | "center" | "end"',
        defaultValue: '"start"',
        description: "자동 Positioner의 정렬입니다.",
      },
      {
        name: "NavigationMenuLink.active",
        type: "boolean",
        defaultValue: "false",
        description: "현재 페이지 링크임을 표시합니다.",
      },
      {
        name: "NavigationMenuLink.closeOnClick",
        type: "boolean",
        defaultValue: "false",
        description: "링크 선택 시 메뉴를 닫을지 정합니다.",
      },
    ],
    related: ["dropdown-menu", "breadcrumb", "sidebar"],
  },
  pagination: {
    slug: "pagination",
    summary:
      "여러 페이지로 나뉜 콘텐츠의 현재 위치와 이동 수단을 제공합니다. 현재 페이지는 단단한 외곽선 컨트롤로, 나머지 이동은 조용한 ghost 행동으로 표현합니다.",
    examples: [
      {
        id: "pagination-basic",
        title: "기본",
        description: "이전, 페이지 번호, Ellipsis, 다음을 의미 있는 list 구조로 배치합니다.",
        preview: "default",
        code: `import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/primitives/pagination"

export function PaginationBasic() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem><PaginationPrevious href="?page=1" /></PaginationItem>
        <PaginationItem><PaginationLink href="?page=1">1</PaginationLink></PaginationItem>
        <PaginationItem><PaginationLink href="?page=2" isActive>2</PaginationLink></PaginationItem>
        <PaginationItem><PaginationEllipsis /></PaginationItem>
        <PaginationItem><PaginationNext href="?page=3" /></PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}`,
      },
      {
        id: "pagination-simple",
        title: "간단한 페이지 번호",
        description:
          "페이지 수가 적으면 생략 기호 없이 현재 위치와 가까운 페이지를 모두 보여 줍니다.",
        code: `import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/primitives/pagination"

export function PaginationSimple() {
  return (
    <Pagination>
      <PaginationContent>
        {[1, 2, 3, 4].map((page) => (
          <PaginationItem key={page}>
            <PaginationLink href={"?page=" + page} isActive={page === 2}>{page}</PaginationLink>
          </PaginationItem>
        ))}
      </PaginationContent>
    </Pagination>
  )
}`,
      },
      {
        id: "pagination-icons-only",
        title: "이전·다음만 표시",
        description:
          "표처럼 현재 범위를 별도로 설명하는 화면에서는 아이콘 크기의 이동만 남길 수 있습니다.",
        code: `import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/primitives/pagination"

export function PaginationIconsOnly() {
  return (
    <div className="space-y-2">
      <p className="text-center text-sm text-muted-foreground">21–40 / 128개</p>
      <Pagination>
        <PaginationContent>
          <PaginationItem><PaginationPrevious href="?page=1" size="icon" text="이전" /></PaginationItem>
          <PaginationItem><PaginationNext href="?page=3" size="icon" text="다음" /></PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}`,
      },
      {
        id: "pagination-disabled",
        title: "경계 페이지",
        description:
          "이동할 페이지가 없을 때 링크를 제거하지 않고 aria-disabled와 키보드 제외를 함께 적용합니다.",
        code: `import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/primitives/pagination"

export function PaginationBoundary() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" aria-disabled="true" tabIndex={-1} className="pointer-events-none opacity-45" onClick={(event) => event.preventDefault()} />
        </PaginationItem>
        <PaginationItem><PaginationLink href="?page=1" isActive>1</PaginationLink></PaginationItem>
        <PaginationItem><PaginationNext href="?page=2" text="다음" /></PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}`,
      },
    ],
    usageNotes: [
      "Pagination은 데이터를 직접 자르지 않으므로 현재 page, 전체 페이지 수, URL 동기화는 애플리케이션이 관리합니다.",
      "PaginationLink는 현재 구현에서 a 요소를 렌더링합니다. 프레임워크 Link가 필요하면 해당 라우터의 href 방식에 맞추거나 래퍼 소스를 확장합니다.",
      "Previous와 Next의 text prop으로 언어를 바꾸며 작은 화면에서는 텍스트가 숨고 aria-label은 별도로 유지됩니다.",
    ],
    accessibility: [
      "현재 페이지에는 isActive를 전달해 aria-current=page가 설정되게 합니다.",
      "사용할 수 없는 링크는 aria-disabled만으로 동작이 막히지 않으므로 tabIndex, 클릭 방지, 시각 상태를 함께 적용합니다.",
      "Ellipsis는 장식적 생략 표시이며 특정 페이지로 이동하는 행동처럼 만들지 않습니다.",
    ],
    props: [
      {
        name: "PaginationLink.isActive",
        type: "boolean",
        defaultValue: "false",
        description: "현재 페이지 스타일과 aria-current를 적용합니다.",
      },
      {
        name: "PaginationLink.size",
        type: "Button size",
        defaultValue: '"icon"',
        description: "페이지 링크 크기입니다.",
      },
      {
        name: "PaginationPrevious.text",
        type: "string",
        defaultValue: '"Previous"',
        description: "이전 링크의 반응형 텍스트입니다.",
      },
      {
        name: "PaginationNext.text",
        type: "string",
        defaultValue: '"Next"',
        description: "다음 링크의 반응형 텍스트입니다.",
      },
      { name: "href", type: "string", defaultValue: "—", description: "이동할 페이지 URL입니다." },
    ],
    related: ["button", "table", "breadcrumb"],
  },
  popover: {
    slug: "popover",
    summary:
      "트리거 가까이에 짧은 폼, 필터, 선택 등 상호작용 가능한 보조 콘텐츠를 띄웁니다. 단순 설명에는 Tooltip을, 집중된 긴 작업에는 Dialog를 사용합니다.",
    examples: [
      {
        id: "popover-basic",
        title: "기본",
        description: "Header, Title, Description으로 팝오버의 짧은 목적을 먼저 설명합니다.",
        preview: "default",
        code: `import { Button } from "@/components/primitives/button"
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/primitives/popover"

export function PopoverBasic() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>상태 보기</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader><PopoverTitle>프로젝트 상태</PopoverTitle><PopoverDescription>마지막 배포는 8분 전에 완료되었습니다.</PopoverDescription></PopoverHeader>
      </PopoverContent>
    </Popover>
  )
}`,
      },
      {
        id: "popover-position",
        title: "위치와 정렬",
        description: "side, align, offset으로 트리거와 팝오버의 시각적 연결을 조정합니다.",
        code: `import { Button } from "@/components/primitives/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/primitives/popover"

export function PopoverPosition() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>오른쪽 위에 열기</PopoverTrigger>
      <PopoverContent side="top" align="end" sideOffset={8} alignOffset={4}>
        트리거의 끝선에 맞춘 팝오버입니다.
      </PopoverContent>
    </Popover>
  )
}`,
      },
      {
        id: "popover-form",
        title: "간단한 폼",
        description: "두세 개의 가벼운 입력은 Popover 안에서 바로 수정하고 저장할 수 있습니다.",
        code: `import { Button } from "@/components/primitives/button"
import { Field, FieldLabel } from "@/components/primitives/field"
import { Input } from "@/components/primitives/input"
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/primitives/popover"

export function PopoverForm() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>크기 편집</PopoverTrigger>
      <PopoverContent>
        <PopoverHeader><PopoverTitle>프레임 크기</PopoverTitle><PopoverDescription>픽셀 단위로 입력하세요.</PopoverDescription></PopoverHeader>
        <div className="grid grid-cols-2 gap-3">
          <Field><FieldLabel htmlFor="width">너비</FieldLabel><Input id="width" defaultValue="1280" /></Field>
          <Field><FieldLabel htmlFor="height">높이</FieldLabel><Input id="height" defaultValue="720" /></Field>
        </div>
        <Button size="sm">적용</Button>
      </PopoverContent>
    </Popover>
  )
}`,
      },
      {
        id: "popover-controlled",
        title: "제어된 열림 상태",
        description: "선택이 완료되면 애플리케이션 상태를 갱신하고 Popover를 명시적으로 닫습니다.",
        code: `import * as React from "react"
import { Button } from "@/components/primitives/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/primitives/popover"

export function PopoverControlled() {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline" />}>공개 범위</PopoverTrigger>
      <PopoverContent>
        <Button variant="ghost" className="justify-start" onClick={() => setOpen(false)}>팀 전체</Button>
        <Button variant="ghost" className="justify-start" onClick={() => setOpen(false)}>초대된 멤버</Button>
      </PopoverContent>
    </Popover>
  )
}`,
      },
    ],
    usageNotes: [
      "PopoverContent의 기본 너비는 18rem이며 className으로 콘텐츠에 맞게 조정할 수 있습니다.",
      "현재 래퍼는 Close를 내보내지 않으므로 내부 행동에서 닫아야 하면 open과 onOpenChange를 제어합니다.",
      "초점이 반드시 갇혀야 하는 중요한 작업은 modal Popover보다 닫기 구조가 완비된 Dialog를 사용합니다.",
    ],
    accessibility: [
      "아이콘 트리거에는 aria-label을 제공하고 PopoverTitle과 PopoverDescription으로 팝업 목적을 설명합니다.",
      "열릴 때 초점이 갈 입력이 분명하면 initialFocus를 사용하고 닫힐 때는 기본 finalFocus로 트리거에 복귀시킵니다.",
      "hover만으로 열리는 설명은 Popover가 아니라 Tooltip을 사용합니다.",
    ],
    props: [
      { name: "open", type: "boolean", defaultValue: "—", description: "제어된 열림 상태입니다." },
      {
        name: "defaultOpen",
        type: "boolean",
        defaultValue: "false",
        description: "비제어 초기 열림 상태입니다.",
      },
      {
        name: "onOpenChange",
        type: "(open, details) => void",
        defaultValue: "—",
        description: "열림 상태 변경 콜백입니다.",
      },
      {
        name: "modal",
        type: 'boolean | "trap-focus"',
        defaultValue: "false",
        description: "배경 상호작용과 초점 제한 방식을 정합니다.",
      },
      {
        name: "PopoverContent.side",
        type: "Positioner side",
        defaultValue: '"bottom"',
        description: "팝오버가 우선 배치될 면입니다.",
      },
      {
        name: "PopoverContent.align",
        type: '"start" | "center" | "end"',
        defaultValue: '"center"',
        description: "트리거에 대한 정렬입니다.",
      },
      {
        name: "PopoverContent.sideOffset",
        type: "number",
        defaultValue: "4",
        description: "트리거와의 거리입니다.",
      },
      {
        name: "PopoverContent.initialFocus",
        type: "boolean | RefObject | function",
        defaultValue: "true",
        description: "열릴 때 이동할 초점입니다.",
      },
    ],
    related: ["tooltip", "dialog", "dropdown-menu"],
  },
  sheet: {
    slug: "sheet",
    summary:
      "화면 가장자리에서 나타나는 보조 Dialog입니다. 데스크톱의 설정, 필터, 세부 정보처럼 제스처보다 안정된 패널 흐름에 적합합니다.",
    examples: [
      {
        id: "sheet-basic",
        title: "기본",
        description: "기본 side=right인 패널에 Header, 본문, Footer를 구성합니다.",
        preview: "default",
        code: `import { Button } from "@/components/primitives/button"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/primitives/sheet"

export function SheetBasic() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>설정 열기</SheetTrigger>
      <SheetContent>
        <SheetHeader><SheetTitle>프로젝트 설정</SheetTitle><SheetDescription>이름과 공개 범위를 변경합니다.</SheetDescription></SheetHeader>
        <div className="flex-1 p-6">설정 내용</div>
        <SheetFooter><Button>저장</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  )
}`,
      },
      {
        id: "sheet-side",
        title: "열리는 면",
        description: "side로 top, right, bottom, left 중 정보 구조에 자연스러운 방향을 선택합니다.",
        code: `import { Button } from "@/components/primitives/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/primitives/sheet"

const sides = ["top", "right", "bottom", "left"] as const

export function SheetSides() {
  return (
    <div className="flex flex-wrap gap-2">
      {sides.map((side) => (
        <Sheet key={side}>
          <SheetTrigger render={<Button variant="outline" />}>{side}</SheetTrigger>
          <SheetContent side={side}><SheetHeader><SheetTitle>{side} Sheet</SheetTitle></SheetHeader></SheetContent>
        </Sheet>
      ))}
    </div>
  )
}`,
      },
      {
        id: "sheet-form",
        title: "설정 폼",
        description:
          "본문만 스크롤하고 Header와 Footer를 고정해 긴 설정에서도 행동을 잃지 않게 합니다.",
        code: `import { Button } from "@/components/primitives/button"
import { Field, FieldLabel } from "@/components/primitives/field"
import { Input } from "@/components/primitives/input"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/primitives/sheet"

export function SheetForm() {
  return (
    <Sheet>
      <SheetTrigger render={<Button />}>멤버 초대</SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader><SheetTitle>멤버 초대</SheetTitle><SheetDescription>이메일 주소로 초대장을 보냅니다.</SheetDescription></SheetHeader>
        <div className="flex-1 overflow-y-auto p-6"><Field><FieldLabel htmlFor="invite-email">이메일</FieldLabel><Input id="invite-email" type="email" /></Field></div>
        <SheetFooter><SheetClose render={<Button variant="outline" />}>취소</SheetClose><Button>초대 보내기</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  )
}`,
      },
      {
        id: "sheet-controlled",
        title: "제어 상태와 닫기 버튼",
        description: "제품 전용 닫기 행동이 있을 때 기본 버튼을 숨기고 open을 직접 관리합니다.",
        code: `import * as React from "react"
import { Button } from "@/components/primitives/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/primitives/sheet"

export function SheetControlled() {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>검사기 열기</Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent showCloseButton={false}>
          <SheetHeader><SheetTitle>레이어 검사기</SheetTitle><SheetDescription>선택한 레이어의 속성을 확인합니다.</SheetDescription></SheetHeader>
          <div className="p-6"><Button variant="outline" onClick={() => setOpen(false)}>검사기 닫기</Button></div>
        </SheetContent>
      </Sheet>
    </>
  )
}`,
      },
    ],
    usageNotes: [
      "오른쪽과 왼쪽 Sheet는 기본 75% 너비이며 sm 이상에서 max-w-sm입니다. className으로 제품 흐름에 맞게 확장합니다.",
      "showCloseButton=false를 사용할 때는 SheetClose 또는 제어 상태로 동등한 닫기 행동을 반드시 제공합니다.",
    ],
    accessibility: [
      "SheetTitle과 SheetDescription을 제공해 보조 패널의 목적을 알립니다.",
      "Sheet는 Dialog 기반 모달이므로 열릴 때 배경이 inert 처리되고 Escape로 닫히며 초점이 패널 안에 유지됩니다.",
      "side가 바뀌어도 읽기 순서와 Footer 행동 순서는 논리적인 DOM 순서를 유지합니다.",
    ],
    props: [
      { name: "open", type: "boolean", defaultValue: "—", description: "제어된 열림 상태입니다." },
      {
        name: "defaultOpen",
        type: "boolean",
        defaultValue: "false",
        description: "비제어 초기 열림 상태입니다.",
      },
      {
        name: "onOpenChange",
        type: "(open, details) => void",
        defaultValue: "—",
        description: "열림 상태 변경 콜백입니다.",
      },
      {
        name: "modal",
        type: 'boolean | "trap-focus"',
        defaultValue: "true",
        description: "배경 상호작용과 초점 제한을 정합니다.",
      },
      {
        name: "SheetContent.side",
        type: '"top" | "right" | "bottom" | "left"',
        defaultValue: '"right"',
        description: "패널이 나타날 화면 가장자리입니다.",
      },
      {
        name: "SheetContent.showCloseButton",
        type: "boolean",
        defaultValue: "true",
        description: "기본 닫기 버튼을 표시합니다.",
      },
      {
        name: "disablePointerDismissal",
        type: "boolean",
        defaultValue: "false",
        description: "바깥 누름으로 닫히는 것을 막습니다.",
      },
    ],
    related: ["dialog", "sidebar"],
  },
  sidebar: {
    slug: "sidebar",
    summary:
      "데스크톱과 모바일에서 앱의 주요 탐색, 그룹, 보조 행동을 구성하는 상태 기반 레이아웃입니다. Provider가 열림 상태, 쿠키, 단축키, 모바일 Sheet 전환을 관리하고, 검색·상태·카드 슬롯으로 실제 제품 탐색을 조합합니다.",
    examples: [
      {
        id: "sidebar-basic",
        title: "기본",
        description:
          "Provider 아래에 Sidebar와 main 영역을 형제로 두고 Trigger로 전체 레이아웃을 전환합니다.",
        preview: "default",
        code: `import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/primitives/sidebar"

export function SidebarBasic() {
  return (
    <SidebarProvider className="min-h-0! h-full">
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>워크스페이스</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem><SidebarMenuButton isActive>대시보드</SidebarMenuButton></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuButton>프로젝트</SidebarMenuButton></SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset><header className="p-4"><SidebarTrigger /></header><main className="p-6">콘텐츠</main></SidebarInset>
    </SidebarProvider>
  )
}`,
      },
      {
        id: "sidebar-composition",
        title: "제품 탐색 조합",
        description:
          "브랜드 헤더, 단축키가 있는 검색, 하위 메뉴, 상태 점, 배지, 푸터 카드를 하나의 조용한 탐색면으로 조합합니다.",
        code: `import { File01Icon, Settings02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Sidebar, SidebarCard, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuBadge, SidebarMenuButton,
  SidebarMenuChevron, SidebarMenuItem, SidebarMenuStatus, SidebarMenuSub, SidebarMenuSubButton,
  SidebarMenuSubItem, SidebarProvider, SidebarSearch,
} from "@/components/primitives/sidebar"

export function SidebarComposition() {
  return (
    <SidebarProvider className="min-h-0! h-full max-w-[16rem]">
      <Sidebar collapsible="none" className="h-full border-e border-sidebar-border/80">
        <SidebarHeader>
          <p className="px-1 text-sm font-semibold">Luma Studio</p>
          <SidebarSearch aria-label="탐색 검색" placeholder="검색..." shortcut="⌘K" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>플랫폼</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive><HugeiconsIcon icon={File01Icon} /><span>개요</span></SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton><HugeiconsIcon icon={File01Icon} /><span>파이프라인</span><SidebarMenuChevron open /></SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem><SidebarMenuSubButton href="#" isActive>배포</SidebarMenuSubButton></SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton><HugeiconsIcon icon={Settings02Icon} /><span>관찰성</span></SidebarMenuButton>
                  <SidebarMenuBadge variant="success">14</SidebarMenuBadge>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>리소스</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton><SidebarMenuStatus tone="success" /><span>API Gateway</span></SidebarMenuButton>
                  <SidebarMenuBadge variant="soft">Prod</SidebarMenuBadge>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarCard variant="frame">
            <p className="text-xs font-medium">팀 초대</p>
            <p className="text-[0.6875rem] text-muted-foreground">협업할 동료를 추가합니다.</p>
          </SidebarCard>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}`,
      },
      {
        id: "sidebar-variants",
        title: "Variant와 접힘 방식",
        description:
          "inset은 main 표면과 함께 사용하고 icon은 축소 상태에서도 주요 아이콘을 남깁니다.",
        code: `import { Home01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Sidebar, SidebarContent, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail } from "@/components/primitives/sidebar"

export function SidebarInsetVariant() {
  return (
    <SidebarProvider className="min-h-0! h-full">
      <Sidebar variant="inset" collapsible="icon">
        <SidebarContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton tooltip="홈"><HugeiconsIcon icon={Home01Icon} /><span>홈</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset><main className="p-6">메인 콘텐츠</main></SidebarInset>
    </SidebarProvider>
  )
}`,
      },
      {
        id: "sidebar-menu-states",
        title: "메뉴 Variant, 크기, 상태",
        description:
          "MenuButton은 outline variant, 세 가지 size, active, disabled, tooltip 상태를 제공합니다.",
        code: `import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/primitives/sidebar"

export function SidebarMenuStates() {
  return (
    <SidebarProvider className="min-h-0! h-full max-w-[16rem]">
      <Sidebar collapsible="none" className="h-full">
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem><SidebarMenuButton isActive>현재 프로젝트</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton variant="outline" size="sm">간결한 항목</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton size="lg">프로필과 설명</SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton disabled>권한 필요</SidebarMenuButton></SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}`,
      },
      {
        id: "sidebar-actions",
        title: "행동, 배지, 하위 메뉴",
        description: "주 탐색과 별도의 MenuAction, 읽기 전용 Badge, 한 단계 Sub 구조를 조합합니다.",
        code: `import { MoreHorizontalIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider } from "@/components/primitives/sidebar"

export function SidebarActions() {
  return (
    <SidebarProvider className="min-h-0! h-full max-w-[16rem]">
      <Sidebar collapsible="none" className="h-full"><SidebarContent><SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton>프로젝트</SidebarMenuButton>
          <SidebarMenuAction showOnHover aria-label="프로젝트 메뉴"><HugeiconsIcon icon={MoreHorizontalIcon} /></SidebarMenuAction>
          <SidebarMenuBadge>12</SidebarMenuBadge>
          <SidebarMenuSub><SidebarMenuSubItem><SidebarMenuSubButton href="/projects/recent" isActive>최근 항목</SidebarMenuSubButton></SidebarMenuSubItem></SidebarMenuSub>
        </SidebarMenuItem>
      </SidebarMenu></SidebarContent></Sidebar>
    </SidebarProvider>
  )
}`,
      },
      {
        id: "sidebar-controlled",
        title: "제어 상태",
        description: "Provider의 open을 제어해 앱 상태나 서버에서 읽은 사용자 선호와 동기화합니다.",
        code: `import * as React from "react"
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger } from "@/components/primitives/sidebar"

export function SidebarControlled() {
  const [open, setOpen] = React.useState(true)
  return (
    <SidebarProvider open={open} onOpenChange={setOpen} className="min-h-0! h-full">
      <Sidebar>
        <SidebarContent />
      </Sidebar>
      <main className="flex-1 p-4"><SidebarTrigger /><p className="mt-4">{open ? "펼쳐짐" : "접힘"}</p></main>
    </SidebarProvider>
  )
}`,
      },
      {
        id: "sidebar-loading",
        title: "입력과 로딩 상태",
        description:
          "검색 슬롯과 Skeleton을 사용해 탐색 구조를 유지한 채 데이터 준비 상태를 알립니다.",
        code: `import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuSkeleton, SidebarProvider, SidebarSearch } from "@/components/primitives/sidebar"

export function SidebarLoading() {
  return (
    <SidebarProvider className="min-h-0! h-full max-w-[16rem]">
      <Sidebar collapsible="none" className="h-full">
        <SidebarHeader><SidebarSearch aria-label="프로젝트 검색" placeholder="프로젝트 검색" shortcut="/" /></SidebarHeader>
        <SidebarContent><SidebarMenu>{[1, 2, 3].map((item) => <SidebarMenuItem key={item}><SidebarMenuSkeleton showIcon /></SidebarMenuItem>)}</SidebarMenu></SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
}`,
      },
    ],
    usageNotes: [
      "SidebarProvider는 필수이며 기본 너비 16rem, 모바일 18rem, icon 3.25rem과 Cmd/Ctrl+B 단축키를 사용합니다.",
      "variant=inset일 때는 main을 SidebarInset으로 감싸야 표면 간격과 라운드가 올바르게 적용됩니다.",
      "데스크톱의 open과 모바일의 openMobile은 별도 상태이며 useSidebar가 두 상태와 toggleSidebar를 제공합니다.",
      "Provider는 변경 상태를 sidebar_state 쿠키에 7일간 기록하지만 초기 서버 렌더에 자동으로 읽어 오지는 않으므로 필요하면 defaultOpen을 서버에서 전달합니다.",
      "Sidebar는 ambient 탐색면입니다. Primary 행동을 사이드바에 두지 말고, 현재 위치는 soft active 배경과 텍스트 무게로만 구분합니다.",
      "SidebarSearch, SidebarMenuStatus, SidebarMenuChevron, SidebarCard는 조합 슬롯이며 필수가 아닙니다.",
    ],
    accessibility: [
      "아이콘 접힘 상태의 MenuButton에는 tooltip을 제공하고 아이콘 자체와 별개로 읽을 수 있는 텍스트를 DOM에 유지합니다.",
      "MenuAction 같은 아이콘 버튼에는 sr-only 텍스트 또는 aria-label을 제공하고 주 링크와 별도 초점 대상으로 둡니다.",
      "현재 위치에는 isActive를 사용하되 라우터 링크라면 aria-current=page도 함께 전달합니다.",
      "SidebarSearch에는 visible label 또는 aria-label을 제공하고, shortcut은 장식용으로 pointer-events-none을 유지합니다.",
      "상태 점은 색만으로 의미를 전달하지 않도록 인접 텍스트나 aria 설명을 함께 둡니다.",
    ],
    props: [
      {
        name: "SidebarProvider.defaultOpen",
        type: "boolean",
        defaultValue: "true",
        description: "비제어 초기 펼침 상태입니다.",
      },
      {
        name: "SidebarProvider.open",
        type: "boolean",
        defaultValue: "—",
        description: "제어된 데스크톱 펼침 상태입니다.",
      },
      {
        name: "SidebarProvider.onOpenChange",
        type: "(open: boolean) => void",
        defaultValue: "—",
        description: "데스크톱 상태 변경 콜백입니다.",
      },
      {
        name: "Sidebar.side",
        type: '"left" | "right"',
        defaultValue: '"left"',
        description: "Sidebar가 놓일 면입니다.",
      },
      {
        name: "Sidebar.variant",
        type: '"sidebar" | "floating" | "inset"',
        defaultValue: '"sidebar"',
        description: "Sidebar와 main의 표면 관계입니다.",
      },
      {
        name: "Sidebar.collapsible",
        type: '"offcanvas" | "icon" | "none"',
        defaultValue: '"offcanvas"',
        description: "접힐 때의 표현입니다.",
      },
      {
        name: "SidebarMenuButton.variant",
        type: '"default" | "outline"',
        defaultValue: '"default"',
        description: "메뉴 버튼 표현입니다.",
      },
      {
        name: "SidebarMenuButton.size",
        type: '"sm" | "default" | "lg"',
        defaultValue: '"default"',
        description: "메뉴 버튼 높이와 밀도입니다.",
      },
      {
        name: "SidebarMenuButton.isActive",
        type: "boolean",
        defaultValue: "false",
        description: "현재 메뉴 항목 상태입니다.",
      },
      {
        name: "SidebarMenuButton.tooltip",
        type: "string | TooltipContent props",
        defaultValue: "—",
        description: "icon 접힘 상태에서만 보이는 설명입니다.",
      },
      {
        name: "SidebarMenuAction.showOnHover",
        type: "boolean",
        defaultValue: "false",
        description: "hover와 focus-within에서 행동을 드러냅니다.",
      },
      {
        name: "SidebarSearch.shortcut",
        type: "ReactNode",
        defaultValue: "—",
        description: "검색 필드 오른쪽에 표시하는 단축키 힌트입니다. 문자열이면 kbd로 렌더합니다.",
      },
      {
        name: "SidebarMenuBadge.variant",
        type: '"default" | "soft" | "success" | "info"',
        defaultValue: '"default"',
        description: "카운트·환경 라벨 배지의 표면입니다.",
      },
      {
        name: "SidebarMenuStatus.tone",
        type: '"neutral" | "success" | "warning" | "info" | "purple" | "destructive"',
        defaultValue: '"neutral"',
        description: "상태 점의 semantic 색입니다.",
      },
      {
        name: "SidebarMenuStatus.appearance",
        type: '"solid" | "ring"',
        defaultValue: '"solid"',
        description: "채워진 점 또는 링 형태입니다.",
      },
      {
        name: "SidebarMenuChevron.open",
        type: "boolean",
        defaultValue: "false",
        description: "하위 메뉴 펼침 affordance의 회전 상태입니다.",
      },
      {
        name: "SidebarCard.variant",
        type: '"muted" | "frame" | "plain"',
        defaultValue: '"muted"',
        description: "푸터 초대·한도·안내 카드의 표면 강도입니다.",
      },
    ],
    related: ["sheet", "tooltip", "collapsible", "dropdown-menu", "kbd"],
  },
  tabs: {
    slug: "tabs",
    summary:
      "서로 같은 위계의 콘텐츠 패널을 한 공간에서 전환합니다. muted 트랙 위의 sliding indicator 기본형과 열린 line형, 가로·세로 방향을 제공합니다.",
    examples: [
      {
        id: "tabs-basic",
        title: "기본",
        description:
          "각 Trigger와 Content에 같은 value를 연결하고 처음 표시할 패널을 defaultValue로 정합니다.",
        preview: "default",
        code: `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/primitives/tabs"

export function TabsBasic() {
  return (
    <Tabs defaultValue="overview" className="max-w-lg">
      <TabsList>
        <TabsTrigger value="overview">개요</TabsTrigger>
        <TabsTrigger value="activity">활동</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="pt-5">프로젝트의 핵심 정보입니다.</TabsContent>
      <TabsContent value="activity" className="pt-5">최근 팀 활동입니다.</TabsContent>
    </Tabs>
  )
}`,
      },
      {
        id: "tabs-line",
        title: "Line variant",
        description:
          "페이지 섹션처럼 열린 표면에서는 TabsList의 line variant로 경계를 가볍게 만듭니다.",
        code: `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/primitives/tabs"

export function TabsLine() {
  return (
    <Tabs defaultValue="preview" className="max-w-xl">
      <TabsList variant="line">
        <TabsTrigger value="preview">미리보기</TabsTrigger>
        <TabsTrigger value="code">코드</TabsTrigger>
        <TabsTrigger value="history">기록</TabsTrigger>
      </TabsList>
      <TabsContent value="preview" className="py-6">미리보기 콘텐츠</TabsContent>
      <TabsContent value="code" className="py-6">코드 콘텐츠</TabsContent>
      <TabsContent value="history" className="py-6">변경 기록</TabsContent>
    </Tabs>
  )
}`,
      },
      {
        id: "tabs-vertical",
        title: "세로 방향",
        description:
          "관련 설정 범주가 길면 orientation=vertical로 목록과 패널을 나란히 배치합니다.",
        code: `import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/primitives/tabs"

export function TabsVertical() {
  return (
    <Tabs defaultValue="profile" orientation="vertical" className="grid max-w-xl grid-cols-[10rem_1fr] gap-6">
      <TabsList>
        <TabsTrigger value="profile">프로필</TabsTrigger>
        <TabsTrigger value="security">보안</TabsTrigger>
        <TabsTrigger value="billing">결제</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">프로필 설정</TabsContent>
      <TabsContent value="security">보안 설정</TabsContent>
      <TabsContent value="billing">결제 설정</TabsContent>
    </Tabs>
  )
}`,
      },
      {
        id: "tabs-disabled-icons",
        title: "아이콘과 비활성 상태",
        description:
          "아이콘은 텍스트와 함께 사용하고 아직 접근할 수 없는 패널의 Trigger만 disabled 처리합니다.",
        code: `import { CodeIcon, ViewIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/primitives/tabs"

export function TabsDisabledIcons() {
  return (
    <Tabs defaultValue="preview">
      <TabsList>
        <TabsTrigger value="preview"><HugeiconsIcon icon={ViewIcon} />미리보기</TabsTrigger>
        <TabsTrigger value="code"><HugeiconsIcon icon={CodeIcon} />코드</TabsTrigger>
        <TabsTrigger value="audit" disabled>감사 기록</TabsTrigger>
      </TabsList>
      <TabsContent value="preview">결과 미리보기</TabsContent>
      <TabsContent value="code">코드 보기</TabsContent>
    </Tabs>
  )
}`,
      },
      {
        id: "tabs-controlled",
        title: "제어된 탭",
        description: "현재 탭을 URL이나 분석 이벤트와 동기화할 때 value를 제어합니다.",
        code: `import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/primitives/tabs"

export function TabsControlled() {
  const [tab, setTab] = React.useState("monthly")
  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList><TabsTrigger value="monthly">월간</TabsTrigger><TabsTrigger value="yearly">연간</TabsTrigger></TabsList>
      <TabsContent value="monthly">월간 결제</TabsContent>
      <TabsContent value="yearly">연간 결제</TabsContent>
    </Tabs>
  )
}`,
      },
    ],
    usageNotes: [
      "탭은 같은 위계의 콘텐츠를 전환할 때 사용하며 순차 작업이나 깊은 페이지 탐색을 대신하지 않습니다.",
      "Trigger와 Content의 value는 고유하고 정확히 일치해야 합니다.",
      "TabsList는 활성 Trigger의 위치와 크기를 따르는 indicator를 자동으로 렌더링합니다. reduced motion 환경에서는 이동 전환을 제거합니다.",
      "첫 Tab이 disabled인 SSR 화면에서는 Base UI가 사전에 대체 탭을 알 수 없으므로 enabled Tab을 value 또는 defaultValue로 명시합니다.",
    ],
    accessibility: [
      "가로 Tabs는 좌우 방향키, 세로 Tabs는 위아래 방향키로 이동하며 Base UI가 tab과 tabpanel 관계를 연결합니다.",
      "아이콘만으로 탭 이름을 표현하지 말고 보이는 텍스트 또는 접근 가능한 이름을 제공합니다.",
      "숨겨진 패널 안의 중요한 상태가 탭 전환 없이도 전달되어야 하는지 검토합니다.",
    ],
    props: [
      {
        name: "value",
        type: "unknown | null",
        defaultValue: "—",
        description: "현재 활성 Tab의 제어 값입니다.",
      },
      {
        name: "defaultValue",
        type: "unknown | null",
        defaultValue: "첫 활성 Tab",
        description: "비제어 초기 활성 값입니다.",
      },
      {
        name: "onValueChange",
        type: "(value, details) => void",
        defaultValue: "—",
        description: "활성 Tab 변경 콜백입니다.",
      },
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        defaultValue: '"horizontal"',
        description: "레이아웃과 키보드 탐색 방향입니다.",
      },
      {
        name: "TabsList.variant",
        type: '"default" | "line"',
        defaultValue: '"default"',
        description: "squircle 표면 또는 line 표현입니다.",
      },
      {
        name: "TabsTrigger.value",
        type: "unknown",
        defaultValue: "필수",
        description: "연결할 패널의 값입니다.",
      },
      {
        name: "TabsTrigger.disabled",
        type: "boolean",
        defaultValue: "false",
        description: "개별 Tab을 비활성화합니다.",
      },
      {
        name: "TabsContent.keepMounted",
        type: "boolean",
        defaultValue: "false",
        description: "비활성 패널도 DOM에 유지합니다.",
      },
    ],
    related: ["navigation-menu", "toggle-group", "card"],
  },
  tooltip: {
    slug: "tooltip",
    summary:
      "포인터 hover 또는 키보드 focus에서 컨트롤의 짧은 보조 설명을 보여 줍니다. Luma는 Provider의 열기 지연을 0ms로 설정해 도구형 인터페이스에서 즉시 반응합니다.",
    examples: [
      {
        id: "tooltip-basic",
        title: "기본",
        description: "앱 루트의 Provider 아래에서 Trigger와 Content를 함께 구성합니다.",
        preview: "default",
        code: `import { InformationCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/primitives/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/primitives/tooltip"

export function TooltipBasic() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" size="icon" aria-label="도움말" />}><HugeiconsIcon icon={InformationCircleIcon} /></TooltipTrigger>
        <TooltipContent>프로젝트 도움말</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}`,
      },
      {
        id: "tooltip-side",
        title: "위치",
        description: "side와 align으로 주변 컨트롤을 가리지 않는 면을 선택합니다.",
        code: `import { Button } from "@/components/primitives/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/primitives/tooltip"

const sides = ["top", "right", "bottom", "left"] as const

export function TooltipSides() {
  return (
    <TooltipProvider>
      <div className="flex gap-2">
        {sides.map((side) => (
          <Tooltip key={side}><TooltipTrigger render={<Button variant="outline" />}>{side}</TooltipTrigger><TooltipContent side={side}>{side}에 표시</TooltipContent></Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}`,
      },
      {
        id: "tooltip-keyboard",
        title: "키보드 단축키",
        description: "Kbd를 함께 배치해 컨트롤 설명과 실제 단축키를 한 줄로 안내합니다.",
        code: `import { Button } from "@/components/primitives/button"
import { Kbd, KbdGroup } from "@/components/primitives/kbd"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/primitives/tooltip"

export function TooltipKeyboard() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline" />}>명령 팔레트</TooltipTrigger>
        <TooltipContent>열기 <KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup></TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}`,
      },
      {
        id: "tooltip-disabled",
        title: "비활성 버튼",
        description:
          "disabled 버튼은 포인터와 초점을 받지 않으므로 span을 Trigger로 사용하고 이유를 설명합니다.",
        code: `import { Button } from "@/components/primitives/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/primitives/tooltip"

export function TooltipDisabledButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex" tabIndex={0} />}><Button disabled>배포</Button></TooltipTrigger>
        <TooltipContent>먼저 변경 사항을 저장하세요.</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}`,
      },
      {
        id: "tooltip-delay",
        title: "공유 지연 시간",
        description:
          "정보 탐색 화면에서는 Provider의 delay와 closeDelay를 조정해 우발적인 팝업을 줄입니다.",
        code: `import { Button } from "@/components/primitives/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/primitives/tooltip"

export function TooltipDelay() {
  return (
    <TooltipProvider delay={400} closeDelay={100} timeout={500}>
      <Tooltip><TooltipTrigger render={<Button variant="outline" />}>세부 정보</TooltipTrigger><TooltipContent>400ms 뒤에 열립니다.</TooltipContent></Tooltip>
    </TooltipProvider>
  )
}`,
      },
    ],
    usageNotes: [
      "TooltipProvider는 앱 루트에 한 번 두어 인접한 Tooltip의 지연 동작을 공유합니다.",
      "긴 설명, 링크, 버튼, 폼처럼 상호작용이 필요한 콘텐츠에는 Tooltip 대신 Popover를 사용합니다.",
      "Tooltip은 터치 환경에서 항상 발견 가능하지 않으므로 필수 정보나 오류의 유일한 전달 수단으로 쓰지 않습니다.",
    ],
    accessibility: [
      "아이콘 버튼은 Tooltip과 별개로 aria-label을 가져야 하며 Tooltip은 이름이 아닌 보조 설명입니다.",
      "비활성 버튼의 이유를 Tooltip으로 보일 때 focus 가능한 wrapper를 사용하되 wrapper가 실제 버튼처럼 오인되지 않게 합니다.",
      "Trigger focus와 Escape 닫힘을 직접 막지 않습니다.",
    ],
    props: [
      {
        name: "TooltipProvider.delay",
        type: "number",
        defaultValue: "0",
        description: "열기 전 대기 시간(ms)입니다.",
      },
      {
        name: "TooltipProvider.closeDelay",
        type: "number",
        defaultValue: "—",
        description: "닫기 전 대기 시간(ms)입니다.",
      },
      {
        name: "TooltipProvider.timeout",
        type: "number",
        defaultValue: "400",
        description: "다음 Tooltip을 즉시 여는 공유 시간입니다.",
      },
      { name: "open", type: "boolean", defaultValue: "—", description: "제어된 열림 상태입니다." },
      {
        name: "disabled",
        type: "boolean",
        defaultValue: "false",
        description: "Tooltip 자체를 비활성화합니다.",
      },
      {
        name: "trackCursorAxis",
        type: '"none" | "x" | "y" | "both"',
        defaultValue: '"none"',
        description: "포인터를 따라갈 축입니다.",
      },
      {
        name: "TooltipContent.side",
        type: "Positioner side",
        defaultValue: '"top"',
        description: "Tooltip이 우선 배치될 면입니다.",
      },
      {
        name: "TooltipContent.align",
        type: '"start" | "center" | "end"',
        defaultValue: '"center"',
        description: "Trigger에 대한 정렬입니다.",
      },
      {
        name: "TooltipContent.sideOffset",
        type: "number",
        defaultValue: "4",
        description: "Trigger와의 거리입니다.",
      },
    ],
    related: ["popover", "kbd", "button"],
  },
  "scroll-area": {
    slug: "scroll-area",
    summary:
      "브라우저의 네이티브 스크롤 동작은 유지하면서 Luma의 조용한 스크롤바를 제한된 영역에 적용합니다. 스크롤 중이거나 hover일 때만 Thumb가 드러납니다.",
    examples: [
      {
        id: "scroll-area-basic",
        title: "기본 세로 스크롤",
        description: "높이를 명시한 Root 안에서 콘텐츠가 넘칠 때 기본 세로 ScrollBar가 나타납니다.",
        preview: "default",
        code: `import { ScrollArea } from "@/components/primitives/scroll-area"

export function ScrollAreaBasic() {
  return (
    <ScrollArea className="h-64 w-80 rounded-3xl border">
      <div className="space-y-2 p-4">
        {Array.from({ length: 16 }, (_, index) => <div key={index} className="rounded-2xl bg-muted p-3">항목 {index + 1}</div>)}
      </div>
    </ScrollArea>
  )
}`,
      },
      {
        id: "scroll-area-horizontal",
        title: "가로 스크롤",
        description:
          "너비가 고정된 Viewport에 가로 콘텐츠와 orientation=horizontal인 ScrollBar를 추가합니다.",
        code: `import { ScrollArea, ScrollBar } from "@/components/primitives/scroll-area"

export function ScrollAreaHorizontal() {
  return (
    <ScrollArea className="w-96 rounded-3xl border">
      <div className="flex w-max gap-3 p-4">
        {Array.from({ length: 8 }, (_, index) => <div key={index} className="h-32 w-48 rounded-2xl bg-muted p-4">에셋 {index + 1}</div>)}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}`,
      },
      {
        id: "scroll-area-both",
        title: "양방향 스크롤",
        description:
          "넓고 긴 콘텐츠에는 기본 세로 ScrollBar와 추가 가로 ScrollBar를 함께 사용합니다.",
        code: `import { ScrollArea, ScrollBar } from "@/components/primitives/scroll-area"

export function ScrollAreaBothAxes() {
  return (
    <ScrollArea className="h-72 w-96 rounded-3xl border">
      <div className="h-[36rem] w-[48rem] bg-muted/40 p-6">큰 캔버스 콘텐츠</div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}`,
      },
      {
        id: "scroll-area-menu",
        title: "긴 선택 목록",
        description: "목록 전체 페이지가 아닌 선택 영역만 제한해 주변 문맥을 유지합니다.",
        code: `import { Button } from "@/components/primitives/button"
import { ScrollArea } from "@/components/primitives/scroll-area"

export function ScrollAreaMenu() {
  return (
    <ScrollArea className="h-56 w-72 rounded-3xl border p-2">
      {Array.from({ length: 20 }, (_, index) => <Button key={index} variant="ghost" className="w-full justify-start">프로젝트 {index + 1}</Button>)}
    </ScrollArea>
  )
}`,
      },
    ],
    usageNotes: [
      "ScrollArea가 작동하려면 높이 또는 너비 중 스크롤을 제한할 축의 크기가 명확해야 합니다.",
      "Root는 세로 ScrollBar와 Corner를 자동으로 렌더링하며 가로 ScrollBar는 children으로 추가합니다.",
      "페이지 전체 스크롤을 대체하지 말고 선택 목록, 로그, 에셋 스트립처럼 경계가 분명한 영역에 사용합니다.",
    ],
    accessibility: [
      "Viewport는 네이티브 스크롤 동작과 포커스 표시를 유지하므로 wheel, touch, 키보드 스크롤을 막지 않습니다.",
      "스크롤 영역에 별도 이름이 필요한 문맥이면 바깥 section에 heading을 두거나 적절한 aria-label을 전달합니다.",
      "스크롤바가 숨겨져 있어도 콘텐츠가 더 있다는 단서를 잘린 항목, 크기, 문맥으로 제공하고 스크롤바만 의존하지 않습니다.",
    ],
    props: [
      {
        name: "overflowEdgeThreshold",
        type: "number | edge object",
        defaultValue: "0",
        description: "overflow edge data 상태가 적용될 임계값(px)입니다.",
      },
      {
        name: "ScrollBar.orientation",
        type: '"vertical" | "horizontal"',
        defaultValue: '"vertical"',
        description: "ScrollBar가 제어할 축입니다.",
      },
      {
        name: "ScrollBar.keepMounted",
        type: "boolean",
        defaultValue: "false",
        description: "overflow가 없어도 ScrollBar DOM을 유지합니다.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "—",
        description: "Root의 크기, 경계, 배경을 설정합니다.",
      },
    ],
    related: ["separator", "sidebar", "command"],
  },
  separator: {
    slug: "separator",
    summary:
      "콘텐츠 그룹 사이에 얇고 차분한 시각·의미 경계를 만듭니다. 박스와 배경을 늘리지 않고 정보 리듬을 나눌 때 사용합니다.",
    examples: [
      {
        id: "separator-basic",
        title: "기본 가로 구분선",
        description: "관련 정보 묶음 사이에 기본 horizontal Separator를 둡니다.",
        preview: "default",
        code: `import { Separator } from "@/components/primitives/separator"

export function SeparatorBasic() {
  return (
    <div className="max-w-md">
      <div><p className="font-medium">Luma UI</p><p className="text-sm text-muted-foreground">React 컴포넌트 레지스트리</p></div>
      <Separator className="my-5" />
      <p className="text-sm">Base UI · Tailwind CSS · Hugeicons</p>
    </div>
  )
}`,
      },
      {
        id: "separator-vertical",
        title: "세로 구분선",
        description:
          "같은 행의 짧은 메타데이터나 행동 그룹 사이에는 vertical을 사용하고 높이를 제공합니다.",
        code: `import { Separator } from "@/components/primitives/separator"

export function SeparatorVertical() {
  return (
    <div className="flex h-5 items-center gap-4 text-sm">
      <span>문서</span><Separator orientation="vertical" /><span>컴포넌트</span><Separator orientation="vertical" /><span>레지스트리</span>
    </div>
  )
}`,
      },
      {
        id: "separator-menu",
        title: "메뉴 그룹",
        description:
          "텍스트 링크 그룹 사이를 가볍게 나누되 각 링크의 간격을 먼저 충분히 확보합니다.",
        code: `import { Button } from "@/components/primitives/button"
import { Separator } from "@/components/primitives/separator"

export function SeparatorMenu() {
  return (
    <nav aria-label="문서 도구" className="flex h-9 items-center gap-1">
      <Button variant="ghost" size="sm">편집</Button>
      <Button variant="ghost" size="sm">복제</Button>
      <Separator orientation="vertical" className="mx-2" />
      <Button variant="ghost" size="sm">공유</Button>
    </nav>
  )
}`,
      },
      {
        id: "separator-list",
        title: "목록",
        description:
          "반복 목록에서는 마지막 항목 뒤에 불필요한 선이 생기지 않도록 항목 사이에만 렌더링합니다.",
        code: `import { Fragment } from "react"
import { Separator } from "@/components/primitives/separator"

const updates = ["검색 개선", "새로운 Sheet", "RTL 지원"]

export function SeparatorList() {
  return (
    <div className="max-w-md">
      {updates.map((update, index) => (
        <Fragment key={update}>
          <div className="py-4 text-sm">{update}</div>
          {index < updates.length - 1 && <Separator />}
        </Fragment>
      ))}
    </div>
  )
}`,
      },
    ],
    usageNotes: [
      "레이아웃 간격만 필요하면 gap이나 padding을 사용하고 정보 그룹의 경계가 있을 때만 Separator를 추가합니다.",
      "vertical Separator는 부모의 높이를 늘리지 않으므로 부모 또는 className으로 의미 있는 높이를 정합니다.",
      "Luma의 기본 border 색을 유지하고 선을 진하게 만들어 위계를 대신하지 않습니다.",
    ],
    accessibility: [
      "Base UI Separator는 스크린 리더가 인식하는 role=separator와 orientation 정보를 제공합니다.",
      "오직 장식 목적으로 중복되는 선이라면 aria-hidden=true를 전달해 불필요한 탐색 정보를 줄입니다.",
      "Separator만으로 섹션 이름을 대신하지 말고 필요한 경우 heading이나 label을 함께 제공합니다.",
    ],
    props: [
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        defaultValue: '"horizontal"',
        description: "구분선 방향과 의미 orientation입니다.",
      },
      {
        name: "aria-hidden",
        type: "boolean",
        defaultValue: "false",
        description: "순수 장식 구분선을 접근성 트리에서 숨깁니다.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "—",
        description: "길이, 여백, 색을 기본 스타일과 병합합니다.",
      },
    ],
    related: ["scroll-area", "dropdown-menu", "sidebar"],
  },
};
