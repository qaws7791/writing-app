# Luma Design Language

인터페이스는 콘텐츠보다 앞서지 않는다.

Luma는 평범한 Shadcn theme나 무채색 SaaS UI kit가 아니다. 콘텐츠를 조용히 정돈하면서도 정밀한 공간, 표면, typography와 interaction rhythm에서 독립적인 인상이 드러나는 디자인 언어다.

이 문서는 모든 디자인·컴포넌트 작업에서 먼저 읽는 핵심 계약이다. 세부 구현 규칙은 작업 범위에 맞는 문서만 추가로 읽는다.

## Document Routing

| 작업                                                        | 추가로 읽을 문서        |
| ----------------------------------------------------------- | ----------------------- |
| Registry component, block, preview 구현                     | `design/COMPONENTS.md`  |
| Public API, token, registry 구조, 배포와 breaking change    | `design/GOVERNANCE.md`  |
| 학습 경로, lesson, step과 학습 activity                     | `design/LEARNING.md`    |
| AI 생성물, provenance, permission, environment, 고위험 행동 | `design/AI_AND_RISK.md` |
| 새 컴포넌트와 큰 변경의 최종 검수                           | `design/QUALITY.md`     |
| 외부 제품이나 pattern을 조사·차용                           | `design/REFERENCES.md`  |
| 컴포넌트 문서와 example 작성                                | `DOCS_GUIDELINES.md`    |

여러 조건에 해당하면 문서를 함께 적용한다. 분야별 문서는 이 문서의 원칙을 대체하지 않고 구체화한다.

## 1. Identity

### Character

Luma는 다음과 같이 느껴져야 한다.

- 정밀하되 차갑지 않다.
- 미니멀하되 비어 있지 않다.
- 감각적이되 장식적이지 않다.
- 고급스럽되 과시적이지 않다.
- 친근하되 귀엽거나 장난스럽지 않다.
- 콘텐츠 중심이되 인터페이스의 개성을 잃지 않는다.
- 전문 도구처럼 빠르고 유용하되 오래 머물고 싶은 공간처럼 편안하다.

동일한 언어가 디자인 라이브러리, 큐레이션 플랫폼, 창작 도구, 포트폴리오, 커머스, 지식 관리, 업무와 학습 도구에 적용될 수 있어야 한다. 도메인이 바뀌어도 공간감, 상태 표현, 컨트롤의 촉감과 콘텐츠를 대하는 태도는 유지한다.

### North Star

각 컴포넌트는 단독으로 완성도가 높아야 한다. 함께 배치했을 때에는 여백, typography, 표면, 콘텐츠 밀도와 interaction rhythm에서 하나의 철학이 드러나야 한다.

완성도는 효과의 수가 아니라 다음 기준으로 판단한다.

1. 사용자가 지금 해야 할 일이 즉시 보이는가.
2. 콘텐츠와 기능 계층이 분명한가.
3. 상태 변화가 예측 가능하고 조용한가.
4. 실제 데이터와 긴 사용 시간에도 편안한가.

## 2. Core Principles

### Content earns the foreground

이미지, 글, 데이터와 사용자 작업물이 화면의 감정과 색을 만든다. 컴포넌트는 이를 정돈하고 돋보이게 하는 프레임이다. 핵심 콘텐츠와 행동만 전경에 두고 navigation, metadata와 보조 행동은 자연스럽게 후퇴시킨다.

### Structure should be felt

구조는 박스와 구분선의 수가 아니라 공간, 정렬, 밀도, 농도와 표면 차이로 느껴지게 한다. Border는 관계를 설명할 때만 사용하고 장식적인 구획에는 사용하지 않는다.

### Complexity grows with the user

기본 상태는 즉시 이해할 수 있어야 한다. 고급 기능과 조밀한 정보는 필요할 때 발견되고 확장되어야 한다. 강력한 기능을 숨기지는 않지만 첫 화면에서 모두 주장하게 만들지 않는다.

### Familiar behavior, distinctive expression

동작, keyboard, focus, 오류 처리와 semantic에는 익숙한 platform 관습을 따른다. 개성은 예측 불가능한 동작이 아니라 형태의 비례, 공간의 rhythm, 표면과 typography에서 만든다.

### Novelty has a budget

새로움은 제품 고유 기능이나 새로운 작업 방식을 설명하는 데 사용한다. 새로운 시각 언어, 탐색 구조와 gesture를 한 화면에서 동시에 도입하지 않는다. 익숙한 기능을 낯설게 바꾸는 학습 비용에는 명확한 사용자 가치가 있어야 한다.

### Cohesion over sameness

일관성은 모든 component를 같은 모양으로 만드는 것이 아니다. Typography, 공간 rhythm, surface hierarchy, state 표현, interaction 속도와 문장 태도를 공유하되 콘텐츠 목적에 맞는 서로 다른 구조를 허용한다.

### Restraint is a budget

한 영역은 하나의 주된 강조 수단만 사용한다. 색, 그림자, blur, 크기와 motion을 동시에 강조하지 않는다. 효과는 계층과 상태를 설명한 뒤 물러나야 한다.

