import type { ComponentGuideMap } from "./types";

export const formGuides: ComponentGuideMap = {
  checkbox: {
    slug: "checkbox",
    summary:
      "Checkbox는 서로 독립적인 항목을 선택하거나 하나의 동의 상태를 켜고 끌 때 사용합니다. 레이블과 설명, 오류 상태는 Field와 함께 구성합니다.",
    examples: [
      {
        id: "basic",
        title: "기본",
        description: "id와 htmlFor를 연결해 체크박스 전체의 의미를 분명하게 전달합니다.",
        preview: "default",
        code: String.raw`import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"

export function CheckboxBasic() {
  return (
    <Field orientation="horizontal">
      <Checkbox id="terms" />
      <FieldLabel htmlFor="terms">이용 약관에 동의합니다.</FieldLabel>
    </Field>
  )
}`,
      },
      {
        id: "controlled",
        title: "제어 상태",
        description: "checked와 onCheckedChange로 선택 상태를 애플리케이션 상태와 동기화합니다.",
        code: String.raw`import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"

export function CheckboxControlled() {
  const [checked, setChecked] = React.useState(false)

  return (
    <Field orientation="horizontal">
      <Checkbox id="notifications" checked={checked} onCheckedChange={setChecked} />
      <FieldLabel htmlFor="notifications">
        알림 {checked ? "받는 중" : "받지 않음"}
      </FieldLabel>
    </Field>
  )
}`,
      },
      {
        id: "indeterminate",
        title: "일부 선택",
        description: "하위 항목이 일부만 선택된 경우 indeterminate 상태로 부분 선택을 표현합니다.",
        code: String.raw`import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"

export function CheckboxIndeterminate() {
  return (
    <Field orientation="horizontal">
      <Checkbox id="select-page" indeterminate aria-label="현재 페이지 일부 선택됨" />
      <FieldLabel htmlFor="select-page">현재 페이지의 항목 선택</FieldLabel>
    </Field>
  )
}`,
      },
      {
        id: "description",
        title: "설명이 있는 항목",
        description:
          "FieldContent로 레이블과 보조 설명을 묶어 긴 설정 문구도 안정적으로 정렬합니다.",
        code: String.raw`import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"

export function CheckboxDescription() {
  return (
    <Field orientation="horizontal">
      <Checkbox id="analytics" />
      <FieldContent>
        <FieldLabel htmlFor="analytics">사용 분석 허용</FieldLabel>
        <FieldDescription>서비스 개선을 위해 익명 사용 정보를 공유합니다.</FieldDescription>
      </FieldContent>
    </Field>
  )
}`,
      },
      {
        id: "states",
        title: "비활성 및 오류",
        description: "컨트롤의 의미 상태와 Field의 시각 상태를 함께 설정합니다.",
        code: String.raw`import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"

export function CheckboxStates() {
  return (
    <div className="grid gap-5">
      <Field orientation="horizontal" data-disabled>
        <Checkbox id="locked" disabled defaultChecked />
        <FieldLabel htmlFor="locked">관리자가 적용한 정책</FieldLabel>
      </Field>
      <Field data-invalid>
        <div className="flex items-center gap-3">
          <Checkbox id="required-terms" aria-invalid />
          <FieldLabel htmlFor="required-terms">필수 약관 동의</FieldLabel>
        </div>
        <FieldError>계속하려면 약관에 동의하세요.</FieldError>
      </Field>
    </div>
  )
}`,
      },
      {
        id: "group",
        title: "선택 목록",
        description: "관련된 체크박스는 fieldset과 legend로 하나의 질문처럼 그룹화합니다.",
        code: String.raw`import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"

const channels = ["이메일", "문자 메시지", "앱 푸시"]

export function CheckboxGroup() {
  return (
    <FieldSet>
      <FieldLegend>알림 채널</FieldLegend>
      <FieldGroup>
        {channels.map((channel) => {
          const id = "channel-" + channel
          return (
            <Field key={channel} orientation="horizontal">
              <Checkbox id={id} name="channels" value={channel} />
              <FieldLabel htmlFor={id}>{channel}</FieldLabel>
            </Field>
          )
        })}
      </FieldGroup>
    </FieldSet>
  )
}`,
      },
    ],
    usageNotes: [
      "여러 항목을 동시에 선택할 수 있을 때 Checkbox를 사용하고, 하나만 선택해야 하면 Radio Group이나 Select를 사용하세요.",
      "초기값만 필요하면 defaultChecked, 외부 상태와 동기화하려면 checked와 onCheckedChange를 함께 사용하세요.",
      "일부 선택은 checked 값에 문자열을 넣는 방식이 아니라 별도의 indeterminate prop으로 표현하세요.",
    ],
    accessibility: [
      "Checkbox의 id와 FieldLabel의 htmlFor를 일치시키거나, 보이는 레이블이 없다면 aria-label을 제공하세요.",
      "오류 시 Checkbox에 aria-invalid를, 주변 Field에는 data-invalid를 설정하고 FieldError로 해결 방법을 안내하세요.",
      "관련 선택 목록은 FieldSet과 FieldLegend로 묶어 스크린 리더 사용자가 질문의 범위를 이해할 수 있게 하세요.",
    ],
    props: [
      {
        name: "checked",
        type: "boolean",
        defaultValue: "—",
        description: "제어 방식의 선택 상태입니다.",
      },
      {
        name: "defaultChecked",
        type: "boolean",
        defaultValue: "false",
        description: "비제어 방식의 초기 선택 상태입니다.",
      },
      {
        name: "onCheckedChange",
        type: "(checked: boolean) => void",
        defaultValue: "—",
        description: "선택 상태가 바뀔 때 호출됩니다.",
      },
      {
        name: "indeterminate",
        type: "boolean",
        defaultValue: "false",
        description: "일부 선택된 혼합 상태를 표시합니다.",
      },
      {
        name: "disabled",
        type: "boolean",
        defaultValue: "false",
        description: "상호작용과 포커스를 비활성화합니다.",
      },
      {
        name: "readOnly",
        type: "boolean",
        defaultValue: "false",
        description: "현재 상태를 표시하되 사용자가 변경하지 못하게 합니다.",
      },
      {
        name: "required",
        type: "boolean",
        defaultValue: "false",
        description: "폼 제출에 선택이 필요함을 지정합니다.",
      },
      {
        name: "name",
        type: "string",
        defaultValue: "—",
        description: "폼 제출 시 사용할 필드 이름입니다.",
      },
      {
        name: "value",
        type: "string",
        defaultValue: "—",
        description: "선택됐을 때 제출할 값입니다.",
      },
    ],
    related: ["field", "label", "radio-group", "switch"],
  },

  combobox: {
    slug: "combobox",
    summary:
      "Combobox는 입력으로 목록을 필터링해 값을 빠르게 찾는 선택 컨트롤입니다. 단일 선택, 다중 칩, 그룹, 외부 트리거 구성을 지원합니다.",
    examples: [
      {
        id: "basic",
        title: "기본",
        description:
          "문자열 배열을 items로 전달하면 기본 필터링과 키보드 탐색을 바로 사용할 수 있습니다.",
        preview: "default",
        code: String.raw`import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

const frameworks = ["Astro", "Next.js", "Remix", "SvelteKit"]

export function ComboboxBasic() {
  return (
    <Combobox items={frameworks}>
      <ComboboxInput placeholder="프레임워크 검색" />
      <ComboboxContent>
        <ComboboxEmpty>검색 결과가 없습니다.</ComboboxEmpty>
        <ComboboxList>
          {(item) => <ComboboxItem value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}`,
      },
      {
        id: "controlled",
        title: "제어 선택",
        description: "선택값과 검색어를 각각 제어해 서버 검색이나 URL 상태와 연결할 수 있습니다.",
        code: String.raw`import * as React from "react"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

const teams = ["Design", "Engineering", "Marketing"]

export function ComboboxControlled() {
  const [value, setValue] = React.useState<string | null>(null)
  const [query, setQuery] = React.useState("")

  return (
    <Combobox
      items={teams}
      value={value}
      onValueChange={setValue}
      inputValue={query}
      onInputValueChange={setQuery}
    >
      <ComboboxInput placeholder="팀 검색" showClear />
      <ComboboxContent>
        <ComboboxEmpty>일치하는 팀이 없습니다.</ComboboxEmpty>
        <ComboboxList>
          {(team) => <ComboboxItem value={team}>{team}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}`,
      },
      {
        id: "objects",
        title: "객체 항목",
        description: "객체를 값으로 사용할 때 표시 문자열과 제출 문자열을 명시합니다.",
        code: String.raw`import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

const people = [
  { id: "ada", name: "Ada Lovelace" },
  { id: "grace", name: "Grace Hopper" },
]

export function ComboboxObjects() {
  return (
    <Combobox<(typeof people)[number]>
      items={people}
      itemToStringLabel={(person) => person.name}
      itemToStringValue={(person) => person.id}
      isItemEqualToValue={(a, b) => a.id === b.id}
    >
      <ComboboxInput placeholder="담당자 검색" />
      <ComboboxContent>
        <ComboboxList>
          {(person) => (
            <ComboboxItem value={person}>{person.name}</ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}`,
      },
      {
        id: "multiple",
        title: "다중 선택과 칩",
        description: "multiple과 칩 구성으로 여러 값을 검색하고 제거할 수 있습니다.",
        code: String.raw`import * as React from "react"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox"

const skills = ["React", "TypeScript", "Astro", "Tailwind CSS"]

export function ComboboxMultiple() {
  const [value, setValue] = React.useState<string[]>([])
  return (
    <Combobox items={skills} multiple value={value} onValueChange={setValue}>
      <ComboboxChips>
        <ComboboxValue>
          {value.map((skill) => <ComboboxChip key={skill}>{skill}</ComboboxChip>)}
        </ComboboxValue>
        <ComboboxChipsInput placeholder="기술 추가" />
      </ComboboxChips>
      <ComboboxContent>
        <ComboboxEmpty>검색 결과가 없습니다.</ComboboxEmpty>
        <ComboboxList>
          {(skill) => <ComboboxItem value={skill}>{skill}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}`,
      },
      {
        id: "groups",
        title: "그룹과 구분선",
        description: "Group, Label, Collection을 사용해 긴 목록의 정보 구조를 드러냅니다.",
        code: String.raw`import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
} from "@/components/ui/combobox"

const groups = [
  { label: "한국", items: ["서울", "부산"] },
  { label: "일본", items: ["도쿄", "오사카"] },
]

export function ComboboxGroups() {
  return (
    <Combobox items={groups}>
      <ComboboxInput placeholder="도시 검색" />
      <ComboboxContent>
        <ComboboxList>
          {(group, index) => (
            <ComboboxGroup items={group.items}>
              {index > 0 && <ComboboxSeparator />}
              <ComboboxLabel>{group.label}</ComboboxLabel>
              <ComboboxCollection>
                {(city) => <ComboboxItem value={city}>{city}</ComboboxItem>}
              </ComboboxCollection>
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}`,
      },
      {
        id: "auto-highlight",
        title: "자동 하이라이트",
        description:
          "검색 후 Enter로 빠르게 선택하는 흐름에서는 첫 결과를 자동으로 강조할 수 있습니다.",
        code: String.raw`import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"

const commands = ["새 문서", "파일 열기", "설정 열기"]

export function ComboboxAutoHighlight() {
  return (
    <Combobox items={commands} autoHighlight>
      <ComboboxInput placeholder="명령 검색" showClear />
      <ComboboxContent>
        <ComboboxEmpty>실행할 명령이 없습니다.</ComboboxEmpty>
        <ComboboxList>
          {(command) => <ComboboxItem value={command}>{command}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}`,
      },
      {
        id: "popup",
        title: "버튼에서 여는 팝업",
        description: "외부 트리거를 사용할 때는 검색 입력을 Content 안으로 이동합니다.",
        code: String.raw`import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox"

const statuses = ["예정", "진행 중", "완료"]

export function ComboboxPopup() {
  return (
    <Combobox items={statuses}>
      <ComboboxTrigger render={<Button variant="outline" />}>
        <ComboboxValue>상태 선택</ComboboxValue>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput placeholder="상태 검색" showTrigger={false} />
        <ComboboxList>
          {(status) => <ComboboxItem value={status}>{status}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}`,
      },
      {
        id: "states",
        title: "비활성 및 오류",
        description: "비활성은 Root와 Input에 함께 전달하고 오류는 입력과 Field에 함께 표시합니다.",
        code: String.raw`import { Combobox, ComboboxInput } from "@/components/ui/combobox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"

export function ComboboxStates() {
  return (
    <div className="grid gap-6">
      <Combobox items={["잠긴 항목"]} disabled>
        <ComboboxInput disabled placeholder="선택할 수 없음" />
      </Combobox>
      <Field data-invalid>
        <FieldLabel htmlFor="assignee">담당자</FieldLabel>
        <Combobox items={["민준", "서연"]}>
          <ComboboxInput id="assignee" aria-invalid placeholder="담당자 검색" />
        </Combobox>
        <FieldError>담당자를 한 명 선택하세요.</FieldError>
      </Field>
    </div>
  )
}`,
      },
    ],
    usageNotes: [
      "선택지가 짧고 검색이 필요 없다면 Select를 사용하고, 사용자가 목록을 입력으로 좁혀야 할 때 Combobox를 사용하세요.",
      "객체 항목에는 itemToStringLabel과 itemToStringValue를 지정하고, 객체 참조가 바뀔 수 있으면 isItemEqualToValue도 제공하세요.",
      "showClear는 선택을 되돌릴 수 있어야 하는 선택 필드에만 사용하고, 필수 필드에서는 초기화 뒤의 오류 흐름을 함께 설계하세요.",
    ],
    accessibility: [
      "ComboboxInput에 연결된 FieldLabel을 제공하고, 빈 결과는 ComboboxEmpty의 짧고 구체적인 문장으로 알리세요.",
      "아이콘만 있는 clear 및 trigger 버튼의 이름은 컴포넌트가 제공하더라도 제품 언어와 맞는지 스크린 리더로 확인하세요.",
      "키보드 강조 상태는 Base UI가 관리하므로 항목의 data-highlighted 스타일을 제거하지 마세요.",
    ],
    props: [
      {
        name: "items",
        type: "readonly Value[] | readonly Group[]",
        defaultValue: "—",
        description: "표시하고 필터링할 항목입니다.",
      },
      {
        name: "value",
        type: "Value | Value[] | null",
        defaultValue: "—",
        description: "제어 방식의 선택값입니다.",
      },
      {
        name: "defaultValue",
        type: "Value | Value[] | null",
        defaultValue: "—",
        description: "비제어 방식의 초기 선택값입니다.",
      },
      {
        name: "onValueChange",
        type: "(value) => void",
        defaultValue: "—",
        description: "선택값이 변경될 때 호출됩니다.",
      },
      {
        name: "multiple",
        type: "boolean",
        defaultValue: "false",
        description: "다중 선택을 활성화합니다.",
      },
      {
        name: "inputValue",
        type: "string",
        defaultValue: "—",
        description: "제어 방식의 검색어입니다.",
      },
      {
        name: "onInputValueChange",
        type: "(value: string) => void",
        defaultValue: "—",
        description: "검색어가 변경될 때 호출됩니다.",
      },
      {
        name: "autoHighlight",
        type: "boolean",
        defaultValue: "false",
        description: "필터링 시 첫 항목을 자동으로 강조합니다.",
      },
      {
        name: "disabled",
        type: "boolean",
        defaultValue: "false",
        description: "전체 Combobox 상호작용을 비활성화합니다.",
      },
      {
        name: "ComboboxInput.showTrigger",
        type: "boolean",
        defaultValue: "true",
        description: "입력 끝의 열기 버튼을 표시합니다.",
      },
      {
        name: "ComboboxInput.showClear",
        type: "boolean",
        defaultValue: "false",
        description: "선택 및 검색어 초기화 버튼을 표시합니다.",
      },
      {
        name: "ComboboxContent.side",
        type: "PositionerSide",
        defaultValue: '"bottom"',
        description: "팝업이 열리는 방향입니다.",
      },
      {
        name: "ComboboxChip.showRemove",
        type: "boolean",
        defaultValue: "true",
        description: "칩의 제거 버튼을 표시합니다.",
      },
    ],
    related: ["field", "input-group", "select", "button"],
  },

  field: {
    slug: "field",
    summary:
      "Field는 레이블, 컨트롤, 설명과 오류를 일관된 간격과 의미 구조로 묶는 폼 구성 단위입니다.",
    examples: [
      {
        id: "basic",
        title: "기본 필드",
        description: "레이블과 입력의 id를 연결하고 필요한 설명을 같은 Field 안에 둡니다.",
        preview: "default",
        code: String.raw`import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function FieldBasic() {
  return (
    <Field>
      <FieldLabel htmlFor="display-name">표시 이름</FieldLabel>
      <Input id="display-name" placeholder="김루마" />
      <FieldDescription>프로필과 댓글에 공개됩니다.</FieldDescription>
    </Field>
  )
}`,
      },
      {
        id: "horizontal",
        title: "가로 배치",
        description: "짧은 토글 설정은 horizontal 방향으로 컨트롤과 설명을 나란히 배치합니다.",
        code: String.raw`import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"

export function FieldHorizontal() {
  return (
    <Field orientation="horizontal">
      <Switch id="weekly-summary" />
      <FieldContent>
        <FieldLabel htmlFor="weekly-summary">주간 요약</FieldLabel>
        <FieldDescription>매주 월요일에 활동 요약을 보냅니다.</FieldDescription>
      </FieldContent>
    </Field>
  )
}`,
      },
      {
        id: "responsive",
        title: "반응형 배치",
        description:
          "responsive 방향은 FieldGroup의 컨테이너 너비에 따라 세로와 가로 배치를 전환합니다.",
        code: String.raw`import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function FieldResponsive() {
  return (
    <FieldGroup>
      <Field orientation="responsive">
        <FieldLabel htmlFor="company">회사</FieldLabel>
        <Input id="company" />
      </Field>
      <Field orientation="responsive">
        <FieldLabel htmlFor="role">직무</FieldLabel>
        <Input id="role" />
      </Field>
    </FieldGroup>
  )
}`,
      },
      {
        id: "fieldset",
        title: "의미 있는 필드셋",
        description: "관련 필드는 FieldSet과 FieldLegend로 묶어 하나의 섹션으로 전달합니다.",
        code: String.raw`import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function FieldFieldset() {
  return (
    <FieldSet>
      <FieldLegend>배송 정보</FieldLegend>
      <FieldDescription>주문 상품을 받을 주소를 입력하세요.</FieldDescription>
      <FieldGroup>
        <Field><FieldLabel htmlFor="recipient">받는 사람</FieldLabel><Input id="recipient" /></Field>
        <Field><FieldLabel htmlFor="address">주소</FieldLabel><Input id="address" /></Field>
      </FieldGroup>
    </FieldSet>
  )
}`,
      },
      {
        id: "legend-variants",
        title: "Legend 표현",
        description: "중첩된 작은 그룹에는 label variant를 사용해 제목의 위계를 낮춥니다.",
        code: String.raw`import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"

export function FieldLegendVariants() {
  return (
    <FieldSet>
      <FieldLegend>알림 설정</FieldLegend>
      <FieldGroup>
        <FieldSet>
          <FieldLegend variant="label">수신 채널</FieldLegend>
          <div className="flex gap-4">
            <Checkbox aria-label="이메일" />
            <Checkbox aria-label="문자 메시지" />
          </div>
        </FieldSet>
      </FieldGroup>
    </FieldSet>
  )
}`,
      },
      {
        id: "choice-card",
        title: "선택 카드",
        description:
          "FieldLabel이 Field 전체를 감싸면 넉넉한 라운드 표면 전체를 클릭할 수 있습니다.",
        code: String.raw`import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function FieldChoiceCard() {
  return (
    <RadioGroup defaultValue="pro">
      <FieldLabel>
        <Field orientation="horizontal">
          <RadioGroupItem value="pro" aria-label="프로 요금제" />
          <FieldContent>
            <FieldTitle>프로</FieldTitle>
            <FieldDescription>팀 권한과 무제한 프로젝트를 포함합니다.</FieldDescription>
          </FieldContent>
        </Field>
      </FieldLabel>
    </RadioGroup>
  )
}`,
      },
      {
        id: "separator",
        title: "필드 그룹 구분",
        description: "긴 설정 묶음은 FieldSeparator로 필요한 지점만 조용하게 구분합니다.",
        code: String.raw`import { Field, FieldGroup, FieldLabel, FieldSeparator } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function FieldWithSeparator() {
  return (
    <FieldGroup>
      <Field><FieldLabel htmlFor="first-name">이름</FieldLabel><Input id="first-name" /></Field>
      <FieldSeparator>연락처</FieldSeparator>
      <Field><FieldLabel htmlFor="email">이메일</FieldLabel><Input id="email" type="email" /></Field>
    </FieldGroup>
  )
}`,
      },
      {
        id: "errors",
        title: "검증 오류",
        description: "FieldError는 단일 메시지뿐 아니라 중복을 제거한 여러 검증 결과도 표시합니다.",
        code: String.raw`import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function FieldErrors() {
  const errors = [
    { message: "8자 이상 입력하세요." },
    { message: "숫자를 하나 이상 포함하세요." },
  ]

  return (
    <Field data-invalid>
      <FieldLabel htmlFor="password">비밀번호</FieldLabel>
      <Input id="password" type="password" aria-invalid aria-describedby="password-error" />
      <FieldError id="password-error" errors={errors} />
    </Field>
  )
}`,
      },
    ],
    usageNotes: [
      "모든 폼 컨트롤을 별도 카드로 만들기보다 Field의 간격과 방향으로 정보 위계를 먼저 만드세요.",
      "orientation=responsive는 FieldGroup 컨테이너를 기준으로 동작하며, 좁은 영역에서는 자동으로 세로 배치를 유지합니다.",
      "FieldTitle은 label 요소가 필요 없는 카드형 설명 제목에 사용하고, 실제 입력 이름은 FieldLabel로 제공하세요.",
    ],
    accessibility: [
      "관련 입력 묶음에는 div 대신 FieldSet과 FieldLegend를 사용해 그룹 이름을 의미 구조에 포함하세요.",
      "오류가 있으면 Field에 data-invalid, 실제 컨트롤에 aria-invalid를 함께 설정하고 aria-describedby로 FieldError를 연결하세요.",
      "FieldSeparator는 시각적 장식이므로 의미 섹션을 대신하지 않으며, 그룹이 바뀌는 곳에만 제한적으로 사용하세요.",
    ],
    props: [
      {
        name: "Field.orientation",
        type: '"vertical" | "horizontal" | "responsive"',
        defaultValue: '"vertical"',
        description: "레이블과 컨트롤의 배치 방향입니다.",
      },
      {
        name: "Field.data-invalid",
        type: "boolean",
        defaultValue: "false",
        description: "필드 전체의 오류 스타일을 활성화합니다.",
      },
      {
        name: "Field.data-disabled",
        type: "boolean",
        defaultValue: "false",
        description: "레이블과 설명에 비활성 스타일을 전달합니다.",
      },
      {
        name: "FieldLegend.variant",
        type: '"legend" | "label"',
        defaultValue: '"legend"',
        description: "범례의 시각적 위계를 선택합니다.",
      },
      {
        name: "FieldError.errors",
        type: "Array<{ message?: string } | undefined>",
        defaultValue: "—",
        description: "표시할 검증 오류 목록입니다.",
      },
      {
        name: "FieldError.children",
        type: "React.ReactNode",
        defaultValue: "—",
        description: "직접 제공할 오류 내용입니다.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "—",
        description: "각 슬롯의 기본 스타일과 병합할 클래스입니다.",
      },
    ],
    related: ["input", "textarea", "checkbox", "radio-group", "select", "switch"],
  },

  input: {
    slug: "input",
    summary:
      "Input은 한 줄 텍스트, 숫자, 이메일, 비밀번호와 파일을 받는 기본 컨트롤입니다. Luma의 기본 40px 높이와 포커스 상태를 공유합니다.",
    examples: [
      {
        id: "basic",
        title: "기본",
        description: "placeholder는 입력 형식을 돕고, 실제 필드 이름은 FieldLabel로 제공합니다.",
        preview: "default",
        code: String.raw`import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function InputBasic() {
  return (
    <Field>
      <FieldLabel htmlFor="email">이메일</FieldLabel>
      <Input id="email" type="email" placeholder="name@example.com" />
    </Field>
  )
}`,
      },
      {
        id: "types",
        title: "입력 타입",
        description:
          "브라우저 키보드와 자동완성을 활용하도록 데이터에 맞는 type과 autoComplete를 지정합니다.",
        code: String.raw`import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function InputTypes() {
  return (
    <FieldGroup>
      <Field><FieldLabel htmlFor="name">이름</FieldLabel><Input id="name" autoComplete="name" /></Field>
      <Field><FieldLabel htmlFor="phone">전화번호</FieldLabel><Input id="phone" type="tel" autoComplete="tel" /></Field>
      <Field><FieldLabel htmlFor="website">웹사이트</FieldLabel><Input id="website" type="url" inputMode="url" /></Field>
    </FieldGroup>
  )
}`,
      },
      {
        id: "controlled",
        title: "제어 입력",
        description:
          "value와 onChange로 입력을 제어할 때 사용자가 입력할 때마다 상태를 갱신합니다.",
        code: String.raw`import * as React from "react"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function InputControlled() {
  const [slug, setSlug] = React.useState("")
  return (
    <Field>
      <FieldLabel htmlFor="slug">프로젝트 주소</FieldLabel>
      <Input id="slug" value={slug} onChange={(event) => setSlug(event.target.value)} />
      <FieldDescription>luma.dev/{slug || "project"}</FieldDescription>
    </Field>
  )
}`,
      },
      {
        id: "file",
        title: "파일",
        description: "file 타입은 허용할 형식과 다중 선택 여부를 명시해 선택 범위를 좁힙니다.",
        code: String.raw`import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function InputFile() {
  return (
    <Field>
      <FieldLabel htmlFor="avatar">프로필 이미지</FieldLabel>
      <Input id="avatar" type="file" accept="image/png,image/jpeg" />
      <FieldDescription>PNG 또는 JPG, 최대 5MB</FieldDescription>
    </Field>
  )
}`,
      },
      {
        id: "required",
        title: "필수 입력",
        description: "required 속성과 보이는 필수 표시를 함께 제공해 제출 조건을 미리 알립니다.",
        code: String.raw`import { Badge } from "@/components/ui/badge"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function InputRequired() {
  return (
    <Field>
      <FieldLabel htmlFor="company">
        회사명 <Badge variant="secondary">필수</Badge>
      </FieldLabel>
      <Input id="company" name="company" required />
    </Field>
  )
}`,
      },
      {
        id: "states",
        title: "비활성 및 읽기 전용",
        description: "수정할 수 없는 값은 목적에 따라 disabled와 readOnly를 구분합니다.",
        code: String.raw`import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function InputStates() {
  return (
    <FieldGroup>
      <Field data-disabled>
        <FieldLabel htmlFor="disabled-id">사용자 ID</FieldLabel>
        <Input id="disabled-id" value="user_2048" disabled readOnly />
      </Field>
      <Field>
        <FieldLabel htmlFor="readonly-plan">현재 요금제</FieldLabel>
        <Input id="readonly-plan" value="Pro" readOnly />
      </Field>
    </FieldGroup>
  )
}`,
      },
      {
        id: "invalid",
        title: "오류 상태",
        description:
          "aria-invalid와 FieldError를 연결해 오류의 위치와 해결 방법을 함께 전달합니다.",
        code: String.raw`import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function InputInvalid() {
  return (
    <Field data-invalid>
      <FieldLabel htmlFor="work-email">업무 이메일</FieldLabel>
      <Input id="work-email" type="email" aria-invalid aria-describedby="work-email-error" />
      <FieldError id="work-email-error">회사 도메인의 이메일을 입력하세요.</FieldError>
    </Field>
  )
}`,
      },
      {
        id: "inline",
        title: "인라인 작업",
        description: "짧은 제출 흐름은 가로 Field와 Button으로 하나의 읽기 순서를 유지합니다.",
        code: String.raw`import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function InputInline() {
  return (
    <Field>
      <FieldLabel htmlFor="invite-email">팀원 초대</FieldLabel>
      <div className="flex gap-3">
        <Input id="invite-email" type="email" placeholder="team@example.com" />
        <Button type="submit">초대</Button>
      </div>
    </Field>
  )
}`,
      },
      {
        id: "grid",
        title: "그리드 폼",
        description: "관련된 짧은 입력은 반응형 그리드로 묶되 모바일에서는 한 열로 유지합니다.",
        code: String.raw`import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function InputGrid() {
  return (
    <FieldGroup className="grid gap-5 sm:grid-cols-2">
      <Field><FieldLabel htmlFor="first">이름</FieldLabel><Input id="first" /></Field>
      <Field><FieldLabel htmlFor="last">성</FieldLabel><Input id="last" /></Field>
      <Field className="sm:col-span-2"><FieldLabel htmlFor="address">주소</FieldLabel><Input id="address" /></Field>
    </FieldGroup>
  )
}`,
      },
    ],
    usageNotes: [
      "Input은 고정된 h-10과 rounded-2xl 스타일을 가지므로 크기 변형처럼 보이게 임의로 높이만 줄이기보다 주변 Field 간격을 조절하세요.",
      "placeholder는 예시나 형식을 안내하는 보조 정보이며 레이블을 대신하지 않습니다.",
      "파일 입력은 accept로 선택 가능한 형식을 제한하되, 서버에서도 파일 형식과 크기를 다시 검증하세요.",
    ],
    accessibility: [
      "모든 입력은 FieldLabel의 htmlFor와 Input의 id를 연결하고 데이터에 맞는 type과 autoComplete를 사용하세요.",
      "필수 입력은 required를 사용하고, 오류 입력에는 aria-invalid와 aria-describedby를 설정하세요.",
      "disabled 값은 제출되지 않습니다. 값을 제출해야 하지만 수정만 막으려면 readOnly를 사용하세요.",
    ],
    props: [
      {
        name: "type",
        type: "React.HTMLInputTypeAttribute",
        defaultValue: '"text"',
        description: "브라우저 입력 방식과 의미를 지정합니다.",
      },
      {
        name: "value",
        type: "string | number | readonly string[]",
        defaultValue: "—",
        description: "제어 방식의 현재 값입니다.",
      },
      {
        name: "defaultValue",
        type: "string | number | readonly string[]",
        defaultValue: "—",
        description: "비제어 방식의 초기 값입니다.",
      },
      {
        name: "onChange",
        type: "React.ChangeEventHandler<HTMLInputElement>",
        defaultValue: "—",
        description: "입력값이 변경될 때 호출됩니다.",
      },
      {
        name: "disabled",
        type: "boolean",
        defaultValue: "false",
        description: "입력과 폼 제출을 비활성화합니다.",
      },
      {
        name: "readOnly",
        type: "boolean",
        defaultValue: "false",
        description: "값은 유지하면서 수정을 막습니다.",
      },
      {
        name: "required",
        type: "boolean",
        defaultValue: "false",
        description: "폼 제출에 값이 필요함을 지정합니다.",
      },
      {
        name: "aria-invalid",
        type: "boolean | 'grammar' | 'spelling'",
        defaultValue: "false",
        description: "보조 기술에 오류 상태를 전달합니다.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "—",
        description: "기본 입력 스타일과 병합할 클래스입니다.",
      },
    ],
    related: ["field", "input-group", "label", "button", "textarea"],
  },

  "input-group": {
    slug: "input-group",
    summary:
      "Input Group은 입력과 아이콘, 텍스트, 버튼, 키보드 힌트를 하나의 부드러운 제어 표면 안에 결합합니다.",
    examples: [
      {
        id: "basic",
        title: "아이콘 입력",
        description:
          "Addon을 입력 뒤에 두고 align으로 시작 위치에 배치하면 포커스 흐름과 시각 순서를 모두 지킬 수 있습니다.",
        preview: "default",
        code: String.raw`import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

export function InputGroupBasic() {
  return (
    <InputGroup>
      <InputGroupInput aria-label="문서 검색" placeholder="문서 검색" />
      <InputGroupAddon align="inline-start">
        <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
      </InputGroupAddon>
    </InputGroup>
  )
}`,
      },
      {
        id: "inline-align",
        title: "인라인 정렬",
        description: "접두 텍스트와 끝 작업을 입력 양쪽에 배치해 하나의 값처럼 읽히게 합니다.",
        code: String.raw`import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"

export function InputGroupInlineAlign() {
  return (
    <InputGroup>
      <InputGroupInput aria-label="웹사이트 주소" defaultValue="my-team" />
      <InputGroupAddon align="inline-start">
        <InputGroupText>luma.dev/</InputGroupText>
      </InputGroupAddon>
      <InputGroupAddon align="inline-end">
        <InputGroupButton>복사</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}`,
      },
      {
        id: "block-align",
        title: "블록 정렬과 Textarea",
        description: "긴 입력에는 block-start와 block-end로 제목과 작업 표시줄을 세로로 쌓습니다.",
        code: String.raw`import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"

export function InputGroupBlockAlign() {
  return (
    <InputGroup>
      <InputGroupTextarea aria-label="메시지" placeholder="메시지를 입력하세요." />
      <InputGroupAddon align="block-start" className="border-b">
        <InputGroupText>새 메시지</InputGroupText>
      </InputGroupAddon>
      <InputGroupAddon align="block-end">
        <InputGroupText className="mr-auto">Markdown 지원</InputGroupText>
        <InputGroupButton variant="default">보내기</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}`,
      },
      {
        id: "button-sizes",
        title: "버튼 크기와 Kbd",
        description: "텍스트 버튼과 아이콘 버튼, 단축키를 입력 높이에 맞는 작은 크기로 사용합니다.",
        code: String.raw`import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"

export function InputGroupActions() {
  return (
    <InputGroup>
      <InputGroupInput aria-label="명령 검색" placeholder="명령 검색" />
      <InputGroupAddon align="inline-end">
        <Kbd>⌘ K</Kbd>
        <InputGroupButton size="icon-xs" aria-label="검색어 지우기">
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}`,
      },
      {
        id: "states",
        title: "비활성 및 오류",
        description:
          "실제 control의 disabled와 aria-invalid가 그룹 표면 전체의 상태 스타일을 구동합니다.",
        code: String.raw`import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"

export function InputGroupStates() {
  return (
    <div className="grid gap-5">
      <InputGroup data-disabled>
        <InputGroupInput disabled value="읽기 전용 계정" readOnly />
        <InputGroupAddon align="inline-end"><InputGroupText>잠김</InputGroupText></InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="쿠폰 코드" aria-invalid defaultValue="EXPIRED" />
        <InputGroupAddon align="inline-end"><InputGroupText>만료됨</InputGroupText></InputGroupAddon>
      </InputGroup>
    </div>
  )
}`,
      },
      {
        id: "custom-control",
        title: "사용자 정의 컨트롤",
        description:
          "직접 만든 입력에는 input-group-control 슬롯을 지정해 그룹 포커스 스타일을 연결합니다.",
        code: String.raw`import { InputGroup, InputGroupAddon, InputGroupText } from "@/components/ui/input-group"

export function InputGroupCustomControl() {
  return (
    <InputGroup>
      <input
        data-slot="input-group-control"
        className="h-10 min-w-0 flex-1 bg-transparent px-4 outline-none"
        aria-label="금액"
        inputMode="decimal"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>KRW</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  )
}`,
      },
    ],
    usageNotes: [
      "InputGroupAddon은 DOM에서 InputGroupInput 또는 InputGroupTextarea 뒤에 두고 align으로 시각적 위치를 정하세요.",
      "Input에는 inline 정렬을, Textarea에는 block 정렬을 우선 사용하면 넉넉한 Luma 제어 표면이 유지됩니다.",
      "InputGroupButton의 기본 type은 button이므로 폼 제출 버튼이 필요할 때만 type=submit을 명시하세요.",
    ],
    accessibility: [
      "장식 아이콘은 숨기고, 아이콘 전용 InputGroupButton에는 동작을 설명하는 aria-label을 제공하세요.",
      "Addon의 텍스트가 단위나 접두사일 뿐 레이블은 아니므로 InputGroupInput에도 FieldLabel이나 aria-label을 제공하세요.",
      "오류는 InputGroupInput에 aria-invalid를 설정하고 그룹 밖의 FieldError와 aria-describedby로 연결하세요.",
    ],
    props: [
      {
        name: "InputGroupAddon.align",
        type: '"inline-start" | "inline-end" | "block-start" | "block-end"',
        defaultValue: '"inline-start"',
        description: "Addon의 시각적 배치 위치입니다.",
      },
      {
        name: "InputGroupButton.size",
        type: '"xs" | "sm" | "icon-xs" | "icon-sm"',
        defaultValue: '"xs"',
        description: "그룹 안 버튼의 크기입니다.",
      },
      {
        name: "InputGroupButton.variant",
        type: "Button variant",
        defaultValue: '"ghost"',
        description: "그룹 안 버튼의 시각적 표현입니다.",
      },
      {
        name: "InputGroupButton.type",
        type: '"button" | "submit" | "reset"',
        defaultValue: '"button"',
        description: "폼에서 버튼이 수행할 동작입니다.",
      },
      {
        name: "InputGroupInput",
        type: "React.ComponentProps<'input'>",
        defaultValue: "—",
        description: "Input props를 전달받는 그룹용 한 줄 입력입니다.",
      },
      {
        name: "InputGroupTextarea",
        type: "React.ComponentProps<'textarea'>",
        defaultValue: "—",
        description: "Textarea props를 전달받는 그룹용 여러 줄 입력입니다.",
      },
    ],
    related: ["input", "textarea", "button", "kbd", "field"],
  },

  "input-otp": {
    slug: "input-otp",
    summary:
      "Input OTP는 하나의 접근 가능한 입력을 여러 슬롯으로 보여 주어 인증 코드와 짧은 PIN을 빠르게 입력하게 합니다.",
    examples: [
      {
        id: "basic",
        title: "6자리 인증 코드",
        description: "maxLength와 같은 수의 슬롯을 만들고 의미 있는 그룹 단위로 나눕니다.",
        preview: "default",
        code: String.raw`import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

export function InputOTPBasic() {
  return (
    <InputOTP maxLength={6} aria-label="6자리 인증 코드" autoComplete="one-time-code">
      <InputOTPGroup>
        <InputOTPSlot index={0} /><InputOTPSlot index={1} /><InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} /><InputOTPSlot index={4} /><InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  )
}`,
      },
      {
        id: "digits",
        title: "숫자 PIN",
        description: "숫자 전용 pattern과 inputMode를 함께 사용해 모바일 숫자 키보드를 유도합니다.",
        code: String.raw`import { REGEXP_ONLY_DIGITS } from "input-otp"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

export function InputOTPDigits() {
  return (
    <InputOTP maxLength={4} pattern={REGEXP_ONLY_DIGITS} inputMode="numeric" aria-label="4자리 PIN">
      <InputOTPGroup>
        {[0, 1, 2, 3].map((index) => <InputOTPSlot key={index} index={index} />)}
      </InputOTPGroup>
    </InputOTP>
  )
}`,
      },
      {
        id: "alphanumeric",
        title: "영문·숫자 코드",
        description: "초대 코드처럼 문자와 숫자를 함께 받는 경우 제공된 정규식 상수를 사용합니다.",
        code: String.raw`import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

export function InputOTPAlphanumeric() {
  return (
    <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS_AND_CHARS} aria-label="초대 코드">
      <InputOTPGroup>
        {Array.from({ length: 6 }, (_, index) => <InputOTPSlot key={index} index={index} />)}
      </InputOTPGroup>
    </InputOTP>
  )
}`,
      },
      {
        id: "controlled",
        title: "제어 및 입력 완료",
        description:
          "value와 onChange로 값을 제어하고 onComplete에서 전체 코드가 채워진 시점을 처리합니다.",
        code: String.raw`import * as React from "react"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

export function InputOTPControlled() {
  const [value, setValue] = React.useState("")
  const [complete, setComplete] = React.useState(false)
  return (
    <div className="grid gap-3">
      <InputOTP maxLength={4} value={value} onChange={setValue} onComplete={() => setComplete(true)}>
        <InputOTPGroup>
          {[0, 1, 2, 3].map((index) => <InputOTPSlot key={index} index={index} />)}
        </InputOTPGroup>
      </InputOTP>
      <p className="text-sm text-muted-foreground">{complete ? "입력 완료" : value.length + "/4자리"}</p>
    </div>
  )
}`,
      },
      {
        id: "states",
        title: "비활성 및 오류",
        description: "InputOTP의 의미 상태와 각 시각 슬롯의 aria-invalid를 함께 설정합니다.",
        code: String.raw`import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

export function InputOTPStates() {
  return (
    <div className="grid gap-5">
      <InputOTP maxLength={4} disabled value="2048" onChange={() => {}}>
        <InputOTPGroup>{[0, 1, 2, 3].map((i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
      </InputOTP>
      <InputOTP maxLength={4} aria-invalid aria-describedby="otp-error">
        <InputOTPGroup>{[0, 1, 2, 3].map((i) => <InputOTPSlot key={i} index={i} aria-invalid />)}</InputOTPGroup>
      </InputOTP>
      <p id="otp-error" className="text-sm text-destructive">코드가 만료되었습니다.</p>
    </div>
  )
}`,
      },
    ],
    usageNotes: [
      "maxLength는 필수이며 InputOTPSlot의 index는 0부터 maxLength - 1까지 빠짐없이 구성하세요.",
      "Input OTP는 복사와 붙여넣기를 지원하므로 슬롯별 별도 input 상태를 만들지 마세요.",
      "숫자 코드에는 REGEXP_ONLY_DIGITS와 inputMode=numeric을 함께 사용하고, 영문이 포함되면 알파벳·숫자 패턴을 선택하세요.",
    ],
    accessibility: [
      "숨은 실제 입력에 aria-label 또는 FieldLabel을 제공하고 autoComplete=one-time-code로 인증 코드 자동완성을 허용하세요.",
      "시각적 오류 스타일은 슬롯의 aria-invalid로, 보조 기술의 오류 의미는 InputOTP의 aria-invalid와 aria-describedby로 전달하세요.",
      "InputOTPSeparator는 role=separator를 가지며 숫자를 읽는 순서를 바꾸지 않도록 장식적인 구분에만 사용하세요.",
    ],
    props: [
      {
        name: "maxLength",
        type: "number",
        defaultValue: "필수",
        description: "입력 가능한 최대 문자 수입니다.",
      },
      {
        name: "value",
        type: "string",
        defaultValue: "—",
        description: "제어 방식의 현재 코드입니다.",
      },
      {
        name: "onChange",
        type: "(value: string) => unknown",
        defaultValue: "—",
        description: "코드가 변경될 때 호출됩니다.",
      },
      {
        name: "onComplete",
        type: "() => unknown",
        defaultValue: "—",
        description: "모든 문자가 입력됐을 때 호출됩니다.",
      },
      {
        name: "pattern",
        type: "string",
        defaultValue: "—",
        description: "허용할 문자 패턴입니다.",
      },
      {
        name: "disabled",
        type: "boolean",
        defaultValue: "false",
        description: "코드 입력을 비활성화합니다.",
      },
      {
        name: "containerClassName",
        type: "string",
        defaultValue: "—",
        description: "슬롯 전체 컨테이너에 병합할 클래스입니다.",
      },
      {
        name: "InputOTPSlot.index",
        type: "number",
        defaultValue: "필수",
        description: "표시할 문자 슬롯의 0 기반 위치입니다.",
      },
    ],
    related: ["field", "input", "button"],
  },

  label: {
    slug: "label",
    summary:
      "Label은 네이티브 label 요소에 Luma 타이포그래피와 상태 스타일을 더합니다. 복잡한 폼에는 FieldLabel을 우선 사용합니다.",
    examples: [
      {
        id: "basic",
        title: "기본",
        description: "htmlFor와 컨트롤 id를 일치시켜 레이블을 클릭해도 입력에 포커스되게 합니다.",
        preview: "default",
        code: String.raw`import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LabelBasic() {
  return (
    <div className="grid gap-2.5">
      <Label htmlFor="email">이메일</Label>
      <Input id="email" type="email" />
    </div>
  )
}`,
      },
      {
        id: "field",
        title: "Field 안의 레이블",
        description:
          "설명과 오류가 있는 실제 폼에서는 FieldLabel을 사용해 필드 간격과 상태를 함께 관리합니다.",
        code: String.raw`import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LabelInField() {
  return (
    <Field>
      <FieldLabel htmlFor="username">사용자 이름</FieldLabel>
      <Input id="username" />
      <FieldDescription>공개 프로필 주소에 사용됩니다.</FieldDescription>
    </Field>
  )
}`,
      },
      {
        id: "choice",
        title: "선택 컨트롤",
        description: "작은 선택 컨트롤에도 각 항목별로 고유한 id와 레이블을 제공합니다.",
        code: String.raw`import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function LabelChoice() {
  return (
    <div className="flex items-center gap-3">
      <Checkbox id="remember" />
      <Label htmlFor="remember">이 기기 기억하기</Label>
    </div>
  )
}`,
      },
      {
        id: "disabled",
        title: "비활성 레이블",
        description:
          "Field의 data-disabled를 사용하면 컨트롤과 레이블이 같은 비활성 상태로 보입니다.",
        code: String.raw`import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LabelDisabled() {
  return (
    <Field data-disabled>
      <FieldLabel htmlFor="organization">조직</FieldLabel>
      <Input id="organization" disabled value="Luma" readOnly />
    </Field>
  )
}`,
      },
    ],
    usageNotes: [
      "Label은 네이티브 label이므로 asChild나 render prop을 지원하지 않습니다.",
      "설명, 검증, 가로·반응형 배치가 필요한 폼은 Label 단독 구성보다 FieldLabel을 사용하세요.",
    ],
    accessibility: [
      "htmlFor는 연결할 폼 컨트롤의 고유한 id와 정확히 일치해야 합니다.",
      "placeholder나 주변 문장만으로 입력의 이름을 대신하지 말고 항상 보이는 Label 또는 aria-label을 제공하세요.",
      "필수 여부를 색상만으로 표현하지 말고 텍스트와 required 속성을 함께 사용하세요.",
    ],
    props: [
      {
        name: "htmlFor",
        type: "string",
        defaultValue: "—",
        description: "연결할 폼 컨트롤의 id입니다.",
      },
      {
        name: "children",
        type: "React.ReactNode",
        defaultValue: "—",
        description: "컨트롤의 접근 가능한 이름이 될 내용입니다.",
      },
      {
        name: "className",
        type: "string",
        defaultValue: "—",
        description: "기본 레이블 스타일과 병합할 클래스입니다.",
      },
    ],
    related: ["field", "input", "checkbox", "radio-group", "switch"],
  },

  "radio-group": {
    slug: "radio-group",
    summary:
      "Radio Group은 서로 배타적인 선택지 중 정확히 하나를 고르게 합니다. 각 항목의 레이블과 그룹의 범례를 함께 제공하세요.",
    examples: [
      {
        id: "basic",
        title: "기본",
        description: "각 RadioGroupItem에 고유한 value와 id를 주고 레이블을 연결합니다.",
        preview: "default",
        code: String.raw`import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function RadioGroupBasic() {
  return (
    <RadioGroup defaultValue="monthly" name="billing-cycle">
      <div className="flex items-center gap-3">
        <RadioGroupItem id="monthly" value="monthly" />
        <Label htmlFor="monthly">월간 결제</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem id="yearly" value="yearly" />
        <Label htmlFor="yearly">연간 결제</Label>
      </div>
    </RadioGroup>
  )
}`,
      },
      {
        id: "controlled",
        title: "제어 선택",
        description: "value와 onValueChange로 현재 선택을 다른 가격이나 설정 화면과 동기화합니다.",
        code: String.raw`import * as React from "react"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function RadioGroupControlled() {
  const [value, setValue] = React.useState("standard")
  return (
    <div className="grid gap-3">
      <RadioGroup value={value} onValueChange={setValue}>
        {["standard", "express"].map((option) => (
          <div key={option} className="flex items-center gap-3">
            <RadioGroupItem id={option} value={option} />
            <Label htmlFor={option}>{option === "standard" ? "일반 배송" : "빠른 배송"}</Label>
          </div>
        ))}
      </RadioGroup>
      <p className="text-sm text-muted-foreground">선택: {value}</p>
    </div>
  )
}`,
      },
      {
        id: "description",
        title: "설명이 있는 선택지",
        description:
          "FieldContent로 옵션 이름과 차이를 함께 보여 주되 한 항목 전체의 읽기 순서를 유지합니다.",
        code: String.raw`import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function RadioGroupDescription() {
  return (
    <RadioGroup defaultValue="team">
      <Field orientation="horizontal">
        <RadioGroupItem id="team" value="team" />
        <FieldContent>
          <FieldLabel htmlFor="team">팀 요금제</FieldLabel>
          <FieldDescription>최대 10명과 프로젝트를 공유합니다.</FieldDescription>
        </FieldContent>
      </Field>
      <Field orientation="horizontal">
        <RadioGroupItem id="business" value="business" />
        <FieldContent>
          <FieldLabel htmlFor="business">비즈니스 요금제</FieldLabel>
          <FieldDescription>보안 정책과 감사 로그를 포함합니다.</FieldDescription>
        </FieldContent>
      </Field>
    </RadioGroup>
  )
}`,
      },
      {
        id: "choice-card",
        title: "선택 카드",
        description: "FieldLabel로 Field를 감싸 여백이 넉넉한 카드 전체를 선택 영역으로 만듭니다.",
        code: String.raw`import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function RadioGroupChoiceCard() {
  return (
    <RadioGroup defaultValue="seoul" className="grid gap-4 sm:grid-cols-2">
      {["seoul", "busan"].map((city) => (
        <FieldLabel key={city}>
          <Field orientation="horizontal">
            <RadioGroupItem value={city} aria-label={city === "seoul" ? "서울" : "부산"} />
            <FieldContent>
              <FieldTitle>{city === "seoul" ? "서울" : "부산"}</FieldTitle>
              <FieldDescription>다음 영업일에 배송됩니다.</FieldDescription>
            </FieldContent>
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  )
}`,
      },
      {
        id: "states",
        title: "필드셋, 비활성 및 오류",
        description:
          "그룹 질문은 legend로, 상태는 RadioGroup과 실제 항목 및 Field에 함께 전달합니다.",
        code: String.raw`import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function RadioGroupStates() {
  return (
    <FieldSet>
      <FieldLegend>공개 범위</FieldLegend>
      <RadioGroup name="visibility" required>
        <Field orientation="horizontal" data-invalid>
          <RadioGroupItem id="private" value="private" aria-invalid />
          <FieldLabel htmlFor="private">나만 보기</FieldLabel>
        </Field>
        <Field orientation="horizontal" data-disabled>
          <RadioGroupItem id="public" value="public" disabled />
          <FieldLabel htmlFor="public">전체 공개</FieldLabel>
        </Field>
      </RadioGroup>
      <FieldError>사용 가능한 공개 범위를 선택하세요.</FieldError>
    </FieldSet>
  )
}`,
      },
    ],
    usageNotes: [
      "여러 옵션을 동시에 고를 수 있으면 Checkbox를, 옵션이 매우 많고 공간이 좁으면 Select를 사용하세요.",
      "RadioGroup의 value는 선택된 RadioGroupItem의 value와 같은 타입이어야 하며 각 항목의 value는 고유해야 합니다.",
      "한 항목만 비활성화할 때는 Item에, 전체 그룹을 잠글 때는 RadioGroup에 disabled를 설정하세요.",
    ],
    accessibility: [
      "RadioGroup은 FieldSet과 FieldLegend로 그룹 질문을 제공하고 각 Item은 Label 또는 FieldLabel과 연결하세요.",
      "오류 상태는 영향을 받는 RadioGroupItem에 aria-invalid를, 주변 Field에 data-invalid를 설정하세요.",
      "Base UI가 방향키 탐색을 관리하므로 Item 사이의 키보드 포커스 동작을 임의로 덮어쓰지 마세요.",
    ],
    props: [
      {
        name: "RadioGroup.value",
        type: "Value",
        defaultValue: "—",
        description: "제어 방식의 현재 선택값입니다.",
      },
      {
        name: "RadioGroup.defaultValue",
        type: "Value",
        defaultValue: "—",
        description: "비제어 방식의 초기 선택값입니다.",
      },
      {
        name: "RadioGroup.onValueChange",
        type: "(value: Value) => void",
        defaultValue: "—",
        description: "선택이 변경될 때 호출됩니다.",
      },
      {
        name: "RadioGroup.disabled",
        type: "boolean",
        defaultValue: "false",
        description: "그룹의 모든 항목을 비활성화합니다.",
      },
      {
        name: "RadioGroup.required",
        type: "boolean",
        defaultValue: "false",
        description: "폼 제출에 하나의 선택이 필요함을 지정합니다.",
      },
      {
        name: "RadioGroup.name",
        type: "string",
        defaultValue: "—",
        description: "폼 제출 시 사용할 그룹 이름입니다.",
      },
      {
        name: "RadioGroupItem.value",
        type: "Value",
        defaultValue: "필수",
        description: "항목의 고유한 제출 값입니다.",
      },
      {
        name: "RadioGroupItem.disabled",
        type: "boolean",
        defaultValue: "false",
        description: "개별 항목을 비활성화합니다.",
      },
    ],
    related: ["field", "label", "checkbox", "select"],
  },

  select: {
    slug: "select",
    summary:
      "Select는 제한된 목록에서 값을 고르는 팝업 컨트롤입니다. 검색이 필요 없는 짧고 안정적인 선택지에 적합합니다.",
    examples: [
      {
        id: "basic",
        title: "기본",
        description:
          "items를 Root에 전달하면 SelectValue가 선택 항목의 레이블을 안정적으로 표시합니다.",
        preview: "default",
        code: String.raw`import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const themes = [
  { label: "라이트", value: "light" },
  { label: "다크", value: "dark" },
  { label: "시스템", value: "system" },
]

export function SelectBasic() {
  return (
    <Select items={themes} defaultValue="system">
      <SelectTrigger className="w-56"><SelectValue placeholder="테마 선택" /></SelectTrigger>
      <SelectContent>
        <SelectGroup>{themes.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup>
      </SelectContent>
    </Select>
  )
}`,
      },
      {
        id: "sizes-controlled",
        title: "크기와 제어 상태",
        description:
          "Trigger는 default와 sm 크기를 지원하며 value와 onValueChange로 선택을 제어할 수 있습니다.",
        code: String.raw`import * as React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const densities = [
  { label: "편안하게", value: "comfortable" },
  { label: "조밀하게", value: "compact" },
]

export function SelectSizes() {
  const [value, setValue] = React.useState<string | null>("comfortable")
  return (
    <Select items={densities} value={value} onValueChange={setValue}>
      <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start">
        {densities.map((density) => <SelectItem key={density.value} value={density.value}>{density.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}`,
      },
      {
        id: "groups",
        title: "그룹과 구분선",
        description: "긴 목록은 Label과 Separator로 의미 단위를 나눠 탐색 부담을 줄입니다.",
        code: String.raw`import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectSeparator, SelectTrigger, SelectValue,
} from "@/components/ui/select"

export function SelectGroups() {
  return (
    <Select>
      <SelectTrigger className="w-60"><SelectValue placeholder="시간대 선택" /></SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>아시아</SelectLabel>
          <SelectItem value="seoul">서울 (UTC+9)</SelectItem>
          <SelectItem value="tokyo">도쿄 (UTC+9)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>유럽</SelectLabel>
          <SelectItem value="london">런던 (UTC+0)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}`,
      },
      {
        id: "position-scroll",
        title: "팝업 정렬과 긴 목록",
        description:
          "alignItemWithTrigger를 끄면 팝업이 트리거 가장자리에 맞고 긴 항목은 내부에서 스크롤됩니다.",
        code: String.raw`import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const years = Array.from({ length: 30 }, (_, index) => 2026 - index)

export function SelectScrollable() {
  return (
    <Select items={years.map((year) => ({ label: String(year), value: year }))}>
      <SelectTrigger><SelectValue placeholder="연도" /></SelectTrigger>
      <SelectContent side="bottom" align="start" alignItemWithTrigger={false}>
        {years.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}`,
      },
      {
        id: "states",
        title: "비활성 및 오류",
        description:
          "전체 비활성은 Root에, 개별 비활성은 Item에, 오류 표시는 Trigger와 Field에 적용합니다.",
        code: String.raw`import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SelectStates() {
  return (
    <Field data-invalid>
      <FieldLabel>리전</FieldLabel>
      <Select required>
        <SelectTrigger aria-invalid><SelectValue placeholder="리전 선택" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="seoul">서울</SelectItem>
          <SelectItem value="legacy" disabled>레거시 리전</SelectItem>
        </SelectContent>
      </Select>
      <FieldError>사용 가능한 리전을 선택하세요.</FieldError>
    </Field>
  )
}`,
      },
    ],
    usageNotes: [
      "검색할 정도로 선택지가 많거나 사용자가 일부 문자를 알고 있다면 Select 대신 Combobox를 사용하세요.",
      "폼 너비에 맞추려면 SelectTrigger에 w-full을 추가하세요. 기본 Trigger 너비는 콘텐츠에 맞는 w-fit입니다.",
      "객체 값을 사용하면 items와 itemToStringLabel/itemToStringValue를 함께 제공해 표시와 제출 값을 분리하세요.",
    ],
    accessibility: [
      "SelectTrigger에 보이는 SelectValue placeholder를 제공하되 FieldLabel로 필드 이름도 별도로 전달하세요.",
      "오류는 SelectTrigger의 aria-invalid와 Field의 data-invalid를 함께 사용하고 FieldError로 안내하세요.",
      "그룹이 있는 목록은 SelectLabel을 사용하고 Separator만으로 의미 구분을 대신하지 마세요.",
    ],
    props: [
      {
        name: "Select.value",
        type: "Value | Value[] | null",
        defaultValue: "—",
        description: "제어 방식의 선택값입니다.",
      },
      {
        name: "Select.defaultValue",
        type: "Value | Value[] | null",
        defaultValue: "—",
        description: "비제어 방식의 초기 선택값입니다.",
      },
      {
        name: "Select.onValueChange",
        type: "(value) => void",
        defaultValue: "—",
        description: "선택값이 바뀔 때 호출됩니다.",
      },
      {
        name: "Select.open",
        type: "boolean",
        defaultValue: "—",
        description: "제어 방식의 팝업 열림 상태입니다.",
      },
      {
        name: "Select.disabled",
        type: "boolean",
        defaultValue: "false",
        description: "Select 전체를 비활성화합니다.",
      },
      {
        name: "Select.required",
        type: "boolean",
        defaultValue: "false",
        description: "폼 제출에 선택이 필요함을 지정합니다.",
      },
      {
        name: "SelectTrigger.size",
        type: '"sm" | "default"',
        defaultValue: '"default"',
        description: "트리거 높이를 선택합니다.",
      },
      {
        name: "SelectContent.alignItemWithTrigger",
        type: "boolean",
        defaultValue: "true",
        description: "선택 항목을 트리거 위에 맞춰 배치할지 정합니다.",
      },
      {
        name: "SelectContent.align",
        type: "PositionerAlign",
        defaultValue: '"center"',
        description: "팝업의 가로 정렬입니다.",
      },
      {
        name: "SelectItem.disabled",
        type: "boolean",
        defaultValue: "false",
        description: "개별 선택지를 비활성화합니다.",
      },
    ],
    related: ["field", "combobox", "label", "popover"],
  },

  slider: {
    slug: "slider",
    summary:
      "Slider는 연속 범위에서 하나 이상의 수치를 선택합니다. 현재 값과 범위를 텍스트로 함께 보여 주면 조작 결과를 더 쉽게 이해할 수 있습니다.",
    examples: [
      {
        id: "basic",
        title: "단일 값",
        description:
          "현재 구현에서는 thumb 수가 배열 길이로 결정되므로 단일 값도 한 원소 배열로 전달합니다.",
        preview: "default",
        code: String.raw`import { Field, FieldLabel } from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"

export function SliderBasic() {
  return (
    <Field>
      <FieldLabel>볼륨</FieldLabel>
      <Slider name="volume" defaultValue={[40]} max={100} step={1} />
    </Field>
  )
}`,
      },
      {
        id: "controlled",
        title: "제어 값",
        description:
          "드래그 중에는 onValueChange로 화면을 갱신하고 필요한 경우 onValueCommitted에서 저장합니다.",
        code: String.raw`import * as React from "react"
import { Slider } from "@/components/ui/slider"

export function SliderControlled() {
  const [value, setValue] = React.useState([24])
  return (
    <div className="grid gap-3">
      <div className="flex justify-between text-sm"><span>텍스트 크기</span><output>{value[0]}px</output></div>
      <Slider
        value={value}
        onValueChange={(next) => setValue(Array.isArray(next) ? [...next] : [next])}
        min={12}
        max={48}
        step={1}
      />
    </div>
  )
}`,
      },
      {
        id: "range",
        title: "범위 선택",
        description:
          "두 값 배열로 최소와 최대 범위를 선택하고 thumb 사이의 최소 간격을 제한합니다.",
        code: String.raw`import { Slider } from "@/components/ui/slider"

export function SliderRange() {
  return (
    <div className="grid gap-3">
      <span className="text-sm font-medium">가격 범위</span>
      <Slider
        name="price"
        defaultValue={[20, 80]}
        min={0}
        max={100}
        step={5}
        minStepsBetweenValues={2}
      />
    </div>
  )
}`,
      },
      {
        id: "multiple",
        title: "여러 구간점",
        description: "세 개 이상의 배열 값도 각각 하나의 thumb로 렌더링됩니다.",
        code: String.raw`import { Slider } from "@/components/ui/slider"

export function SliderMultiple() {
  return (
    <Slider
      aria-label="색상 중간점"
      defaultValue={[20, 50, 80]}
      min={0}
      max={100}
      step={1}
      thumbCollisionBehavior="none"
    />
  )
}`,
      },
      {
        id: "vertical-states",
        title: "세로 및 비활성",
        description:
          "세로 Slider는 높이가 있는 컨테이너에 두고 disabled 상태도 같은 범위 문맥을 유지합니다.",
        code: String.raw`import { Slider } from "@/components/ui/slider"

export function SliderVerticalStates() {
  return (
    <div className="flex h-48 items-stretch gap-10">
      <Slider orientation="vertical" defaultValue={[65]} aria-label="밝기" />
      <Slider orientation="vertical" defaultValue={[30]} aria-label="잠긴 밝기" disabled />
    </div>
  )
}`,
      },
    ],
    usageNotes: [
      "현재 래퍼는 value 또는 defaultValue 배열의 길이만큼 thumb를 만들므로 단일 값도 [값] 형태를 사용하세요.",
      "정확한 숫자를 직접 입력해야 하거나 범위가 매우 크면 Input과 조합하거나 숫자 입력을 대신 사용하세요.",
      "onValueChange는 드래그 중 자주 호출됩니다. 비용이 큰 저장 작업은 onValueCommitted에서 처리하세요.",
    ],
    accessibility: [
      "Slider 주변에 보이는 레이블과 현재 값을 제공하고 단독 아이콘 문맥에서는 aria-label을 지정하세요.",
      "범위 Slider는 각 thumb가 무엇을 뜻하는지 순서가 명확해야 하며 최소값과 최대값을 화면의 텍스트로도 표시하세요.",
      "키보드 사용자는 방향키, Page Up/Down으로 값을 조절할 수 있으므로 포커스 링을 제거하지 마세요.",
    ],
    props: [
      {
        name: "value",
        type: "number | readonly number[]",
        defaultValue: "—",
        description: "제어 방식의 현재 값입니다. 배열 사용을 권장합니다.",
      },
      {
        name: "defaultValue",
        type: "number | readonly number[]",
        defaultValue: "—",
        description: "비제어 방식의 초기 값입니다. 배열 사용을 권장합니다.",
      },
      { name: "min", type: "number", defaultValue: "0", description: "선택 가능한 최소값입니다." },
      {
        name: "max",
        type: "number",
        defaultValue: "100",
        description: "선택 가능한 최대값입니다.",
      },
      { name: "step", type: "number", defaultValue: "1", description: "값이 이동하는 간격입니다." },
      {
        name: "orientation",
        type: '"horizontal" | "vertical"',
        defaultValue: '"horizontal"',
        description: "Slider의 진행 방향입니다.",
      },
      {
        name: "minStepsBetweenValues",
        type: "number",
        defaultValue: "0",
        description: "인접 thumb 사이의 최소 step 수입니다.",
      },
      {
        name: "thumbCollisionBehavior",
        type: '"push" | "swap" | "none"',
        defaultValue: '"push"',
        description: "thumb가 충돌할 때의 동작입니다.",
      },
      {
        name: "onValueChange",
        type: "(value, details) => void",
        defaultValue: "—",
        description: "값이 변하는 동안 호출됩니다.",
      },
      {
        name: "onValueCommitted",
        type: "(value, details) => void",
        defaultValue: "—",
        description: "사용자의 값 변경이 확정될 때 호출됩니다.",
      },
      {
        name: "disabled",
        type: "boolean",
        defaultValue: "false",
        description: "Slider 상호작용을 비활성화합니다.",
      },
    ],
    related: ["field", "input", "progress"],
  },

  switch: {
    slug: "switch",
    summary:
      "Switch는 즉시 적용되는 설정의 켜짐과 꺼짐을 전환합니다. 현재 상태가 분명한 짧은 레이블과 함께 사용하세요.",
    examples: [
      {
        id: "basic",
        title: "기본",
        description: "id와 레이블을 연결해 스위치뿐 아니라 문구를 눌러도 상태를 바꿀 수 있습니다.",
        preview: "default",
        code: String.raw`import { Field, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"

export function SwitchBasic() {
  return (
    <Field orientation="horizontal">
      <Switch id="airplane-mode" />
      <FieldLabel htmlFor="airplane-mode">비행기 모드</FieldLabel>
    </Field>
  )
}`,
      },
      {
        id: "controlled",
        title: "제어 상태",
        description: "checked와 onCheckedChange로 설정 상태와 화면의 설명을 동기화합니다.",
        code: String.raw`import * as React from "react"
import { Field, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"

export function SwitchControlled() {
  const [enabled, setEnabled] = React.useState(true)
  return (
    <Field orientation="horizontal">
      <Switch id="sync" checked={enabled} onCheckedChange={setEnabled} />
      <FieldLabel htmlFor="sync">자동 동기화 {enabled ? "켜짐" : "꺼짐"}</FieldLabel>
    </Field>
  )
}`,
      },
      {
        id: "description",
        title: "설명이 있는 설정",
        description: "FieldContent에 효과와 범위를 설명해 사용자가 전환 결과를 예측하게 합니다.",
        code: String.raw`import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"

export function SwitchDescription() {
  return (
    <Field orientation="horizontal">
      <Switch id="marketing" />
      <FieldContent>
        <FieldLabel htmlFor="marketing">제품 소식 받기</FieldLabel>
        <FieldDescription>새 기능과 중요 변경 사항을 이메일로 보냅니다.</FieldDescription>
      </FieldContent>
    </Field>
  )
}`,
      },
      {
        id: "choice-card",
        title: "설정 카드",
        description: "FieldLabel로 전체 Field를 감싸 넓고 편안한 선택 영역을 만듭니다.",
        code: String.raw`import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"

export function SwitchChoiceCard() {
  return (
    <FieldLabel>
      <Field orientation="horizontal">
        <Switch aria-label="방해 금지" />
        <FieldContent>
          <FieldTitle>방해 금지</FieldTitle>
          <FieldDescription>다음 한 시간 동안 모든 알림을 잠시 멈춥니다.</FieldDescription>
        </FieldContent>
      </Field>
    </FieldLabel>
  )
}`,
      },
      {
        id: "sizes-states",
        title: "크기, 비활성 및 오류",
        description:
          "기본과 sm 크기를 문맥에 맞게 사용하고 상태는 Field와 컨트롤에 함께 적용합니다.",
        code: String.raw`import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"

export function SwitchSizesStates() {
  return (
    <div className="grid gap-5">
      <Field orientation="horizontal"><Switch id="compact" size="sm" /><FieldLabel htmlFor="compact">조밀한 목록</FieldLabel></Field>
      <Field orientation="horizontal" data-disabled><Switch id="locked-switch" disabled /><FieldLabel htmlFor="locked-switch">관리자 설정</FieldLabel></Field>
      <Field data-invalid>
        <div className="flex items-center gap-3"><Switch id="security" aria-invalid /><FieldLabel htmlFor="security">보안 확인</FieldLabel></div>
        <FieldError>계속하려면 보안 확인을 켜세요.</FieldError>
      </Field>
    </div>
  )
}`,
      },
    ],
    usageNotes: [
      "전환 즉시 설정이 적용될 때 Switch를 사용하고, 제출 시 확정되는 선택은 Checkbox를 사용하세요.",
      "기본 크기는 일반 설정 행에, sm은 정보 밀도가 높은 보조 설정에 제한적으로 사용하세요.",
      "초기 상태만 정하면 defaultChecked, 외부 저장 상태와 동기화하면 checked와 onCheckedChange를 사용하세요.",
    ],
    accessibility: [
      "Switch의 id와 FieldLabel의 htmlFor를 연결하고 상태를 포함해도 의미가 분명한 레이블을 사용하세요.",
      "오류 시 Switch에 aria-invalid, Field에 data-invalid를 설정하고 FieldError로 필요한 조치를 설명하세요.",
      "색상과 thumb 위치만으로 상태를 전달하지 말고 필요한 화면에서는 켜짐·꺼짐 텍스트도 함께 표시하세요.",
    ],
    props: [
      {
        name: "checked",
        type: "boolean",
        defaultValue: "—",
        description: "제어 방식의 켜짐 상태입니다.",
      },
      {
        name: "defaultChecked",
        type: "boolean",
        defaultValue: "false",
        description: "비제어 방식의 초기 상태입니다.",
      },
      {
        name: "onCheckedChange",
        type: "(checked: boolean) => void",
        defaultValue: "—",
        description: "상태가 바뀔 때 호출됩니다.",
      },
      {
        name: "size",
        type: '"sm" | "default"',
        defaultValue: '"default"',
        description: "스위치의 크기입니다.",
      },
      {
        name: "disabled",
        type: "boolean",
        defaultValue: "false",
        description: "상호작용과 포커스를 비활성화합니다.",
      },
      {
        name: "readOnly",
        type: "boolean",
        defaultValue: "false",
        description: "현재 상태를 표시하되 변경을 막습니다.",
      },
      {
        name: "required",
        type: "boolean",
        defaultValue: "false",
        description: "폼 제출에 켜짐 상태가 필요함을 지정합니다.",
      },
      {
        name: "name",
        type: "string",
        defaultValue: "—",
        description: "폼 제출 시 사용할 필드 이름입니다.",
      },
      {
        name: "value",
        type: "string",
        defaultValue: '"on"',
        description: "켜졌을 때 제출할 값입니다.",
      },
    ],
    related: ["field", "label", "checkbox"],
  },

  textarea: {
    slug: "textarea",
    summary:
      "Textarea는 여러 줄의 자유 형식 텍스트를 받습니다. Luma에서는 넉넉한 최소 높이와 자동 콘텐츠 크기를 사용하고 수동 resize는 막습니다.",
    examples: [
      {
        id: "basic",
        title: "기본",
        description: "레이블과 구체적인 placeholder로 사용자가 작성할 내용의 범위를 알려 줍니다.",
        preview: "default",
        code: String.raw`import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

export function TextareaBasic() {
  return (
    <Field>
      <FieldLabel htmlFor="bio">소개</FieldLabel>
      <Textarea id="bio" placeholder="담당 업무와 관심 분야를 소개하세요." />
    </Field>
  )
}`,
      },
      {
        id: "controlled-count",
        title: "글자 수 제한",
        description:
          "제어 상태로 글자 수를 계산하고 maxLength로 브라우저 입력도 같은 범위로 제한합니다.",
        code: String.raw`import * as React from "react"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

export function TextareaCount() {
  const [value, setValue] = React.useState("")
  return (
    <Field>
      <FieldLabel htmlFor="summary">요약</FieldLabel>
      <Textarea id="summary" value={value} maxLength={200} onChange={(event) => setValue(event.target.value)} />
      <FieldDescription className="flex justify-between"><span>핵심만 간결하게 작성하세요.</span><span>{value.length}/200</span></FieldDescription>
    </Field>
  )
}`,
      },
      {
        id: "states",
        title: "비활성 및 오류",
        description: "비활성은 Field에도 전달하고 오류는 aria-describedby로 메시지와 연결합니다.",
        code: String.raw`import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

export function TextareaStates() {
  return (
    <div className="grid gap-6">
      <Field data-disabled><FieldLabel htmlFor="archived">보관된 메모</FieldLabel><Textarea id="archived" disabled value="수정할 수 없습니다." readOnly /></Field>
      <Field data-invalid>
        <FieldLabel htmlFor="reason">변경 사유</FieldLabel>
        <Textarea id="reason" aria-invalid aria-describedby="reason-error" />
        <FieldError id="reason-error">10자 이상 입력하세요.</FieldError>
      </Field>
    </div>
  )
}`,
      },
      {
        id: "button",
        title: "제출 버튼 조합",
        description: "작성과 제출이 한 작업이면 버튼을 Field 안의 다음 포커스 순서에 둡니다.",
        code: String.raw`import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"

export function TextareaButton() {
  return (
    <Field>
      <FieldLabel htmlFor="comment">댓글</FieldLabel>
      <Textarea id="comment" placeholder="의견을 남겨 주세요." />
      <div className="flex items-center justify-between gap-4">
        <FieldDescription>서로를 존중하는 표현을 사용하세요.</FieldDescription>
        <Button type="submit">등록</Button>
      </div>
    </Field>
  )
}`,
      },
      {
        id: "input-group",
        title: "도구 모음 조합",
        description:
          "여러 줄 입력 안에 작업을 넣을 때는 InputGroupTextarea와 block-end Addon을 사용합니다.",
        code: String.raw`import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group"

export function TextareaInputGroup() {
  return (
    <InputGroup>
      <InputGroupTextarea aria-label="프롬프트" placeholder="무엇을 만들까요?" />
      <InputGroupAddon align="block-end">
        <InputGroupText className="mr-auto">Shift + Enter로 줄바꿈</InputGroupText>
        <InputGroupButton variant="default">실행</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}`,
      },
    ],
    usageNotes: [
      "짧고 구조화된 한 줄 값에는 Input을, 문장이나 여러 줄의 자유 형식 내용에는 Textarea를 사용하세요.",
      "Textarea는 field-sizing-content와 resize-none을 사용하므로 사용자가 모서리를 끌어 크기를 바꾸는 UI를 전제로 하지 마세요.",
      "도구 모음, 단위, 제출 버튼을 입력 표면 안에 넣어야 하면 InputGroupTextarea를 사용하세요.",
    ],
    accessibility: [
      "FieldLabel을 연결하고 작성 형식이나 제한은 FieldDescription으로 입력 전에 이해할 수 있게 하세요.",
      "글자 수 제한은 maxLength를 설정하고 현재 글자 수를 텍스트로도 표시하세요.",
      "오류 시 aria-invalid와 aria-describedby를 사용해 Textarea와 FieldError를 연결하세요.",
    ],
    props: [
      {
        name: "value",
        type: "string | readonly string[] | number",
        defaultValue: "—",
        description: "제어 방식의 현재 값입니다.",
      },
      {
        name: "defaultValue",
        type: "string | readonly string[] | number",
        defaultValue: "—",
        description: "비제어 방식의 초기 값입니다.",
      },
      {
        name: "onChange",
        type: "React.ChangeEventHandler<HTMLTextAreaElement>",
        defaultValue: "—",
        description: "내용이 변경될 때 호출됩니다.",
      },
      {
        name: "rows",
        type: "number",
        defaultValue: "—",
        description: "초기 표시 행 수의 힌트입니다.",
      },
      {
        name: "maxLength",
        type: "number",
        defaultValue: "—",
        description: "입력 가능한 최대 문자 수입니다.",
      },
      {
        name: "disabled",
        type: "boolean",
        defaultValue: "false",
        description: "입력과 폼 제출을 비활성화합니다.",
      },
      {
        name: "readOnly",
        type: "boolean",
        defaultValue: "false",
        description: "값은 유지하면서 수정을 막습니다.",
      },
      {
        name: "required",
        type: "boolean",
        defaultValue: "false",
        description: "폼 제출에 내용이 필요함을 지정합니다.",
      },
      {
        name: "aria-invalid",
        type: "boolean | 'grammar' | 'spelling'",
        defaultValue: "false",
        description: "보조 기술에 오류 상태를 전달합니다.",
      },
    ],
    related: ["field", "input", "input-group", "button"],
  },

  calendar: {
    slug: "calendar",
    summary:
      "Calendar는 React DayPicker 위에 Luma의 원형 날짜 셀과 넉넉한 탐색 제어를 입힌 날짜·기간 선택 컴포넌트입니다.",
    examples: [
      {
        id: "basic",
        title: "단일 날짜",
        description: "mode=single에서 selected와 onSelect로 선택 날짜를 제어합니다.",
        preview: "default",
        code: String.raw`import * as React from "react"
import { Calendar } from "@/components/ui/calendar"

export function CalendarBasic() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  return <Calendar mode="single" selected={date} onSelect={setDate} />
}`,
      },
      {
        id: "range",
        title: "기간과 여러 달",
        description:
          "range 모드와 numberOfMonths를 조합해 체크인과 체크아웃 범위를 한 화면에서 선택합니다.",
        code: String.raw`import * as React from "react"
import type { DateRange } from "react-day-picker"
import { Calendar } from "@/components/ui/calendar"

export function CalendarRange() {
  const [range, setRange] = React.useState<DateRange | undefined>()
  return (
    <Calendar
      mode="range"
      selected={range}
      onSelect={setRange}
      numberOfMonths={2}
      pagedNavigation
    />
  )
}`,
      },
      {
        id: "caption-week",
        title: "월·연도 선택과 주 번호",
        description: "긴 날짜 범위를 탐색할 때 dropdown caption과 주 번호를 제공합니다.",
        code: String.raw`import { Calendar } from "@/components/ui/calendar"

export function CalendarCaption() {
  return (
    <Calendar
      mode="single"
      captionLayout="dropdown"
      startMonth={new Date(2020, 0)}
      endMonth={new Date(2030, 11)}
      showWeekNumber
      buttonVariant="outline"
    />
  )
}`,
      },
      {
        id: "disabled-dates",
        title: "예약 불가 날짜",
        description:
          "disabled matcher로 과거, 휴무일, 이미 예약된 날짜를 선택 대상에서 제외합니다.",
        code: String.raw`import { Calendar } from "@/components/ui/calendar"

const booked = [new Date(2026, 7, 12), new Date(2026, 7, 13)]

export function CalendarDisabledDates() {
  return (
    <Calendar
      mode="single"
      disabled={[
        { before: new Date() },
        { dayOfWeek: [0] },
        ...booked,
      ]}
    />
  )
}`,
      },
      {
        id: "date-picker",
        title: "Popover 날짜 선택기",
        description:
          "Calendar를 Popover와 Button에 조합하면 폼 안에서 쓰는 날짜 선택기를 만들 수 있습니다.",
        code: String.raw`import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function CalendarDatePicker() {
  const [date, setDate] = React.useState<Date | undefined>()
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        {date ? date.toLocaleDateString("ko-KR") : "날짜 선택"}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} autoFocus />
      </PopoverContent>
    </Popover>
  )
}`,
      },
      {
        id: "timezone-locale",
        title: "시간대와 로케일",
        description:
          "서버 렌더링 뒤 클라이언트에서 시간대를 감지하고 locale과 함께 전달해 날짜 어긋남을 막습니다.",
        code: String.raw`import * as React from "react"
import { ko } from "react-day-picker/locale"
import { Calendar } from "@/components/ui/calendar"

export function CalendarTimezone() {
  const [date, setDate] = React.useState<Date | undefined>()
  const [timeZone, setTimeZone] = React.useState<string>()

  React.useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  return <Calendar mode="single" selected={date} onSelect={setDate} locale={ko} timeZone={timeZone} />
}`,
      },
    ],
    usageNotes: [
      "단일 날짜는 Date, 기간은 DateRange로 상태 타입을 mode와 일치시키세요.",
      "Calendar는 날짜 선택 UI만 제공합니다. 폼 필드로 사용할 때는 Popover, Button, Field와 조합해 선택 결과와 오류를 표시하세요.",
      "셀 크기는 --cell-size CSS 변수로 조절할 수 있으며 기본값은 36px입니다. 여러 달을 표시할 때는 작은 화면의 가로 폭을 확인하세요.",
      "사용자 로컬 날짜가 하루 어긋나면 클라이언트에서 감지한 timeZone을 전달하고 서버 렌더 시 직접 감지하지 마세요.",
    ],
    accessibility: [
      "React DayPicker의 날짜 버튼과 키보드 탐색을 유지하고 DayButton을 교체할 때 aria 속성을 그대로 전달하세요.",
      "비활성 날짜는 색상뿐 아니라 disabled matcher로 실제 선택도 막고, 예약 불가 이유가 중요하면 Calendar 주변에 설명을 제공하세요.",
      "RTL에서는 dir과 해당 locale을 함께 전달하고 월 이동 아이콘 및 범위 시작·끝 모서리를 실제 화면에서 확인하세요.",
    ],
    props: [
      {
        name: "mode",
        type: '"single" | "multiple" | "range"',
        defaultValue: "—",
        description: "날짜 선택 방식을 지정합니다.",
      },
      {
        name: "selected",
        type: "Date | Date[] | DateRange",
        defaultValue: "—",
        description: "현재 선택된 날짜 또는 범위입니다.",
      },
      {
        name: "onSelect",
        type: "SelectHandler",
        defaultValue: "—",
        description: "선택이 바뀔 때 호출됩니다.",
      },
      {
        name: "showOutsideDays",
        type: "boolean",
        defaultValue: "true",
        description: "현재 달 밖의 날짜를 표시합니다.",
      },
      {
        name: "captionLayout",
        type: '"label" | "dropdown" | "dropdown-months" | "dropdown-years"',
        defaultValue: '"label"',
        description: "월 제목과 선택기의 형태입니다.",
      },
      {
        name: "buttonVariant",
        type: "Button variant",
        defaultValue: '"ghost"',
        description: "이전·다음 달 버튼의 variant입니다.",
      },
      {
        name: "numberOfMonths",
        type: "number",
        defaultValue: "1",
        description: "동시에 표시할 달 수입니다.",
      },
      {
        name: "showWeekNumber",
        type: "boolean",
        defaultValue: "false",
        description: "각 주의 번호 열을 표시합니다.",
      },
      {
        name: "disabled",
        type: "Matcher | Matcher[]",
        defaultValue: "—",
        description: "선택할 수 없는 날짜 규칙입니다.",
      },
      {
        name: "timeZone",
        type: "string",
        defaultValue: "—",
        description: "날짜 계산과 표시에 사용할 IANA 시간대입니다.",
      },
      {
        name: "locale",
        type: "Partial<Locale>",
        defaultValue: "—",
        description: "월·요일과 달력 규칙에 사용할 로케일입니다.",
      },
      {
        name: "classNames",
        type: "Partial<ClassNames>",
        defaultValue: "—",
        description: "DayPicker 내부 슬롯별 클래스를 재정의합니다.",
      },
      {
        name: "components",
        type: "Partial<CustomComponents>",
        defaultValue: "—",
        description: "DayPicker 내부 컴포넌트를 교체합니다.",
      },
    ],
    related: ["popover", "button", "field", "select", "input"],
  },
};
