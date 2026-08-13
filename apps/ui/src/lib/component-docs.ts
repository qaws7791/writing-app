export type PropDoc = {
  name: string;
  type: string;
  defaultValue: string;
  description: string;
};

export type ComponentDoc = {
  slug: string;
  title: string;
  description: string;
  category: string;
};

const definitions = [
  [
    "accordion",
    "Accordion",
    "여러 섹션의 콘텐츠를 접고 펼치는 세로형 인터페이스입니다.",
    "Disclosure",
  ],
  ["alert", "Alert", "중요한 상태나 안내를 사용자의 흐름 안에서 전달합니다.", "Feedback"],
  [
    "alert-dialog",
    "Alert Dialog",
    "확인이 필요한 중요한 작업을 모달 대화상자로 안내합니다.",
    "Overlay",
  ],
  ["aspect-ratio", "Aspect Ratio", "콘텐츠를 지정한 종횡비 안에 안정적으로 배치합니다.", "Layout"],
  ["attachment", "Attachment", "파일의 이름, 상태, 미리보기와 작업을 표시합니다.", "AI & Files"],
  ["avatar", "Avatar", "사용자나 대상을 나타내는 이미지와 대체 표시를 제공합니다.", "Data Display"],
  ["badge", "Badge", "상태나 분류를 짧은 레이블로 강조합니다.", "Data Display"],
  ["breadcrumb", "Breadcrumb", "현재 페이지의 계층과 이동 경로를 보여줍니다.", "Navigation"],
  ["bubble", "Bubble", "대화 메시지나 짧은 콘텐츠를 말풍선 형태로 표시합니다.", "AI & Files"],
  ["button", "Button", "사용자가 작업이나 선택을 실행하도록 합니다.", "Actions"],
  [
    "button-group",
    "Button Group",
    "관련된 버튼과 입력을 하나의 제어 그룹으로 묶습니다.",
    "Actions",
  ],
  [
    "cadence",
    "Cadence",
    "최근 학습 리듬을 주간 이력으로 보여 주며 스트릭 불안 대신 다음 행동을 남깁니다.",
    "Learning",
  ],
  ["calendar", "Calendar", "날짜 또는 날짜 범위를 탐색하고 선택합니다.", "Date & Time"],
  ["card", "Card", "관련된 정보와 작업을 하나의 표면에 그룹화합니다.", "Data Display"],
  [
    "chart",
    "Chart",
    "Recharts를 디자인 토큰과 함께 사용할 수 있는 래퍼입니다.",
    "Data Visualization",
  ],
  ["checkbox", "Checkbox", "하나 이상의 선택 항목을 켜거나 끕니다.", "Forms"],
  ["choice", "Choice", "객관식·선택형 활동에서 선택지와 정오답 상태를 표현합니다.", "Learning"],
  ["classify", "Classify", "항목을 카테고리 바구니에 담는 분류 활동을 구성합니다.", "Learning"],
  ["collapsible", "Collapsible", "하나의 콘텐츠 영역을 접고 펼칩니다.", "Disclosure"],
  ["combobox", "Combobox", "검색 가능한 목록에서 하나 이상의 값을 선택합니다.", "Forms"],
  ["command", "Command", "검색과 키보드 탐색을 지원하는 명령 메뉴입니다.", "Navigation"],
  ["compare", "Compare", "같은 주제의 글 버전을 전환하며 비교하게 합니다.", "Learning"],
  ["compose", "Compose", "쓰기 활동의 프롬프트, 입력, 글자 수 기준을 구성합니다.", "Learning"],
  [
    "course-overview",
    "Course Overview",
    "코스 목표, 대상 수준, 예상 기간, 선수 개념, 글쓰기 장르와 샘플 활동을 보여 줍니다.",
    "Learning",
  ],
  ["dialog", "Dialog", "현재 화면 위에서 집중된 작업이나 정보를 표시합니다.", "Overlay"],
  ["dropdown-menu", "Dropdown Menu", "트리거에 연결된 작업 목록을 표시합니다.", "Overlay"],
  ["empty", "Empty", "데이터가 없거나 시작 작업이 필요한 상태를 안내합니다.", "Feedback"],
  ["field", "Field", "레이블, 설명, 입력, 오류를 접근성 있게 구성합니다.", "Forms"],
  ["goal", "Goal", "오늘이나 이번 주 학습 목표와 남은 작업량을 점수 없이 보여 줍니다.", "Learning"],
  ["input", "Input", "한 줄 텍스트 데이터를 입력받습니다.", "Forms"],
  ["input-group", "Input Group", "입력과 아이콘, 버튼, 접두·접미 요소를 결합합니다.", "Forms"],
  ["input-otp", "Input OTP", "일회용 인증 코드를 칸 단위로 입력받습니다.", "Forms"],
  ["insight", "Insight", "해설, 생각해보기, 정오답 피드백을 조용한 패널로 전달합니다.", "Learning"],
  ["item", "Item", "목록의 미디어, 본문, 메타데이터와 작업을 정렬합니다.", "Data Display"],
  ["kbd", "Kbd", "키보드 키나 단축키를 시각적으로 표현합니다.", "Typography"],
  ["label", "Label", "폼 컨트롤에 접근 가능한 이름을 연결합니다.", "Forms"],
  [
    "learning-profile",
    "Learning Profile",
    "학습 목적, 현재 수준, 관심 장르, 주당 학습 시간과 피드백 선호를 수집합니다.",
    "Learning",
  ],
  ["lesson", "Lesson", "레슨 세션의 진행률, 본문, 하단 행동을 감싸는 프레임입니다.", "Learning"],
  ["marker", "Marker", "콘텐츠 사이의 상태나 구분 정보를 표시합니다.", "AI & Files"],
  [
    "mastery",
    "Mastery",
    "개념 숙련도를 입문·익히는 중·안정·숙련의 이산 단계로 표현합니다.",
    "Learning",
  ],
  ["message", "Message", "아바타, 본문, 머리말과 꼬리말로 대화를 구성합니다.", "AI & Files"],
  [
    "message-scroller",
    "Message Scroller",
    "대화 목록의 자동 스크롤과 위치 이동을 관리합니다.",
    "AI & Files",
  ],
  ["milestone", "Milestone", "희소한 학습 이정표를 날짜와 맥락과 함께 기록합니다.", "Learning"],
  [
    "navigation-menu",
    "Navigation Menu",
    "사이트의 주요 링크와 하위 탐색 콘텐츠를 구성합니다.",
    "Navigation",
  ],
  [
    "next-action",
    "Next Action",
    "다음에 이어갈 활동 하나와 추천 이유, 예상 시간을 제시합니다.",
    "Learning",
  ],
  ["pagination", "Pagination", "여러 페이지로 나뉜 데이터 사이를 이동합니다.", "Navigation"],
  [
    "pair",
    "Pair",
    "왼쪽과 오른쪽 항목을 곡선으로 연결하는 짝 맞추기 활동을 구성합니다.",
    "Learning",
  ],
  ["path", "Path", "코스·유닛·레슨의 학습 경로와 노드 상태를 표시합니다.", "Learning"],
  ["person", "Person", "아바타·이름·보조 설명으로 사람을 한 줄에 표현합니다.", "Data Display"],
  ["popover", "Popover", "트리거 주변에 보조 콘텐츠나 작업을 표시합니다.", "Overlay"],
  ["progress", "Progress", "작업이나 목표의 완료 정도를 나타냅니다.", "Feedback"],
  ["prose", "Prose", "읽기 스텝의 본문, 삽화, 출처를 에디토리얼하게 배치합니다.", "Learning"],
  ["radio-group", "Radio Group", "서로 배타적인 여러 옵션 중 하나를 선택합니다.", "Forms"],
  ["scroll-area", "Scroll Area", "일관된 스크롤바를 가진 제한 영역을 제공합니다.", "Layout"],
  ["segment", "Segment", "문장이나 단락의 구간을 선택 가능한 조각으로 제공합니다.", "Learning"],
  ["select", "Select", "목록에서 하나의 값을 선택하는 팝업 컨트롤입니다.", "Forms"],
  ["separator", "Separator", "콘텐츠 그룹 사이의 시각적 또는 의미적 경계를 표시합니다.", "Layout"],
  ["sheet", "Sheet", "화면 가장자리 또는 중앙에서 열리는 보조 대화상자입니다.", "Overlay"],
  [
    "sidebar",
    "Sidebar",
    "앱 탐색을 위한 상태 기반 사이드바로, 검색·그룹·하위 메뉴·상태와 푸터 카드를 조용한 표면 위에 조합합니다.",
    "Navigation",
  ],
  ["skeleton", "Skeleton", "콘텐츠가 준비되는 동안 자리 표시자를 보여줍니다.", "Feedback"],
  ["slider", "Slider", "범위 안에서 하나 이상의 숫자 값을 선택합니다.", "Forms"],
  ["sortable", "Sortable", "항목을 오른쪽 핸들로 드래그해 재정렬하는 목록입니다.", "Learning"],
  ["spinner", "Spinner", "진행 중인 비동기 작업을 회전 표시로 알립니다.", "Feedback"],
  ["standing", "Standing", "코호트 안에서의 상대 위치를 조용히 보여 줍니다.", "Learning"],
  ["step", "Step", "레슨 안 활동 단위의 제목, 안내, 본문, 행동을 구성합니다.", "Learning"],
  ["switch", "Switch", "설정이나 기능의 켜짐·꺼짐 상태를 전환합니다.", "Forms"],
  ["table", "Table", "행과 열로 구성된 구조적 데이터를 표시합니다.", "Data Display"],
  ["tabs", "Tabs", "관련된 콘텐츠 패널을 동일한 공간에서 전환합니다.", "Navigation"],
  ["textarea", "Textarea", "여러 줄의 텍스트 데이터를 입력받습니다.", "Forms"],
  ["toast", "Toast", "작업 결과를 방해가 적은 일시 알림으로 전달합니다.", "Feedback"],
  ["token", "Token", "빈칸 채우기용 단어 칩과 슬롯을 구성합니다.", "Learning"],
  ["toggle", "Toggle", "눌림 상태를 가지는 두 상태 버튼입니다.", "Actions"],
  [
    "toggle-group",
    "Toggle Group",
    "관련된 토글을 단일 또는 다중 선택 그룹으로 묶습니다.",
    "Actions",
  ],
  ["tooltip", "Tooltip", "요소에 대한 짧은 보조 설명을 포인터나 포커스로 표시합니다.", "Overlay"],
  ["verdict", "Verdict", "참·거짓 판정에서 본문 아래 1행 2열로 O·X 버튼을 표시합니다.", "Learning"],

  ["admin-overview", "Admin Overview", "조치가 필요한 운영 항목을 우선 보여 줍니다.", "Admin"],
  [
    "argument-map",
    "Argument Map",
    "주장·근거·반론·재반박 관계를 시각적으로 점검합니다.",
    "Learning",
  ],
  ["audit-log", "Audit Log", "콘텐츠·루브릭·권한 변경과 환경·복원 지점을 보여 줍니다.", "Admin"],
  [
    "checkpoint",
    "Checkpoint",
    "여러 레슨을 종합 평가하고 다음 유닛 준비 여부를 보여 줍니다.",
    "Learning",
  ],
  ["cohort-assignment", "Cohort Assignment", "코호트·과제 배정·기한·예외를 관리합니다.", "Admin"],
  [
    "content-review",
    "Content Review",
    "변경 diff·댓글·담당자·승인·수정 요청을 처리합니다.",
    "Admin",
  ],
  [
    "content-validation",
    "Content Validation",
    "빈 정답·중복 ID·모호한 선택지·접근성·출처·목표 연결을 검사합니다.",
    "Admin",
  ],
  [
    "curriculum-map",
    "Curriculum Map",
    "목표·개념·선수·레슨·체크포인트 연결과 누락을 보여 줍니다.",
    "Admin",
  ],
  [
    "curriculum-tree",
    "Curriculum Tree",
    "코스→유닛→레슨→스텝 구조와 상태·선후를 관리합니다.",
    "Admin",
  ],
  [
    "draft",
    "Draft",
    "장문 편집기의 자동 저장·글자 수·오프라인·버전·제출 가능 상태를 관리합니다.",
    "Learning",
  ],
  [
    "exemplar-library",
    "Exemplar Library",
    "좋은 예·경계 사례·반례를 루브릭 annotation과 함께 관리합니다.",
    "Admin",
  ],
  [
    "feedback-audit",
    "Feedback Audit",
    "AI·교사 피드백 표본을 정확성·근거·어조·범위·효과로 검수합니다.",
    "Admin",
  ],
  [
    "feedback-summary",
    "Feedback Summary",
    "첨삭을 우선순위·적용 범위별로 묶고 이번 수정의 할 일을 제시합니다.",
    "Learning",
  ],
  [
    "hint-ladder",
    "Hint Ladder",
    "관찰 질문→방향 제시→부분 예시 순으로 힌트를 공개합니다.",
    "Learning",
  ],
  [
    "intervention-queue",
    "Intervention Queue",
    "반복 오답·미접속·제출 지연 근거로 지원 대상을 정렬합니다.",
    "Admin",
  ],
  [
    "item-analysis",
    "Item Analysis",
    "정답률·오답 분포·힌트·재시도·이탈로 문제 문항을 찾습니다.",
    "Admin",
  ],
  [
    "item-bank",
    "Item Bank",
    "문항·예문·해설·힌트를 개념·난이도·장르·상태별로 재사용합니다.",
    "Admin",
  ],
  [
    "learner-preview",
    "Learner Preview",
    "기기·숙련도·정오답·오프라인 상태로 학습 흐름을 재생합니다.",
    "Admin",
  ],
  [
    "learner-record",
    "Learner Record",
    "경로·숙련도·시도·제출물·지원 이력을 한 문맥에서 보여 줍니다.",
    "Admin",
  ],
  [
    "learning-analytics",
    "Learning Analytics",
    "시작→완료·중단·복습 복귀·목표별 숙련 변화를 분석합니다.",
    "Admin",
  ],
  [
    "lesson-builder",
    "Lesson Builder",
    "스텝 팔레트·순서·속성 검사기와 레슨 메타데이터를 결합합니다.",
    "Admin",
  ],
  [
    "mistake-journal",
    "Mistake Journal",
    "오답을 오류 패턴별로 묶어 재도전하게 합니다.",
    "Learning",
  ],
  ["outline", "Outline", "서론·본론·결론과 주장·근거·예시 블록을 만들고 재정렬합니다.", "Learning"],
  ["portfolio", "Portfolio", "완성한 글·수정 과정·피드백·공개 범위를 관리합니다.", "Learning"],
  [
    "practice-queue",
    "Practice Queue",
    "복습 시점·오답·취약 개념으로 연습 세트를 정렬하고 추천 이유를 설명합니다.",
    "Learning",
  ],
  [
    "prompt-builder",
    "Prompt Builder",
    "독자·목적·장르·분량·자료·제한을 포함한 글쓰기 과제를 제작합니다.",
    "Admin",
  ],
  [
    "provenance-panel",
    "Provenance Panel",
    "사람·AI·외부 출처와 생성 모델·확인 상태를 기록합니다.",
    "Admin",
  ],
  [
    "publish-workflow",
    "Publish Workflow",
    "draft부터 rolled-back까지 게시 상태와 preview·live 환경을 관리합니다.",
    "Admin",
  ],
  ["reflection", "Reflection", "바꾼 점·어려운 점·다음 연습 목표를 짧게 기록합니다.", "Learning"],
  [
    "revision-history",
    "Revision History",
    "초고·수정본·최종본을 시간순으로 보존하고 비교·복원합니다.",
    "Learning",
  ],
  [
    "run-queue",
    "Run Queue",
    "에이전트 실행을 상태 그룹·환경·진행률·결과로 읽어 모니터링합니다.",
    "Admin",
  ],
  ["rubric", "Rubric", "평가 기준·단계·가중치·판정과 근거를 보여 줍니다.", "Learning"],
  [
    "rubric-editor",
    "Rubric Editor",
    "평가 항목·단계·가중치·예시와 적용 버전을 편집합니다.",
    "Admin",
  ],
  ["skill-map", "Skill Map", "영역별 숙련도·선수 관계·다음 연습 초점을 보여 줍니다.", "Learning"],
  [
    "source-pack",
    "Source Pack",
    "읽기 자료·통계·발췌문·외부 출처를 메모·인용 가능한 형태로 제공합니다.",
    "Learning",
  ],
  [
    "step-trace",
    "Step Trace",
    "에이전트 실행의 단계·도구 호출·오류를 읽기 전용 타임라인으로 보여 줍니다.",
    "Admin",
  ],
  ["submission", "Submission", "초안부터 평가 완료까지 제출 상태와 기한을 관리합니다.", "Learning"],
  [
    "text-annotation",
    "Text Annotation",
    "원문 범위에 피드백을 연결하고 수락·거절·해결합니다.",
    "Learning",
  ],
  [
    "writing-analytics",
    "Writing Analytics",
    "루브릭 변화·수정 깊이·피드백 수용률·장르 난도를 집계합니다.",
    "Admin",
  ],
  [
    "writing-brief",
    "Writing Brief",
    "주제·독자·목적·장르·분량·평가 기준·제출 조건을 한곳에 정리합니다.",
    "Learning",
  ],
] as const;

