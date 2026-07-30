# 에셋 가이드

이 문서는 아이콘, 이미지, SVG 처리의 현재 기준이다.

## 아이콘

기본 아이콘 라이브러리는 `lucide-react`다.

공유 아이콘 export 위치:

- `packages/shared/ui/src/components/icons.tsx`

사용 원칙:

- 새 아이콘이 필요하면 먼저 `lucide-react`에서 가져와 공유 export에 추가한다.
- 앱 전용 임시 SVG는 허용하지만, 여러 화면에서 반복되면 `packages/shared/ui`로 이동한다.
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
- `ArchiveIcon`
- `BarChartIcon`
- `BotIcon`
- `FileTextIcon`
- `FolderOpenIcon`
- `LayoutDashboardIcon`
- `MessageSquarePlusIcon`
- `PlusIcon`
- `SendIcon`
- `SettingsIcon`
- `ShieldCheckIcon`
- `TrashIcon`
- `UserPlusIcon`
- `UsersIcon`

## 이미지

학습자 코스 썸네일은 `apps/web/public/course-thumbnails`에 둔다.

코스 화면은 계약의 `visualKey`를 exhaustive local asset map으로 변환하고 Next Image 최적화를 사용한다. 새 `visualKey`를 추가할 때는 같은 변경에서 로컬 파일과 map 항목을 함께 추가한다.

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

이미지 URL 생성은 `apps/web/src/entities/course/model/course-visual-assets.ts`의 `resolveCourseImage`를 사용한다. 화면에서 경로를 직접 조합하지 않는다.

## 이미지 사용 원칙

- 코스 카드와 코스 상세는 실제 코스 식별에 도움이 되는 썸네일을 사용한다.
- 공개 랜딩의 제품 미리보기도 현재 코스 콘텐츠와 `resolveCourseImage`의 실제 썸네일을 재사용한다. 제품 mock은 실제 학습자 UI와 콘텐츠 계약에 맞춰 작성하고 범용 예시 화면으로 대체하지 않는다.
- `next/image`를 우선 사용한다. 앱 UI-facing 파일에 native `<img>`를 새로 추가하지 않는다.
- 반응형 이미지는 실제 레이아웃 폭에 맞는 `sizes`를 명시한다.
- 임의 외부 placeholder 이미지는 코스 식별을 대신하지 않는다.
- alt는 사용자가 이미지를 보지 않아도 같은 목적을 이해할 수 있게 쓴다.
- 장식 목적의 배경 요소는 정보 이미지로 다루지 않는다.

## SVG 처리

- 공통 아이콘성 SVG는 `packages/shared/ui`로 모은다.
- 화면 고유 장식 SVG는 앱 컴포넌트 내부에 둘 수 있으나, 이름과 `aria-hidden` 처리 기준을 명확히 한다.
- 복잡한 일러스트레이션을 SVG로 직접 만들기보다 실제 이미지나 bitmap asset이 더 적절한지 먼저 판단한다.

## 어드민 에셋

어드민 콘텐츠 에셋은 코스의 현재 draft curriculum version에 업로드한다. 지원 용도는 코스 표지와 `READING` 본문 삽화이며 프로필 이미지는 이 경로로 받지 않는다.

업로드는 대체 텍스트가 있는 JPEG, PNG, WebP 파일만 허용하고 파일 크기는 5 MiB 이하여야 한다. 서버는 확장자나 요청의 MIME 선언을 신뢰하지 않고 파일 signature와 실제 이미지 decode를 모두 검증한다. 정상 입력도 EXIF 방향을 적용하고 metadata를 제거해 다시 인코딩한다. 코스 표지는 1600×900 cover, 본문 삽화는 원본을 확대하지 않는 최대 1440×1440 inside 규격을 사용한다.

어드민 화면 컴포넌트는 `lucide-react`를 직접 import하지 않는다. 필요한 아이콘은 먼저 `@workspace/ui/components/icons`에 re-export하고 화면에서는 그 public API만 사용한다.

## 파일 관리

- 파일명은 kebab-case를 사용한다.
- 런타임 코드가 레거시 실험 디렉터리의 파일을 직접 import하거나 참조하지 않는다.
- 새 public asset은 사용처와 제거 기준이 명확할 때만 추가한다.
