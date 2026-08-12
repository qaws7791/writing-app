# Luma Component Contract

이 문서는 registry 컴포넌트, 조합 블록과 컴포넌트 preview를 설계하거나 변경할 때 `DESIGN.md`와 함께 읽는 구현 계약이다. 학습 컴포넌트에는 `design/LEARNING.md`, AI·권한·고위험 행동에는 `design/AI_AND_RISK.md`를 추가로 적용한다.

## 1. Layers & Materials

| Layer    | Role                                 | Rules                                                            |
| -------- | ------------------------------------ | ---------------------------------------------------------------- |
| Canvas   | 페이지와 콘텐츠가 직접 놓이는 기본층 | 불투명하고 안정적이며 큰 그림자나 블러를 쓰지 않는다.            |
| Surface  | 문서, 폼, 표, 카드 같은 콘텐츠층     | 배경 농도, 미세한 경계와 여백 중 필요한 수단만 사용한다.         |
| Floating | 메뉴, 툴바, 명령 패널과 팝오버       | 콘텐츠층과 분리하되 가독성을 우선하고 일시적으로만 떠 있게 한다. |
| Modal    | 작업을 중단시키는 최상위 작업층      | 중요한 결정, 집중 편집과 되돌리기 어려운 행동에만 사용한다.      |

- Surface 강도는 `plain`, `muted`, `frame`, `surface` 중 콘텐츠 관계에 맞게 고른다.
- 긴 읽기, 조밀한 데이터, 폼 본문과 테이블에 glass를 사용하지 않는다.
- Glass는 내비게이션과 일시적 컨트롤에 제한하고 glass-on-glass 중첩을 만들지 않는다.
- Floating과 Modal은 투명도나 blur 없이도 경계, 텍스트와 상태가 읽히는 불투명 fallback을 제공한다.
- 같은 화면의 elevation은 가능한 세 단계 이하로 유지한다.

## 2. Foundations

### Typography

Pretendard Variable과 시스템 폰트 스택을 기본으로 사용한다. 한국어와 라틴 문자가 자연스럽게 섞여야 하며 특정 영문 서체의 인상에 정체성을 의존하지 않는다.

| Role     | Size / line height | Weight  | Use                    |
| -------- | ------------------ | ------- | ---------------------- |
| Display  | 40 / 48            | 600–700 | 짧은 제품·페이지 표제  |
| Heading  | 32 / 40            | 600–700 | 주요 섹션 제목         |
| Title    | 24 / 32            | 600     | 화면·패널 제목         |
| Subtitle | 18 / 28            | 500–600 | 콘텐츠 그룹 제목       |
| Body     | 16 / 26            | 400–500 | 읽기와 설명            |
| Label    | 14 / 20            | 500–600 | 컨트롤과 행 제목       |
| Meta     | 12 / 18            | 500     | 날짜, 상태와 보조 정보 |

- 본문은 일반적으로 45–75자 폭을 유지한다.
- 한국어 본문에 과도한 음수 자간을 쓰지 않는다.
- 긴 본문은 `text-wrap: pretty`, 큰 제목은 `text-wrap: balance`를 선택적으로 사용한다.
- 표, 시간, 카운터와 정렬되는 숫자에는 tabular numerals를 사용한다.
- 크기만으로 위계를 만들지 않고 weight, 농도와 공간을 함께 조절한다.

### Spacing & density

기본 간격은 `4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64px` scale을 사용한다. 제목과 첫 콘텐츠는 가깝게, 서로 다른 섹션은 내부 요소보다 확실히 넓게 둔다. 빈 공간을 배지나 장식으로 채우지 않는다.

필요한 경우 `compact`, `default`, `comfortable` 밀도를 제공한다. 밀도는 글자 크기보다 행 높이, gap과 padding으로 조절하며 compact에서도 포인터 target과 focus 가시성을 보존한다.

### Shape & geometry

| Token        | Value | Typical use                |
| ------------ | ----- | -------------------------- |
| `radius-sm`  | 6px   | 작은 내부 요소와 체크 표시 |
| `radius-md`  | 8px   | 조밀한 행과 작은 입력      |
| `radius-lg`  | 10px  | 기본 컨트롤                |
| `radius-xl`  | 14px  | 메뉴와 작은 표면           |
| `radius-2xl` | 18px  | 패널과 미디어              |
| `radius-3xl` | 22px  | 큰 표면                    |
| `radius-4xl` | 26px  | 카드와 모달                |
| `radius-5xl` | 32px  | 큰 에디토리얼 표면         |