export const componentDocs: ComponentDoc[] = definitions.map(
  ([slug, title, description, category]) => ({ slug, title, description, category }),
);

export const componentDocsBySlug = new Map(componentDocs.map((doc) => [doc.slug, doc]));

const commonProps: PropDoc[] = [
  {
    name: "className",
    type: "string",
    defaultValue: "—",
    description: "컴포넌트의 기본 스타일과 병합할 추가 클래스입니다.",
  },
  {
    name: "children",
    type: "React.ReactNode",
    defaultValue: "—",
    description: "컴포넌트 안에 렌더링할 콘텐츠입니다.",
  },
];

const controlledProps: PropDoc[] = [
  {
    name: "value",
    type: "string | string[]",
    defaultValue: "—",
    description: "제어 방식으로 사용할 현재 값입니다.",
  },
  {
    name: "defaultValue",
    type: "string | string[]",
    defaultValue: "—",
    description: "비제어 방식의 초기 값입니다.",
  },
  {
    name: "onValueChange",
    type: "(value) => void",
    defaultValue: "—",
    description: "값이 변경될 때 호출됩니다.",
  },
];

const overlayProps: PropDoc[] = [
  {
    name: "open",
    type: "boolean",
    defaultValue: "—",
    description: "오버레이의 열림 상태를 제어합니다.",
  },
  {
    name: "defaultOpen",
    type: "boolean",
    defaultValue: "false",
    description: "비제어 방식의 초기 열림 상태입니다.",
  },
  {
    name: "onOpenChange",
    type: "(open: boolean) => void",
    defaultValue: "—",
    description: "열림 상태가 변경될 때 호출됩니다.",
  },
];

