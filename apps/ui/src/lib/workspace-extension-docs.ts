type ExtensionProp = {
  name: string;
  type: string;
  description: string;
};

export type WorkspaceExtensionDoc = {
  slug: string;
  title: string;
  moduleTitle: string;
  description: string;
  importPath: string;
  props: ExtensionProp[];
  usageNotes: string[];
  accessibility: string[];
};

const checked: ExtensionProp = {
  name: "checked",
  type: "false | correct | wrong",
  description: "채점 전, 정답, 오답의 표시 상태입니다.",
};

const onChange = (description: string): ExtensionProp => ({
  name: "onChange",
  type: "(value) => void",
  description,
});

export const workspaceExtensionDocs: WorkspaceExtensionDoc[] = [
  {
    slug: "theme-selector",
    title: "Theme Selector",
    moduleTitle: "Components/UI/ThemeSelector",
    description: "제품 앱의 light, dark, system 테마 선택 상태를 표시하고 변경합니다.",
    importPath: "@workspace/ui/components/primitives/theme-selector",
    props: [
      {
        name: "activeTheme",
        type: "light | dark | system",
        description: "현재 선택된 테마입니다.",
      },
      { name: "disabled", type: "boolean", description: "테마 변경을 잠급니다." },
      {
        name: "onThemeChange",
        type: "(theme: ThemeValue) => void",
        description: "사용자가 테마를 선택할 때 호출됩니다.",
      },
    ],
    usageNotes: [
      "테마 저장과 document class 변경은 제품 앱이 소유합니다.",
      "Disabled 상태는 선택값을 유지하며 모든 선택 동작을 막습니다.",
    ],
    accessibility: [
      "각 옵션은 현재 선택 상태를 접근성 API에 노출해야 합니다.",
      "키보드만으로 세 옵션 사이를 이동하고 선택할 수 있어야 합니다.",
    ],
  },
  {
    slug: "categorize-answer",
    title: "Categorize Answer",
    moduleTitle: "Components/Lesson/CategorizeAnswer",
    description: "Stable ID를 가진 항목을 카테고리에 배치하고 채점 결과를 표시합니다.",
    importPath: "@workspace/ui/components/learning/categorize-answer",
    props: [
      { name: "title", type: "string", description: "분류 단계 제목입니다." },
      { name: "categories", type: "Category[]", description: "분류 카테고리 목록입니다." },
      { name: "items", type: "CategorizeItem[]", description: "분류할 항목 목록입니다." },
      { name: "explanation", type: "string", description: "채점 뒤 표시할 해설입니다." },
      checked,
      onChange("항목 분류가 바뀔 때 호출됩니다."),
    ],
    usageNotes: [
      "Category와 item ID는 session 전체에서 안정적으로 유지합니다.",
      "320 CSS px에서도 긴 바구니 이름과 item 본문을 잘라내지 않습니다.",
    ],
    accessibility: [
      "분류 결과를 색상만으로 구분하지 않습니다.",
      "Pointer 없이 항목을 선택하고 바구니에 담을 수 있어야 합니다.",
    ],
  },
  {
    slug: "compare-step-view",
    title: "Compare Step View",
    moduleTitle: "Components/Lesson/CompareStepView",
    description: "둘 이상의 글 version을 tab으로 전환하고 비교 분석을 제시합니다.",
    importPath: "@workspace/ui/components/learning/compare-step-view",
    props: [
      { name: "title", type: "string", description: "비교 단계 제목입니다." },
      { name: "versions", type: "Version[]", description: "Tab으로 전환할 version 목록입니다." },
      { name: "analysis", type: "string", description: "비교 뒤 생각해 볼 내용입니다." },
    ],
    usageNotes: [
      "각 version label은 짧고 서로 구분되게 작성합니다.",
      "분석은 정답 판정이 아니라 관찰 방향을 제공합니다.",
    ],
    accessibility: [
      "Tab과 panel의 관계를 semantic으로 연결합니다.",
      "Arrow key로 tab 사이를 이동할 수 있어야 합니다.",
    ],
  },
  {
    slug: "fill-blank-answer",
    title: "Fill Blank Answer",
    moduleTitle: "Components/Lesson/FillBlankAnswer",
    description: "문장 template의 빈칸에 stable ID를 가진 단어를 배치합니다.",
    importPath: "@workspace/ui/components/learning/fill-blank-answer",
    props: [
      { name: "template", type: "string", description: "빈칸을 ___로 표시한 문장 template입니다." },
      {
        name: "choices",
        type: "Choice[]",
        description: "Stable ID를 가진 선택 가능한 단어입니다.",
      },
      { name: "blankCount", type: "number", description: "1개 이상 5개 이하의 빈칸 수입니다." },
      checked,
      onChange("빈칸 선택이 바뀔 때 호출됩니다."),
    ],
    usageNotes: [
      "Template의 ___ 수와 blankCount를 일치시킵니다.",
      "Choice ID를 표시 순서로 사용하지 않습니다.",
    ],
    accessibility: [
      "빈칸의 현재 값과 순서를 text로 읽을 수 있어야 합니다.",
      "선택과 해제를 keyboard로 완료할 수 있어야 합니다.",
    ],
  },
  {
    slug: "match-answer",
    title: "Match Answer",
    moduleTitle: "Components/Lesson/MatchAnswer",
    description: "왼쪽과 오른쪽 선택지를 연결하고 대기, 연결, 정답과 오답 상태를 표시합니다.",
    importPath: "@workspace/ui/components/learning/match-answer",
    props: [
      { name: "title", type: "string", description: "매칭 단계 제목입니다." },
      { name: "leftChoices", type: "MatchChoice[]", description: "왼쪽 선택지입니다." },
      { name: "rightChoices", type: "MatchChoice[]", description: "오른쪽 선택지입니다." },
      { name: "connections", type: "MatchConnection[]", description: "현재 연결과 tone입니다." },
      {
        name: "pendingChoice",
        type: "PendingChoice | null",
        description: "다음 짝을 기다리는 선택지입니다.",
      },
      { name: "explanation", type: "string", description: "채점 뒤 표시할 해설입니다." },
      checked,
      {
        name: "onChoiceSelect",
        type: "(choice) => void",
        description: "양쪽 선택지를 누를 때 호출됩니다.",
      },
    ],
    usageNotes: [
      "Connection은 양쪽 stable ID로 저장합니다.",
      "선의 위치는 관계를 보조하며 유일한 정보가 아닙니다.",
    ],
    accessibility: [
      "선택 대기와 연결 결과를 text로 알립니다.",
      "각 선택지의 side와 연결 상태를 접근성 이름에 포함합니다.",
    ],
  },
  {
    slug: "multiple-choice-answer",
    title: "Multiple Choice Answer",
    moduleTitle: "Components/Lesson/MultipleChoiceAnswer",
    description: "여러 선택지 중 하나를 고르고 정답·오답 상태를 표시합니다.",
    importPath: "@workspace/ui/components/learning/multiple-choice-answer",
    props: [
      { name: "question", type: "string", description: "객관식 질문입니다." },
      { name: "options", type: "Option[]", description: "선택지 목록입니다." },
      { name: "correctOptionId", type: "string", description: "정답 선택지 ID입니다." },
      checked,
      {
        name: "onSelect",
        type: "(id: string) => void",
        description: "선택지를 누를 때 호출됩니다.",
      },
    ],
    usageNotes: [
      "선택지 ID는 문구가 바뀌어도 유지합니다.",
      "채점 전에는 correctOptionId를 시각적으로 노출하지 않습니다.",
    ],
    accessibility: [
      "질문과 선택지 group을 연결합니다.",
      "선택과 채점 결과를 색상 외 text나 icon으로 표시합니다.",
    ],
  },
  {
    slug: "order-answer",
    title: "Order Answer",
    moduleTitle: "Components/Lesson/OrderAnswer",
    description: "Stable ID를 가진 항목을 순서대로 재배치하고 채점 결과를 표시합니다.",
    importPath: "@workspace/ui/components/learning/order-answer",
    props: [
      { name: "items", type: "OrderItem[]", description: "정렬할 항목입니다." },
      {
        name: "correctItemIds",
        type: "string[]",
        description: "Stable ID 기준의 정답 순서입니다.",
      },
      { name: "explanation", type: "string", description: "채점 뒤 표시할 해설입니다." },
      checked,
      onChange("순서가 바뀔 때 호출됩니다."),
    ],
    usageNotes: [
      "표시 배열의 index를 item ID로 사용하지 않습니다.",
      "항목 앞에 순번을 표시하지 않습니다.",
    ],
    accessibility: [
      "Drag 외에 keyboard 재정렬 수단을 제공합니다.",
      "이동 뒤 새 위치를 live region으로 알립니다.",
    ],
  },
  {
    slug: "reading-step-view",
    title: "Reading Step View",
    moduleTitle: "Components/Lesson/ReadingStepView",
    description: "Markdown 본문과 선택적 출처를 읽기 좋은 폭으로 표시합니다.",
    importPath: "@workspace/ui/components/learning/reading-step-view",
    props: [
      { name: "title", type: "string", description: "읽기 단계 제목입니다." },
      { name: "body", type: "string", description: "본문 Markdown입니다." },
      { name: "source", type: "string | undefined", description: "비어 있으면 숨기는 출처입니다." },
    ],
    usageNotes: [
      "긴 본문은 명확한 heading과 list로 나눕니다.",
      "출처가 없는 경우 빈 영역을 렌더링하지 않습니다.",
    ],
    accessibility: [
      "Markdown heading 순서를 건너뛰지 않습니다.",
      "인용문과 list의 semantic을 유지합니다.",
    ],
  },
  {
    slug: "select-answer",
    title: "Select Answer",
    moduleTitle: "Components/Lesson/SelectAnswer",
    description: "문장 안의 하나 이상 text segment를 선택하고 채점 결과를 표시합니다.",
    importPath: "@workspace/ui/components/learning/select-answer",
    props: [
      { name: "question", type: "string", description: "구간 선택 질문입니다." },
      { name: "segments", type: "string[]", description: "선택 가능한 text segment입니다." },
      { name: "correctIndexes", type: "number[]", description: "정답 segment index입니다." },
      {
        name: "layout",
        type: "block | undefined",
        description: "Block이면 세로 layout을 사용합니다.",
      },
      { name: "explanation", type: "string", description: "채점 뒤 표시할 해설입니다." },
      checked,
      onChange("구간 선택이 바뀔 때 호출됩니다."),
    ],
    usageNotes: [
      "Segment 배열은 원문을 정확히 재구성해야 합니다.",
      "Block layout은 긴 segment나 작은 viewport에 사용합니다.",
    ],
    accessibility: [
      "각 segment를 독립 button으로 조작할 수 있어야 합니다.",
      "선택과 채점 상태를 aria-pressed와 text로 알립니다.",
    ],
  },
];

export const workspaceExtensionDocsBySlug = new Map(
  workspaceExtensionDocs.map((doc) => [doc.slug, doc]),
);