## 3. Attention Hierarchy

모든 요소는 다음 단계 중 하나에 속해야 한다.

1. **Primary** — 현재 작업의 핵심 콘텐츠 또는 한 개의 주 행동
2. **Secondary** — 작업을 직접 보조하는 정보와 행동
3. **Tertiary** — 탐색, metadata와 보조 option
4. **Ambient** — 배경 구조, 비활성 navigation과 맥락

한 화면이나 독립 작업 영역의 강한 Primary 행동은 원칙적으로 하나다. 여러 행동이 중요하면 색을 늘리기보다 배치와 group으로 관계를 설명한다. 아이콘, badge, border와 배경색이 없어도 정보 구조가 읽혀야 한다.

## 4. System Invariants

### Surface & geometry

- 콘텐츠는 Canvas에 직접 놓일 수 있어야 한다. 모든 것을 카드로 감싸지 않는다.
- Surface와 Floating layer는 기능 관계로 구분하고 glass는 일시적 기능층에만 제한한다.
- Control은 중간 radius를 기본으로 한다. Pill은 badge, chip, tag와 작은 hardware형 요소에 제한한다.
- 같은 화면의 모든 component에 같은 radius, shadow와 accent color를 반복하지 않는다.

### State & interaction

- 모든 interactive component는 적용 가능한 default, hover, active, focus-visible, selected, open, disabled, read-only, invalid와 loading 상태를 설계한다.
- 상태는 색 하나가 아니라 형태, icon, text와 semantic 중 둘 이상의 단서로 전달한다.
- Primary, Secondary, Tertiary, Destructive와 Link 행동을 목적에 따라 구분한다.
- Motion은 원인과 결과를 설명해야 하며 작업을 지연시키거나 콘텐츠보다 주목받지 않는다.
- 입력과 scroll은 즉시 반응하고 불필요한 layout shift가 없어야 한다. 성능 저하는 시각적 완성도의 결함으로 취급한다.
- 데이터 component는 이상적인 populated state뿐 아니라 empty, partial, stale, offline, permission-denied와 recovery를 설계한다.
- 복원되어야 하는 view와 작업 문맥은 URL 또는 saved state에 보존한다.

### Responsive & accessibility

- Component는 viewport뿐 아니라 자신이 놓인 container와 실제 콘텐츠 길이에 적응한다.
- 320px 너비와 200% 확대에서 정보와 기능 손실 없이 reflow한다.
- 모든 주요 작업은 keyboard로 완료할 수 있고 focus 이동과 복귀가 예측 가능해야 한다.
- 일반 text는 4.5:1, 큰 text와 비텍스트 상태는 3:1 이상의 대비를 확보한다.
- reduced motion, increased contrast, forced colors와 투명도 없는 환경에서도 완전하게 작동해야 한다.

### Content & trust

- 실제 제품 수준의 긴 데이터, 누락, locale, RTL과 다양한 image ratio로 설계한다.
- Error는 문제, 영향과 다음 행동을 설명한다. Empty는 다음 행동을 제공한다.
- AI와 외부 콘텐츠는 생성 주체, source, 범위와 불확실성을 숨기지 않는다.
- 권한, 비용이나 live data에 영향을 주는 행동은 대상, 환경, 영향과 복구 방법을 실행 전에 드러낸다.

## 5. Universal Anti-patterns

- 기본 Shadcn의 color와 radius만 바꾼 결과를 독립적인 디자인 시스템이라 부르지 않는다.
- 요소를 제거하거나 흑백으로 만드는 것만으로 minimalism과 고급스러움을 대신하지 않는다.
- 모든 콘텐츠를 같은 둥근 카드에 넣거나 제목, 설명, icon, badge와 button 세트를 반복하지 않는다.
- Glass, neon, 강한 blur, 화려한 gradient와 큰 shadow를 기본 언어로 사용하지 않는다.
- 파란 Primary button, 회색 sidebar와 통계 카드의 상투적인 SaaS dashboard를 기본값으로 삼지 않는다.
- 한 화면에서 여러 목적이 동시에 외치게 하거나 screenshot용 장식 때문에 실제 작업 흐름을 희생하지 않는다.
- 탄성, 회전, 반짝임, mouse tracking과 과도한 stagger를 기본 interaction으로 사용하지 않는다.
- 기능 부족, empty와 error를 illustration, 장식이나 모호한 문구로 덮지 않는다.

## 6. Decision Check

구현 전후에 다음을 확인한다.

- 핵심 콘텐츠와 한 개의 Primary 행동이 먼저 보이는가.
- Card, border, color와 effect를 하나 줄여도 구조가 유지되는가.
- Component가 실제 데이터, 조합, 상태와 입력 방식에서 동작하는가.
- Keyboard와 보조 기술이 시각 UI와 같은 정보와 행동을 얻는가.
- 기본 Shadcn과 구별되는 이유를 token 교체 외의 언어로 설명할 수 있는가.
- 작업에 해당하는 세부 문서와 quality gate를 적용했는가.