const variantProps: PropDoc[] = [
  {
    name: "variant",
    type: "string",
    defaultValue: '"default"',
    description: "컴포넌트의 시각적 표현을 선택합니다.",
  },
  {
    name: "size",
    type: "string",
    defaultValue: '"default"',
    description: "컴포넌트의 크기와 밀도를 선택합니다.",
  },
];

const disabledProp: PropDoc = {
  name: "disabled",
  type: "boolean",
  defaultValue: "false",
  description: "상호작용과 포커스를 비활성화합니다.",
};

const overlayComponents = new Set([
  "alert-dialog",
  "dialog",
  "dropdown-menu",
  "popover",
  "select",
  "sheet",
  "tooltip",
]);

const controlledComponents = new Set([
  "accordion",
  "checkbox",
  "collapsible",
  "combobox",
  "input-otp",
  "progress",
  "radio-group",
  "slider",
  "switch",
  "tabs",
  "toggle",
  "toggle-group",
]);

const variantComponents = new Set([
  "alert",
  "attachment",
  "badge",
  "bubble",
  "button",
  "button-group",
  "empty",
  "item",
  "marker",
  "toggle",
  "toggle-group",
]);

export function getPropDocs(slug: string): PropDoc[] {
  const props = [...commonProps];
  if (overlayComponents.has(slug)) props.push(...overlayProps);
  if (controlledComponents.has(slug)) props.push(...controlledProps, disabledProp);
  if (variantComponents.has(slug)) props.push(...variantProps);

  if (["input", "textarea"].includes(slug)) {
    props.push(
      {
        name: "value",
        type: "string | number",
        defaultValue: "—",
        description: "현재 입력 값을 제어합니다.",
      },
      disabledProp,
    );
  }

  return props;
}