- 버튼, 토글, 탭과 입력은 중간 라운드를 기본으로 한다.
- Pill은 배지, 칩, 태그, 세그먼트와 작은 하드웨어형 요소에 제한한다.
- 중첩된 모서리는 바깥 반경과 padding을 고려해 동심성을 유지한다.
- 입력, 테이블, 카드, 이미지와 모달에 같은 radius를 일괄 적용하지 않는다.

### Color, border & icon

- 완전한 흰색과 검정색 대신 따뜻한 paper-and-ink 뉴트럴을 사용한다.
- 색상은 OKLCH로 관리하며 `background`, `foreground`, `card`, `popover`, `surface`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning`, `info`, `purple`, `border`, `input`, `ring`, `selection` semantic을 유지한다.
- 강조색은 primary 행동이나 기능적으로 특별한 상태에 제한한다.
- 성공, 경고, 오류와 정보는 색만으로 구분하지 않는다.
- dark theme은 light theme의 단순 반전이 아니며 표면과 elevation을 따로 조정한다.
- 경계는 관계를 설명할 때만 낮은 대비의 1px 선으로 사용한다.
- 기본 아이콘은 Hugeicons 계열로 통일하고 아이콘 전용 버튼에 접근 가능한 이름과 tooltip을 제공한다.

## 3. Layout & Responsive Composition

- 콘텐츠에 따라 문서형, 목록형, 미디어형과 작업대형 구성을 선택한다. 단일 열을 강한 기본값으로 삼는다.
- 다중 열은 비교, 모니터링이나 병렬 탐색에 가치가 있을 때만 사용하고 모바일에서는 핵심 작업 순서를 보존한다.
- 지속적으로 참조하는 패널은 dock하고 일시적 도구만 floating layer로 연다.
- 보조 패널은 접기와 크기 조절, 명확한 복원 affordance를 제공한다.
- 컴포넌트는 viewport가 아니라 자신이 놓인 container에도 적응해야 한다.
- 표와 미디어처럼 2차원 의미가 있는 콘텐츠 외에는 320px에서 가로 스크롤 없이 사용 가능해야 한다.
- sticky와 floating 요소는 작은 viewport와 확대 상태에서 콘텐츠와 focus를 가리지 않는다.
- 한국어·영어 혼합, 긴 레이블, 200% 확대, 데이터 0개·1개·다수, 누락된 이미지와 다양한 종횡비를 견뎌야 한다.

## 4. Controls & Interaction

기본 control height는 `xs: 28px`, `sm: 36px`, `default: 40px`, `lg: 48px`다. 버튼은 높이 대비 가로 패딩을 조금 더 길게 잡아 정밀한 도구처럼 느껴지게 한다.

모든 interactive component는 적용 가능한 `default`, `hover`, `active`/`pressed`, `focus-visible`, `selected`/`checked`, `open`/`expanded`, `disabled`, `read-only`, `invalid`, `loading` 상태를 명시한다.

데이터를 다루는 composite와 block은 적용 가능한 `empty`, `pending`, `partial`, `stale`, `offline`, `permission-denied`, `success`, `warning`, `error` 상태도 명시한다. 지원하지 않는 상태는 암묵적으로 빠뜨리지 말고 이유를 기록한다.

- Hover는 필수 정보 전달 수단으로 쓰지 않는다.
- Active는 1px 이동이나 미세한 표면 변화처럼 짧고 직접적인 촉감을 준다.
- 선택 상태는 색, 형태, 아이콘과 텍스트 중 둘 이상의 단서로 구분한다.
- Disabled는 opacity만 낮추지 않고 상호작용 불가 상태가 읽히게 한다. 제한이 일시적이거나 해제 가능하면 이유와 조건을 설명한다.
- Invalid는 경계, 메시지와 접근성 속성을 함께 제공한다.
- Loading 중 레이아웃과 버튼 폭이 불필요하게 이동하지 않게 한다.
- 입력 control은 visible label을 제공하고 placeholder를 label 대신 사용하지 않는다. Validation, network와 permission error가 발생해도 사용자의 입력을 보존한다.

행동 계층은 한 작업 영역의 대표 행동인 Primary, 이를 보조하거나 되돌리는 Secondary, 반복 목록과 낮은 빈도의 Tertiary/Ghost, 실제 위험을 나타내는 Destructive, 탐색용 Link로 구분한다.

탭, 필터, 정렬, 그룹, 밀도, pagination과 열린 record처럼 복원되어야 하는 작업 문맥은 URL 또는 saved view에 저장한다. 순간적인 hover와 focus는 저장하지 않는다. detail panel을 닫으면 원래 목록의 focus, scroll과 selection으로 돌아간다.

## 5. Component Patterns

### Card & overlay

- 카드는 고정된 모양이 아니다. 콘텐츠에 따라 `plain`, `muted`, `frame`, `surface`를 선택한다. `muted`는 경계와 그림자 없이 배경 농도만으로 구분하는 조용한 표면에 쓴다.
- 모든 콘텐츠를 카드로 감싸거나 카드마다 제목, 설명, 아이콘, 배지와 버튼 세트를 반복하지 않는다.
- 메뉴와 팝오버는 trigger 근처에서 열고 닫힐 때 focus를 trigger로 돌려준다.
- Modal은 focus trap과 배경 상호작용 차단을 제공한다. 모바일에서는 sheet가 더 자연스러운지 검토한다.

### Empty, loading & feedback

- Empty는 무엇이 비었는지와 시작할 한 개의 행동을 알려 주며 장식용 일러스트로 기능 부족을 덮지 않는다.
- 즉시 렌더링 가능한 구조를 먼저 보여주고 skeleton은 실제 layout과 유사하게 만든다.
- 진행률을 아는 작업은 determinate progress를 사용하고 짧은 작업에 spinner를 깜빡이지 않는다.
- 결과가 화면에 분명하면 성공 toast를 반복하지 않는다.
- 오류는 실패한 대상과 다음 행동을 설명한다. Offline, permission-denied, stale data, partial failure와 sync conflict를 일반 error와 구분한다.
- Retry, edit, cancel, undo와 support 정보 중 유효한 recovery를 제공한다. 되돌릴 수 있는 삭제는 확인 modal보다 Undo를 먼저 검토한다.
- Optimistic update는 실패 시 rollback할 수 있고 피해가 제한적인 작업에만 사용한다.

### Navigation, search & commands

- 현재 위치, 이동 가능한 범위와 되돌아갈 경로를 이해할 수 있게 한다. Global navigation과 현재 객체의 local navigation을 구분한다.
- 자주 쓰는 경로에는 하나의 분명한 기본 방식을 제공하고 중복 경로는 숙련자 효율이나 접근성에 가치가 있을 때만 유지한다.
- 검색 결과가 없을 때 query 오타, filter, search scope와 permission 문제를 가능한 범위에서 구분한다.
- Command palette는 탐색과 실행을 빠르게 하는 accelerator이며 정보 구조를 대신하는 유일한 입구가 아니다.
- Shortcut은 발견 가능하고 변경 가능해야 하며 OS 예약 키, 국제 keyboard와 layout 차이를 고려한다.

### Lists, tables & data

- 데이터 관계는 장식 카드보다 row, column, alignment, number format, sticky header와 filter state로 설명한다.
- Table을 mobile에서 무조건 card list로 바꾸지 않는다. 중요도가 낮은 column 숨김, column 고정, horizontal scroll과 detail drill-down 중 관계를 가장 잘 보존하는 방식을 선택한다.
- 숫자에는 unit과 기준 기간을 제공하고 변화량과 상태를 색만으로 표현하지 않는다.
- Chart는 axis, unit과 읽을 수 있는 label을 제공하고 text summary, data table 또는 동등한 대체 정보를 제공한다.
- 고밀도 화면에서도 row selection, focus, sort, loading, empty result와 partial failure가 구분되어야 한다.

### Defaults & personalization

- 좋은 기본값을 먼저 제공하고 반복 사용에서 개인차가 큰 항목만 설정으로 연다.
- Density, theme, contrast, transparency, layout, shortcut과 notification은 개인화할 수 있다.
- 핵심 정보 구조, 안전한 행동과 기본 접근성 결정을 사용자 설정으로 떠넘기지 않는다.
- 현재 default와 사용자 override를 구분하고 preview와 reset 경로를 제공한다.

### Media & attribution

- 미디어 화면에서는 이미지가 색과 분위기의 주체가 되고 UI chrome은 후퇴한다.
- 서로 다른 종횡비를 억지로 같은 높이로 자르지 않는다.
- 출처, 작가, 원문 링크, license와 편집 이력이 중요한 콘텐츠에는 attribution을 핵심 metadata로 다룬다.

## 6. Motion, Keyboard & Content

모션은 상태 변화의 원인과 결과를 잇는다. Press와 hover는 `80–140ms`, 작은 상태 전환은 `120–180ms`, 메뉴·팝오버·dialog는 `160–240ms`, composed entrance는 최대 `320ms`를 기준으로 한다.

- Enter와 이동은 `cubic-bezier(0.32, 0.72, 0, 1)`, Exit는 `cubic-bezier(0.62, 0.04, 0.86, 0.4)`를 기본으로 한다.
- 큰 scale, 회전, 탄성, 빛 추적과 연속 stagger를 기본값으로 쓰지 않는다.
- `prefers-reduced-motion: reduce`에서는 비필수 이동과 탄성을 제거한다.
- 모든 주요 행동은 키보드로 완료할 수 있어야 하며 DOM과 시각적 읽기 순서를 일치시킨다.
- `Escape`는 현재 transient layer를 닫고 overlay가 닫히면 원래 trigger로 focus를 돌린다.
- `focus-visible`은 주변 색과 최소 3:1 상태 대비를 목표로 하며 sticky UI에 가려지지 않게 한다.
- 버튼과 label은 짧고 행동 중심으로 쓴다. 오류는 문제, 영향과 다음 행동 순으로 쓴다.
- locale, RTL, 한국어·영어 줄바꿈, 긴 데이터와 불필요한 ellipsis를 검증한다.

## 7. Registry Item Contract

모든 registry item은 코드뿐 아니라 사용 의도를 배포한다.

Public API, token source, registry 구조, dependency, release와 breaking change에는 `design/GOVERNANCE.md`를 추가로 적용한다.

필수 metadata:

- `name`, `title`, `description`, `type`, `files`
- `dependencies`, `registryDependencies`, `categories`
- 필요한 경우 `meta`, `docs`

`description`은 외형이 아니라 목적, 사용 문맥과 중요한 행동을 설명한다. 지원하지 않는 기능을 장식적으로 metadata에 선언하지 않는다.

상태와 문맥에 따라 다음 metadata를 사용할 수 있다.

```json
{
  "density": ["compact", "default", "comfortable"],
  "surface": ["canvas", "surface", "floating"],
  "states": ["loading", "disabled", "invalid"],
  "input": ["pointer", "keyboard", "touch"],
  "persistence": ["url", "saved-view"],
  "provenance": ["human", "ai", "external"],
  "risk": "reversible",
  "permissions": ["read", "write", "admin"],
  "environments": ["sandbox", "test", "live"]
}
```

`risk`는 `none`, `reversible`, `high`, `destructive` 중 실제 실패 영향과 회복 가능성에 맞는 값을 사용한다.

### API principles

- 기본 API가 가장 일반적이고 올바른 결과를 만들어야 한다.
- 시각 variant보다 의미와 행동 variant를 우선한다.
- boolean prop을 늘리기보다 composable slot과 명확한 state를 사용한다.
- `data-slot`, `data-state`, `data-variant`, `data-size`를 일관되게 사용한다.
- 외부 class override가 접근성과 필수 동작을 깨뜨리지 않게 한다.
- framework와 primitive의 기본 semantic을 보존한다.
- Controlled와 uncontrolled 사용을 지원하는 경우 source of truth, event와 reset 동작을 문서화한다.
- 적용 가능한 focus management, portal, scroll lock, direction-key navigation, typeahead와 form submission 동작을 문서화한다.

### Preview contract

- preview와 복사 가능한 예제는 배포 item과 같은 component API를 사용한다.
- fixture는 결정적으로 재현 가능해야 하며 `empty`, `typical`, `stress`를 제공한다.
- 데이터 composite는 적용 가능한 `partial`, `stale`, `offline`, `permission-denied`와 recovery 상태도 보여준다.
- 관계 0개·1개·다수, 누락된 값, 긴 값, 중복 이름, 큰 숫자와 대량 행을 포함한다.
- 한국어·영어 혼합, 다른 locale, RTL, 다양한 이미지 비율과 이미지 부재를 검증한다.
- permission, provenance와 environment가 중요하면 관련 상태를 preview에 포함한다.
- `Lorem ipsum`과 반복 placeholder 대신 실제 데이터의 길이와 불규칙성을 보존한 fixture를 사용한다.
- preview wrapper가 실제 container query, overflow, focus와 z-index 문제를 숨기지 않게 한다.

### Documentation coverage

각 component 문서는 적용 가능한 다음 내용을 빠짐없이 다룬다.

1. 목적과 사용하지 말아야 할 경우
2. Anatomy와 slot
3. Variant, size와 density
4. 적용 가능한 전체 state
5. Keyboard와 focus 동작
6. 접근성 요구사항
7. Responsive와 overflow 규칙
8. 사용 token
9. Loading, empty와 error example
10. 단독 example과 실제 composition example
11. 해당하는 경우 URL과 saved view 복원 규칙
12. 해당하는 경우 provenance, permission, environment와 audit 규칙
13. 실제 제품 수준의 preview data와 stress example

컴포넌트 문서의 편집 순서와 필수 항목은 `DOCS_GUIDELINES.md`를 따른다. 구현 완료 전 검수는 `design/QUALITY.md`를 사용한다.
