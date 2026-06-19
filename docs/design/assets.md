# 에셋 가이드

이 문서는 아이콘, 이미지, SVG 처리의 현재 기준이다.

## 아이콘

기본 아이콘 라이브러리는 `lucide-react`다.

공유 아이콘 export 위치:

- `packages/ui/src/components/icons.tsx`

사용 원칙:

- 새 아이콘이 필요하면 먼저 `lucide-react`에서 가져와 공유 export에 추가한다.
- 앱 전용 임시 SVG는 허용하지만, 여러 화면에서 반복되면 `packages/ui`로 이동한다.
- 아이콘 버튼은 가능한 텍스트 대신 익숙한 아이콘을 사용하고, 의미가 불명확하면 `aria-label` 또는 tooltip을 제공한다.
- 장식 아이콘은 `aria-hidden="true"`를 지정한다.
- SVG stroke는 lucide와 같은 `fill="none"`, `stroke="currentColor"`, `strokeWidth={2}`, round cap/join을 기준으로 한다.

현재 공유 아이콘:

- `ArrowRightIcon`
- `CheckCircleIcon`
- `GraduationCapIcon`
- `LayersIcon`
- `LogInIcon`
- `PuzzleIcon`
- `SparklesIcon`
- `BookOpenIcon`
- `CheckIcon`
- `ChevronDownIcon`
- `ChevronLeftIcon`
- `ChevronRightIcon`
- `FlameIcon`
- `LockIcon`
- `PlayIcon`
- `HomeIcon`
- `UserIcon`
- `XIcon`

## 이미지

학습자 코스 썸네일은 `apps/web/public/course-thumbnails`에 둔다.

`picsum.photos/seed/{id}` 같은 외부 placeholder 이미지는 비제품 기준이다. 정식 코스 썸네일로 사용하지 않는다.

현재 코스 썸네일:

- `basic-sentence-writing.png`
- `business-email.png`
- `business-writing.png`
- `creative-writing.png`
- `emotion-writing.png`
- `essay-writing.png`
- `expression.png`
- `grammar-complete.png`
- `reading-comprehension.png`
- `sentence-structure.png`
- `vocabulary-basics.png`

이미지 URL 생성은 `apps/web/src/features/courses/course-visual-assets.ts`의 `createCourseImageUrl`을 사용한다. 화면에서 경로를 직접 조합하지 않는다.

## 이미지 사용 원칙

- 코스 카드와 코스 상세는 실제 코스 식별에 도움이 되는 썸네일을 사용한다.
- `next/image`를 우선 사용한다. 단, 구현상 draggable 제어가 필요한 기존 학습 홈 카드처럼 `<img>`를 쓰는 경우 alt와 크기 안정성을 유지한다.
- 임의 외부 placeholder 이미지는 코스 식별을 대신하지 않는다.
- alt는 사용자가 이미지를 보지 않아도 같은 목적을 이해할 수 있게 쓴다.
- 장식 목적의 배경 요소는 정보 이미지로 다루지 않는다.

## SVG 처리

- 공통 아이콘성 SVG는 `packages/ui`로 모은다.
- 화면 고유 장식 SVG는 앱 컴포넌트 내부에 둘 수 있으나, 이름과 `aria-hidden` 처리 기준을 명확히 한다.
- 복잡한 일러스트레이션을 SVG로 직접 만들기보다 실제 이미지나 bitmap asset이 더 적절한지 먼저 판단한다.

## 어드민 에셋

현재 어드민은 코스 썸네일 업로드를 운영하지 않는다. 코스 목록과 상세는 텍스트, 상태, 카운트, 표로 식별한다.

어드민 아이콘은 `lucide-react`를 화면 컴포넌트에서 직접 사용할 수 있다. 여러 화면에서 반복되는 어드민 전용 아이콘 묶음이 생기면 그때 공유 export를 검토한다.

## 파일 관리

- 파일명은 kebab-case를 사용한다.
- 런타임 코드가 레거시 실험 디렉터리의 파일을 직접 import하거나 참조하지 않는다.
- 새 public asset은 사용처와 제거 기준이 명확할 때만 추가한다.