export function isLearningComponent(slug: string) {
  return learningComponents.has(slug);
}

export function getComponentGroup(slug: string): "primitives" | "learning" {
  return learningComponents.has(slug) ? "learning" : "primitives";
}

export function getInstallCommand(slug: string) {
  return `import { … } from "@workspace/ui/components/${getComponentGroup(slug)}/${slug}"`;
}

export function getBlockImportCommand(slug: string) {
  return `import { … } from "@workspace/ui/blocks/${slug}"`;
}

const apiOverrides: Record<string, string> = {
  calendar: "https://react-day-picker.js.org",
  command: "https://github.com/dip/cmdk",
  "dropdown-menu": "https://base-ui.com/react/components/menu.md",
  "input-otp": "https://input-otp.rodz.dev",
  sheet: "https://base-ui.com/react/components/dialog.md",
};

const baseUiApis = new Set([
  "accordion",
  "alert-dialog",
  "avatar",
  "checkbox",
  "collapsible",
  "combobox",
  "dialog",
  "label",
  "navigation-menu",
  "popover",
  "progress",
  "radio-group",
  "scroll-area",
  "select",
  "separator",
  "slider",
  "switch",
  "tabs",
  "toast",
  "toggle",
  "toggle-group",
  "tooltip",
]);

export function getApiReference(slug: string) {
  return (
    apiOverrides[slug] ??
    (baseUiApis.has(slug) ? `https://base-ui.com/react/components/${slug}.md` : undefined)
  );
}

const learningComponents = new Set([
  "cadence",
  "choice",
  "classify",
  "compare",
  "compose",
  "course-overview",
  "goal",
  "insight",
  "learning-profile",
  "lesson",
  "mastery",
  "milestone",
  "next-action",
  "pair",
  "path",
  "person",
  "prose",
  "segment",
  "sortable",
  "standing",
  "step",
  "token",
  "verdict",

  "admin-overview",
  "argument-map",
  "audit-log",
  "checkpoint",
  "cohort-assignment",
  "content-review",
  "content-validation",
  "curriculum-map",
  "curriculum-tree",
  "draft",
  "exemplar-library",
  "feedback-audit",
  "feedback-summary",
  "hint-ladder",
  "intervention-queue",
  "item-analysis",
  "item-bank",
  "learner-preview",
  "learner-record",
  "learning-analytics",
  "lesson-builder",
  "mistake-journal",
  "outline",
  "portfolio",
  "practice-queue",
  "prompt-builder",
  "provenance-panel",
  "publish-workflow",
  "reflection",
  "revision-history",
  "rubric",
  "rubric-editor",
  "run-queue",
  "skill-map",
  "source-pack",
  "step-trace",
  "submission",
  "text-annotation",
  "writing-analytics",
  "writing-brief",
]);

export function getOfficialDocs(slug: string) {
  if (learningComponents.has(slug)) return undefined;
  return `https://ui.shadcn.com/docs/components/base/${slug}`;
}
