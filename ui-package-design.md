# UI 패키지 설계 문서

> **스택**: React 19 · Base UI · Tailwind CSS v4 · Material Design 3  
> **대상**: `src/foundation/ui` 패키지 (공용) + `src/features/**/components` (앱 전용 비즈니스 컴포넌트)

---

## 1. 코드베이스 분석 요약

### 현재 아키텍처
```
src/
 ┣━ app/            ← 라우팅 진입점
 ┣━ views/          ← 페이지 조립 계층
 ┣━ features/       ← 기능 단위 (journeys / sessions / writings / prompts / users / home / ai)
 ┣━ domain/         ← 순수 타입·스키마·비즈니스 로직
 ┗━ foundation/ui/  ← 현재: BottomNav + ThemeProvider만 존재
```

### 핵심 도메인 기능
- **여정 (Journey)**: 여정 탐색 → 상세 → 세션 진행
- **세션 (Session)**: 13가지 스텝 타입 (INTRO / COMPLETION / CONCEPT / EXAMPLE / MULTIPLE_CHOICE / FILL_IN_THE_BLANK / ORDERING / HIGHLIGHT / SHORT_ANSWER / WRITING / REWRITING / AI_FEEDBACK / AI_COMPARISON)
- **글쓰기 (Writing)**: TipTap 에디터 기반 자유 글쓰기, 저장·수정·삭제
- **글감 (Prompt)**: 글감 탐색, 카테고리 필터, 저장
- **프로필 (Profile)**: 사용자 통계, 테마, 설정

### 기존 디자인 토큰 사용 패턴 (기존 코드에서 추출)
색상: `surface` `on-surface` `on-surface-low` `on-surface-lowest` `surface-container` `surface-container-high` `surface-container-highest` `primary` `on-primary` `secondary-container` `on-secondary-container` `outline` `error`  
타이포그래피: `headline-{size}[-em]` `title-{size}[-em]` `body-{size}[-em]` `label-{size}[-em]`

---

## 2. `globals.css` — 전체 디자인 토큰

```css
/* ============================================================
   globals.css
   Material Design 3 기반 디자인 토큰 (CSS 변수)
   Tailwind CSS v4 @theme 블록으로 등록
   ============================================================ */

@import "tailwindcss";

@theme {

  /* ──────────────────────────────────────────────
     Color Scheme (MD3 Color Roles)
     Light / Dark는 .dark 클래스로 전환 (next-themes)
     ────────────────────────────────────────────── */

  /* Primary */
  --color-primary:                  var(--md-primary);
  --color-on-primary:               var(--md-on-primary);
  --color-primary-container:        var(--md-primary-container);
  --color-on-primary-container:     var(--md-on-primary-container);

  /* Secondary */
  --color-secondary:                var(--md-secondary);
  --color-on-secondary:             var(--md-on-secondary);
  --color-secondary-container:      var(--md-secondary-container);
  --color-on-secondary-container:   var(--md-on-secondary-container);

  /* Tertiary */
  --color-tertiary:                 var(--md-tertiary);
  --color-on-tertiary:              var(--md-on-tertiary);
  --color-tertiary-container:       var(--md-tertiary-container);
  --color-on-tertiary-container:    var(--md-on-tertiary-container);

  /* Error */
  --color-error:                    var(--md-error);
  --color-on-error:                 var(--md-on-error);
  --color-error-container:          var(--md-error-container);
  --color-on-error-container:       var(--md-on-error-container);

  /* Surface */
  --color-surface:                  var(--md-surface);
  --color-on-surface:               var(--md-on-surface);
  --color-surface-variant:          var(--md-surface-variant);
  --color-on-surface-variant:       var(--md-on-surface-variant);

  /* Surface Container 계층 (MD3) */
  --color-surface-container-lowest: var(--md-surface-container-lowest);
  --color-surface-container-low:    var(--md-surface-container-low);
  --color-surface-container:        var(--md-surface-container);
  --color-surface-container-high:   var(--md-surface-container-high);
  --color-surface-container-highest:var(--md-surface-container-highest);

  /* on-surface 강도 계층 (앱 커스텀 — 기존 코드 호환) */
  --color-on-surface-low:           color-mix(in srgb, var(--md-on-surface) 60%, transparent);
  --color-on-surface-lowest:        color-mix(in srgb, var(--md-on-surface) 35%, transparent);

  /* Outline */
  --color-outline:                  var(--md-outline);
  --color-outline-variant:          var(--md-outline-variant);

  /* Inverse */
  --color-inverse-surface:          var(--md-inverse-surface);
  --color-inverse-on-surface:       var(--md-inverse-on-surface);
  --color-inverse-primary:          var(--md-inverse-primary);

  /* Scrim / Shadow */
  --color-scrim:                    var(--md-scrim);

  /* ──────────────────────────────────────────────
     MD3 색상 원시값 (Light Theme 기본값)
     ────────────────────────────────────────────── */
  --md-primary:                     #3d6b44;
  --md-on-primary:                  #ffffff;
  --md-primary-container:           #bfedbe;
  --md-on-primary-container:        #002108;

  --md-secondary:                   #52634f;
  --md-on-secondary:                #ffffff;
  --md-secondary-container:         #d5e8cf;
  --md-on-secondary-container:      #101f0f;

  --md-tertiary:                    #38656a;
  --md-on-tertiary:                 #ffffff;
  --md-tertiary-container:          #bcebf0;
  --md-on-tertiary-container:       #002023;

  --md-error:                       #ba1a1a;
  --md-on-error:                    #ffffff;
  --md-error-container:             #ffdad6;
  --md-on-error-container:          #410002;

  --md-surface:                     #f7fbf1;
  --md-on-surface:                  #181d18;
  --md-surface-variant:             #dde5d9;
  --md-on-surface-variant:          #414940;

  --md-surface-container-lowest:    #ffffff;
  --md-surface-container-low:       #f1f5eb;
  --md-surface-container:           #ebefe5;
  --md-surface-container-high:      #e5e9df;
  --md-surface-container-highest:   #dfe3d9;

  --md-outline:                     #717970;
  --md-outline-variant:             #c1c9bd;

  --md-inverse-surface:             #2d3228;
  --md-inverse-on-surface:          #eff3e8;
  --md-inverse-primary:             #a3d1a2;

  --md-scrim:                       #000000;

  /* ──────────────────────────────────────────────
     Typography Scale (MD3 Type System)
     폰트: Pretendard (한국어) + 시스템 sans
     ────────────────────────────────────────────── */

  /* Font Families */
  --font-sans:   "Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont,
                 "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
  --font-mono:   "JetBrains Mono", "Fira Code", ui-monospace, monospace;

  /* Font Sizes */
  --text-display-large:    3.5625rem;   /* 57px */
  --text-display-medium:   2.8125rem;   /* 45px */
  --text-display-small:    2.25rem;     /* 36px */

  --text-headline-large:   2rem;        /* 32px */
  --text-headline-medium:  1.75rem;     /* 28px */
  --text-headline-small:   1.5rem;      /* 24px */

  --text-title-large:      1.375rem;    /* 22px */
  --text-title-medium:     1rem;        /* 16px */
  --text-title-small:      0.875rem;    /* 14px */

  --text-body-large:       1rem;        /* 16px */
  --text-body-medium:      0.875rem;    /* 14px */
  --text-body-small:       0.75rem;     /* 12px */

  --text-label-large:      0.875rem;    /* 14px */
  --text-label-medium:     0.75rem;     /* 12px */
  --text-label-small:      0.6875rem;   /* 11px */

  /* Line Heights */
  --leading-display-large:   4rem;
  --leading-display-medium:  3.25rem;
  --leading-display-small:   2.75rem;
  --leading-headline-large:  2.5rem;
  --leading-headline-medium: 2.25rem;
  --leading-headline-small:  2rem;
  --leading-title-large:     1.75rem;
  --leading-title-medium:    1.5rem;
  --leading-title-small:     1.25rem;
  --leading-body-large:      1.5rem;
  --leading-body-medium:     1.25rem;
  --leading-body-small:      1rem;
  --leading-label-large:     1.25rem;
  --leading-label-medium:    1rem;
  --leading-label-small:     1rem;

  /* Letter Spacings */
  --tracking-display-large:   -0.015625rem;
  --tracking-headline:        0;
  --tracking-title-large:     0;
  --tracking-title-medium:    0.009375rem;
  --tracking-title-small:     0.00625rem;
  --tracking-body-large:      0.03125rem;
  --tracking-body-medium:     0.015625rem;
  --tracking-body-small:      0.025rem;
  --tracking-label-large:     0.00625rem;
  --tracking-label-medium:    0.03125rem;
  --tracking-label-small:     0.03125rem;

  /* ──────────────────────────────────────────────
     Spacing & Shape (MD3 Shape Scale)
     ────────────────────────────────────────────── */

  /* Shape (Border Radius) — MD3 Shape tokens */
  --radius-none:       0;
  --radius-extra-small:0.25rem;    /* 4px  */
  --radius-small:      0.5rem;     /* 8px  */
  --radius-medium:     0.75rem;    /* 12px */
  --radius-large:      1rem;       /* 16px */
  --radius-extra-large:1.75rem;    /* 28px */
  --radius-full:       624.9375rem;/* pill */

  /* Elevation (Box Shadow — MD3 Elevation Levels) */
  --shadow-elevation-0: none;
  --shadow-elevation-1: 0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15);
  --shadow-elevation-2: 0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15);
  --shadow-elevation-3: 0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px rgba(0,0,0,0.3);
  --shadow-elevation-4: 0px 6px 10px 4px rgba(0,0,0,0.15), 0px 2px 3px rgba(0,0,0,0.3);
  --shadow-elevation-5: 0px 8px 12px 6px rgba(0,0,0,0.15), 0px 4px 4px rgba(0,0,0,0.3);

  /* Motion (MD3 Motion tokens) */
  --duration-short-1:  50ms;
  --duration-short-2:  100ms;
  --duration-short-3:  150ms;
  --duration-short-4:  200ms;
  --duration-medium-1: 250ms;
  --duration-medium-2: 300ms;
  --duration-medium-3: 350ms;
  --duration-medium-4: 400ms;
  --duration-long-1:   450ms;
  --duration-long-2:   500ms;
  --duration-long-3:   550ms;
  --duration-long-4:   600ms;

  --easing-linear:          linear;
  --easing-standard:        cubic-bezier(0.2, 0, 0, 1);
  --easing-standard-decel:  cubic-bezier(0, 0, 0, 1);
  --easing-standard-accel:  cubic-bezier(0.3, 0, 1, 1);
  --easing-emphasized:      cubic-bezier(0.2, 0, 0, 1);
  --easing-emphasized-decel:cubic-bezier(0.05, 0.7, 0.1, 1);
  --easing-emphasized-accel:cubic-bezier(0.3, 0, 0.8, 0.15);

  /* Z-Index 레이어 */
  --z-base:        0;
  --z-raised:      10;
  --z-nav:         40;
  --z-overlay:     50;
  --z-modal:       60;
  --z-toast:       70;
  --z-tooltip:     80;
}

/* ──────────────────────────────────────────────
   Dark Theme 색상 오버라이드
   ────────────────────────────────────────────── */
.dark {
  --md-primary:                     #a3d1a2;
  --md-on-primary:                  #0a390e;
  --md-primary-container:           #225228;
  --md-on-primary-container:        #bfedbe;

  --md-secondary:                   #b9ccb4;
  --md-on-secondary:                #253423;
  --md-secondary-container:         #3b4b39;
  --md-on-secondary-container:      #d5e8cf;

  --md-tertiary:                    #a0cfd4;
  --md-on-tertiary:                 #003739;
  --md-tertiary-container:          #1e4d52;
  --md-on-tertiary-container:       #bcebf0;

  --md-error:                       #ffb4ab;
  --md-on-error:                    #690005;
  --md-error-container:             #93000a;
  --md-on-error-container:          #ffdad6;

  --md-surface:                     #101510;
  --md-on-surface:                  #dfe3d9;
  --md-surface-variant:             #414940;
  --md-on-surface-variant:          #c1c9bd;

  --md-surface-container-lowest:    #0b0f0b;
  --md-surface-container-low:       #181d18;
  --md-surface-container:           #1c211c;
  --md-surface-container-high:      #272b26;
  --md-surface-container-highest:   #313631;

  --md-outline:                     #8b9389;
  --md-outline-variant:             #414940;

  --md-inverse-surface:             #dfe3d9;
  --md-inverse-on-surface:          #2d3228;
  --md-inverse-primary:             #3d6b44;
}

/* ──────────────────────────────────────────────
   Tailwind CSS v4 유틸리티 확장
   타이포그래피 복합 유틸리티 (size + leading + tracking + weight)
   기존 코드 호환: text-{role}-{size}[-em]
   ────────────────────────────────────────────── */
@utility text-display-large {
  font-size: var(--text-display-large);
  line-height: var(--leading-display-large);
  letter-spacing: var(--tracking-display-large);
  font-weight: 400;
}
@utility text-display-medium {
  font-size: var(--text-display-medium);
  line-height: var(--leading-display-medium);
  font-weight: 400;
}
@utility text-display-small {
  font-size: var(--text-display-small);
  line-height: var(--leading-display-small);
  font-weight: 400;
}

@utility text-headline-large {
  font-size: var(--text-headline-large);
  line-height: var(--leading-headline-large);
  font-weight: 400;
}
@utility text-headline-large-em {
  font-size: var(--text-headline-large);
  line-height: var(--leading-headline-large);
  font-weight: 600;
}
@utility text-headline-medium {
  font-size: var(--text-headline-medium);
  line-height: var(--leading-headline-medium);
  font-weight: 400;
}
@utility text-headline-medium-em {
  font-size: var(--text-headline-medium);
  line-height: var(--leading-headline-medium);
  font-weight: 600;
}
@utility text-headline-small {
  font-size: var(--text-headline-small);
  line-height: var(--leading-headline-small);
  font-weight: 400;
}
@utility text-headline-small-em {
  font-size: var(--text-headline-small);
  line-height: var(--leading-headline-small);
  font-weight: 600;
}

@utility text-title-large {
  font-size: var(--text-title-large);
  line-height: var(--leading-title-large);
  letter-spacing: var(--tracking-title-large);
  font-weight: 400;
}
@utility text-title-large-em {
  font-size: var(--text-title-large);
  line-height: var(--leading-title-large);
  font-weight: 600;
}
@utility text-title-medium {
  font-size: var(--text-title-medium);
  line-height: var(--leading-title-medium);
  letter-spacing: var(--tracking-title-medium);
  font-weight: 500;
}
@utility text-title-medium-em {
  font-size: var(--text-title-medium);
  line-height: var(--leading-title-medium);
  font-weight: 600;
}
@utility text-title-small {
  font-size: var(--text-title-small);
  line-height: var(--leading-title-small);
  letter-spacing: var(--tracking-title-small);
  font-weight: 500;
}
@utility text-title-small-em {
  font-size: var(--text-title-small);
  line-height: var(--leading-title-small);
  font-weight: 600;
}

@utility text-body-large {
  font-size: var(--text-body-large);
  line-height: var(--leading-body-large);
  letter-spacing: var(--tracking-body-large);
  font-weight: 400;
}
@utility text-body-large-em {
  font-size: var(--text-body-large);
  line-height: var(--leading-body-large);
  font-weight: 500;
}
@utility text-body-medium {
  font-size: var(--text-body-medium);
  line-height: var(--leading-body-medium);
  letter-spacing: var(--tracking-body-medium);
  font-weight: 400;
}
@utility text-body-medium-em {
  font-size: var(--text-body-medium);
  line-height: var(--leading-body-medium);
  font-weight: 500;
}
@utility text-body-small {
  font-size: var(--text-body-small);
  line-height: var(--leading-body-small);
  letter-spacing: var(--tracking-body-small);
  font-weight: 400;
}
@utility text-body-small-em {
  font-size: var(--text-body-small);
  line-height: var(--leading-body-small);
  font-weight: 500;
}

@utility text-label-large {
  font-size: var(--text-label-large);
  line-height: var(--leading-label-large);
  letter-spacing: var(--tracking-label-large);
  font-weight: 500;
}
@utility text-label-large-em {
  font-size: var(--text-label-large);
  line-height: var(--leading-label-large);
  font-weight: 600;
}
@utility text-label-medium {
  font-size: var(--text-label-medium);
  line-height: var(--leading-label-medium);
  letter-spacing: var(--tracking-label-medium);
  font-weight: 500;
}
@utility text-label-medium-em {
  font-size: var(--text-label-medium);
  line-height: var(--leading-label-medium);
  font-weight: 600;
}
@utility text-label-small {
  font-size: var(--text-label-small);
  line-height: var(--leading-label-small);
  letter-spacing: var(--tracking-label-small);
  font-weight: 500;
}
@utility text-label-small-em {
  font-size: var(--text-label-small);
  line-height: var(--leading-label-small);
  font-weight: 600;
}

/* ──────────────────────────────────────────────
   전역 Base Styles
   ────────────────────────────────────────────── */
@layer base {
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html {
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    font-feature-settings: "kern" 1, "liga" 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    font-family: var(--font-sans);
    background-color: var(--color-surface);
    color: var(--color-on-surface);
    font-size: var(--text-body-medium);
    line-height: var(--leading-body-medium);
  }

  /* iOS safe area 유틸리티 */
  .safe-area-pb {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
  .safe-area-pt {
    padding-top: max(0px, env(safe-area-inset-top));
  }
}
```

---

## 3. UI 패키지 전체 디렉터리 구조

```
src/foundation/ui/
├── globals.css                        ← 디자인 토큰 전체 (위 파일)
├── index.ts                           ← 전체 공개 API re-export
│
├── primitives/                        ← MD3 기반 공용 원자 컴포넌트
│   ├── button/
│   │   ├── button.tsx
│   │   ├── button.types.ts
│   │   └── index.ts
│   ├── icon-button/
│   │   ├── icon-button.tsx
│   │   └── index.ts
│   ├── fab/
│   │   ├── fab.tsx                    ← FAB + Extended FAB
│   │   └── index.ts
│   ├── text-field/
│   │   ├── text-field.tsx             ← Base UI Input 래핑
│   │   ├── textarea.tsx
│   │   └── index.ts
│   ├── select/
│   │   ├── select.tsx                 ← Base UI Select 래핑
│   │   └── index.ts
│   ├── checkbox/
│   │   ├── checkbox.tsx               ← Base UI Checkbox 래핑
│   │   └── index.ts
│   ├── radio/
│   │   ├── radio.tsx                  ← Base UI Radio 래핑
│   │   ├── radio-group.tsx
│   │   └── index.ts
│   ├── switch/
│   │   ├── switch.tsx                 ← Base UI Switch 래핑
│   │   └── index.ts
│   ├── slider/
│   │   ├── slider.tsx                 ← Base UI Slider 래핑
│   │   └── index.ts
│   ├── chip/
│   │   ├── chip.tsx                   ← Filter / Assist / Input / Suggestion Chip
│   │   └── index.ts
│   ├── badge/
│   │   ├── badge.tsx
│   │   └── index.ts
│   ├── card/
│   │   ├── card.tsx                   ← Elevated / Filled / Outlined
│   │   └── index.ts
│   ├── dialog/
│   │   ├── dialog.tsx                 ← Base UI Dialog 래핑
│   │   └── index.ts
│   ├── bottom-sheet/
│   │   ├── bottom-sheet.tsx           ← Base UI Popup 래핑
│   │   └── index.ts
│   ├── tabs/
│   │   ├── tabs.tsx                   ← Base UI Tabs 래핑 (Primary / Secondary)
│   │   ├── tab.tsx
│   │   ├── tab-list.tsx
│   │   ├── tab-panel.tsx
│   │   └── index.ts
│   ├── navigation-bar/
│   │   ├── navigation-bar.tsx         ← 하단 탭 바
│   │   ├── nav-item.tsx
│   │   └── index.ts
│   ├── top-app-bar/
│   │   ├── top-app-bar.tsx            ← Center-aligned / Small / Medium / Large
│   │   └── index.ts
│   ├── snackbar/
│   │   ├── snackbar.tsx
│   │   ├── snackbar-provider.tsx
│   │   ├── use-snackbar.ts
│   │   └── index.ts
│   ├── progress/
│   │   ├── linear-progress.tsx        ← 선형 진행 바
│   │   ├── circular-progress.tsx      ← 원형 진행 인디케이터
│   │   ├── loading-indicator.tsx      ← 단기 대기용 (MD3 Loading Indicator)
│   │   └── index.ts
│   ├── divider/
│   │   ├── divider.tsx
│   │   └── index.ts
│   ├── list/
│   │   ├── list.tsx
│   │   ├── list-item.tsx
│   │   └── index.ts
│   ├── avatar/
│   │   ├── avatar.tsx
│   │   └── index.ts
│   ├── tooltip/
│   │   ├── tooltip.tsx                ← Base UI Tooltip 래핑
│   │   └── index.ts
│   ├── menu/
│   │   ├── menu.tsx                   ← Base UI Menu 래핑
│   │   ├── menu-item.tsx
│   │   └── index.ts
│   └── skeleton/
│       ├── skeleton.tsx               ← 로딩 스켈레톤
│       └── index.ts
│
├── layout/                            ← 레이아웃 컴포넌트
│   ├── page-shell.tsx                 ← 탭 레이아웃 래퍼 (BottomNav 포함)
│   ├── scroll-area.tsx                ← 스크롤 영역 래퍼
│   └── index.ts
│
├── providers/                         ← 전역 Provider
│   ├── theme-provider.tsx             ← next-themes 래퍼 (기존)
│   ├── snackbar-provider.tsx
│   └── index.ts
│
└── hooks/                             ← UI 관련 공용 훅
    ├── use-media-query.ts
    ├── use-disclosure.ts              ← open/close 상태 관리
    └── index.ts
```

---

## 4. 공용 컴포넌트 상세 스펙

### 4-1. Button

MD3 Button variants 전체 지원. Base UI `Button` 기반.

```
variants:   filled | tonal | outlined | text | elevated
sizes:      sm (32px) | md (40px) | lg (48px)
states:     default | hovered | focused | pressed | disabled | loading
```

```tsx
// 사용 예시
<Button variant="filled" size="md" loading={isSaving}>
  저장하기
</Button>
<Button variant="outlined" size="md" leadingIcon={<ArrowLeftIcon />}>
  뒤로 가기
</Button>
```

### 4-2. IconButton

```
variants:   standard | filled | tonal | outlined
sizes:      sm (32px) | md (40px) | lg (48px)
toggle:     boolean  ← 토글 가능한 icon button
```

### 4-3. FAB

```
variants:   surface | primary | secondary | tertiary
sizes:      sm | md | lg (extended 포함)
```

### 4-4. TextField

Base UI `Input` 래핑. MD3 Filled / Outlined 스타일.

```
variants:   filled | outlined
states:     default | focused | error | disabled
props:      label, placeholder, helperText, errorText,
            leadingIcon, trailingIcon, prefix, suffix,
            maxLength, showCount
```

### 4-5. Card

```
variants:   elevated | filled | outlined
interactive: boolean  ← 클릭 가능한 카드 (ripple 효과)
```

### 4-6. Tabs

Base UI `Tabs` 래핑. MD3 Primary / Secondary tabs.

```
variants:   primary (underline indicator) | secondary (pill indicator)
scrollable: boolean
```

### 4-7. Bottom Sheet

Base UI `Popup` 래핑. 모바일 UX 핵심 컴포넌트.

```
props:      open, onClose, title, description, snapPoints,
            dismissible, overlay
```

### 4-8. Dialog

Base UI `Dialog` 래핑.

```
variants:   basic | full-screen
props:      open, onClose, title, description,
            actions (primary, secondary, destructive)
```

### 4-9. Snackbar / Toast

`useSnackbar()` 훅 기반.

```tsx
const { toast } = useSnackbar()
toast({ message: "저장되었습니다", action: { label: "확인", onClick: ... } })
toast.error("오류가 발생했습니다")
```

### 4-10. Progress

```tsx
<LinearProgress value={75} />                  // 결정적
<LinearProgress indeterminate />               // 비결정적
<CircularProgress value={60} size={48} />
<LoadingIndicator />                           // 단기 대기 전용
```

### 4-11. Navigation Bar

기존 `BottomNav` 대체. MD3 Navigation Bar.

```tsx
<NavigationBar>
  <NavItem href="/home" icon={<HomeIcon />} label="홈" />
  <NavItem href="/journeys" icon={<BookIcon />} label="여정" badge={3} />
</NavigationBar>
```

### 4-12. Top App Bar

```
variants:   center-aligned | small | medium | large
props:      title, navigationIcon, actions[], scrollBehavior
scrollBehavior: "fixed" | "scroll" | "compress"
```

### 4-13. Skeleton

```tsx
<Skeleton variant="text" width="60%" />
<Skeleton variant="rectangular" height={128} className="rounded-3xl" />
<Skeleton variant="circular" size={48} />
```

### 4-14. Chip

```
variants:   assist | filter | input | suggestion
```

---

## 5. 앱 전용 비즈니스 컴포넌트

앱의 핵심 기능과 결합된 컴포넌트. `src/features/**/components/` 위치에 기능 단위로 분리.

### 5-1. Journey 관련

```
src/features/journeys/components/
├── journey-card.tsx          ← 여정 목록 카드 (Active / Discover / Completed 세 형태)
├── journey-hero.tsx          ← 여정 상세 상단 히어로 섹션 (썸네일 + 제목 + 설명)
├── journey-progress-card.tsx ← 세션 진행률 카드 (완료/전체 + ProgressSegments)
├── progress-segments.tsx     ← 세션별 분절 프로그레스 바 (━━━━◦◦◦)
├── session-card.tsx          ← 세션 목록 아이템 (COMPLETED / IN_PROGRESS / LOCKED)
└── journey-enroll-cta.tsx    ← 여정 등록 유도 CTA 카드
```

**`JourneyCard`** — 상태에 따라 3가지 모드

```
mode: "active"      → 썸네일 + 제목 + 진행률 바 + %
mode: "discover"    → 썸네일 + 제목 + 설명 + 세션 수
mode: "completed"   → 소형 썸네일 + 제목 + 설명 + 완료 체크
```

**`SessionCard`** — 상태에 따라 3가지 형태

```
status: "COMPLETED"    → 접힘/펼침 토글, 완료 아이콘
status: "IN_PROGRESS"  → 접힘/펼침 토글, "지금 시작하기" CTA
status: "LOCKED"       → 잠금 아이콘, 비활성 스타일
```

### 5-2. Session 관련

세션 진행 UI의 핵심. `src/features/sessions/components/`

```
src/features/sessions/components/
├── session-header.tsx         ← 스텝 진행 헤더 (뒤로 | 제목 | 닫기 + LinearProgress)
├── session-cta-bar.tsx        ← 하단 고정 CTA 버튼 바
└── steps/
    ├── intro-step.tsx         ← 세션 시작 화면 (제목, 설명, 키워드 칩, 예상 시간)
    ├── completion-step.tsx    ← 세션 완료 화면 (축하 메시지, 요약, 다음 세션 예고)
    ├── concept-step.tsx       ← 개념 설명 (제목, 본문 마크다운, 핵심 포인트)
    ├── example-step.tsx       ← 예문 카드 (예문 목록 + 하이라이트 + 해설)
    ├── multiple-choice-step.tsx  ← 객관식 (단일/복수 선택, 정답 체크 후 해설)
    ├── fill-in-the-blank-step.tsx ← 빈칸 채우기 (드롭다운/버튼 선택)
    ├── ordering-step.tsx      ← 순서 배열 (드래그 앤 드롭)
    ├── highlight-step.tsx     ← 텍스트 하이라이트 선택
    ├── short-answer-step.tsx  ← 단답형 텍스트 입력
    ├── writing-step.tsx       ← 자유 글쓰기 입력 (min/max 글자 수, 타이머)
    ├── rewriting-step.tsx     ← 다시쓰기 입력 (원본 표시 + 개선 입력)
    ├── ai-feedback-step.tsx   ← AI 피드백 결과 (pending / succeeded / failed)
    └── ai-comparison-step.tsx ← AI 원본/다시쓰기 비교 결과
```

**스텝 공통 패턴**: 모든 스텝은 아래 인터페이스를 준수

```ts
// 선택형 스텝
interface InteractiveStepProps<TContent, TState> {
  content: TContent
  state: TState | undefined
  onStateChange: (state: TState) => void
}

// 크로스 참조 스텝 (AI 계열)
interface CrossReferenceStepProps<TContent> {
  content: TContent
  allStepStates: Record<string, StepState>
  isRetryingAi?: boolean
  onRetryAi?: (stepOrder: number) => Promise<void>
  sessionId: string
  step: Step
  steps: Step[]
}
```

### 5-3. Writing 관련

```
src/features/writings/components/
├── writing-editor.tsx         ← TipTap 에디터 래퍼 (자동저장 연동)
├── writing-toolbar.tsx        ← 에디터 포맷팅 툴바 (Bold, 기타)
├── writing-card.tsx           ← 글 목록 아이템 (제목, 날짜, 단어 수)
├── writing-word-count.tsx     ← 단어 수 표시 배지
├── prompt-banner.tsx          ← 에디터 내 글감 배너 (접힘/펼침)
├── writing-feedback-panel.tsx ← AI 피드백 결과 패널
└── writing-revision-diff.tsx  ← 원본/다시쓰기 비교 diff 뷰
```

### 5-4. Prompt 관련

```
src/features/prompts/components/
├── prompt-card.tsx            ← 글감 목록 카드 (타입 뱃지, 저장 버튼)
├── prompt-detail-header.tsx   ← 글감 상세 헤더 (제목, 카테고리, 저장 버튼)
├── prompt-category-chips.tsx  ← 카테고리 필터 칩 그룹
├── prompt-search-bar.tsx      ← 글감 검색 바
└── prompt-bottom-sheet.tsx    ← 글감 미리보기 바텀시트
```

**`PromptCard`** — 현재 `PromptArchiveView`에 인라인으로 존재하는 컴포넌트 분리

```
props:
  - id, title, promptType ("sensory" | "reflection" | "opinion")
  - isSaved
  - onSaveToggle
  - onClick
```

### 5-5. Home 관련

```
src/features/home/components/
├── greeting-section.tsx       ← 홈 인사 섹션 (오늘도 글을 써볼까요?)
├── writing-suggestion-card.tsx ← 자유 글쓰기 유도 CTA 카드
└── home-journey-card.tsx      ← 홈 전용 여정 카드 (진행률 포함)
```

### 5-6. Profile 관련

```
src/features/users/components/
├── profile-header.tsx         ← 아바타 + 이름 + 이메일
├── stats-cards.tsx            ← 완료한 여정 / 작성한 글 통계 카드 쌍
├── setting-row.tsx            ← 설정 항목 행 (아이콘 + 레이블 + trailing)
├── setting-section.tsx        ← 설정 그룹 섹션 (제목 + 카드)
└── theme-switcher.tsx         ← Light / System / Dark 토글 버튼 그룹
```

---

## 6. 마크다운 렌더러 분리

현재 `session-detail-view/markdown-renderer.tsx`에 인라인으로 존재하는 렌더러를 독립 컴포넌트로 이동.

```
src/foundation/ui/primitives/markdown/
├── markdown-renderer.tsx      ← 블록 마크다운 렌더러
├── inline-markdown.tsx        ← 인라인 마크다운 (bold 등)
└── index.ts
```

---

## 7. 전체 `index.ts` 공개 API

```ts
// src/foundation/ui/index.ts

// Providers
export { ThemeProvider } from "./providers/theme-provider"
export { SnackbarProvider, useSnackbar } from "./providers/snackbar-provider"

// Layout
export { PageShell } from "./layout/page-shell"
export { ScrollArea } from "./layout/scroll-area"

// Primitives — Actions
export { Button } from "./primitives/button"
export { IconButton } from "./primitives/icon-button"
export { FAB, ExtendedFAB } from "./primitives/fab"

// Primitives — Inputs
export { TextField } from "./primitives/text-field"
export { Textarea } from "./primitives/text-field"
export { Select, SelectItem } from "./primitives/select"
export { Checkbox } from "./primitives/checkbox"
export { Radio, RadioGroup } from "./primitives/radio"
export { Switch } from "./primitives/switch"
export { Slider } from "./primitives/slider"
export { Chip } from "./primitives/chip"

// Primitives — Containment
export { Card } from "./primitives/card"
export { Dialog } from "./primitives/dialog"
export { BottomSheet } from "./primitives/bottom-sheet"
export { Menu, MenuItem } from "./primitives/menu"
export { Tooltip } from "./primitives/tooltip"

// Primitives — Navigation
export { NavigationBar, NavItem } from "./primitives/navigation-bar"
export { TopAppBar } from "./primitives/top-app-bar"
export { Tabs, TabList, Tab, TabPanel } from "./primitives/tabs"

// Primitives — Status & Feedback
export { LinearProgress } from "./primitives/progress"
export { CircularProgress } from "./primitives/progress"
export { LoadingIndicator } from "./primitives/progress"
export { Badge } from "./primitives/badge"
export { Skeleton } from "./primitives/skeleton"
export { Divider } from "./primitives/divider"

// Primitives — Display
export { Avatar } from "./primitives/avatar"
export { List, ListItem } from "./primitives/list"
export { MarkdownRenderer, InlineMarkdown } from "./primitives/markdown"

// Hooks
export { useMediaQuery } from "./hooks/use-media-query"
export { useDisclosure } from "./hooks/use-disclosure"
```

---

## 8. Base UI 통합 매핑

| UI 컴포넌트 | Base UI 기반 컴포넌트 |
|---|---|
| `Button` | `@base-ui-components/react/button` |
| `IconButton` | `@base-ui-components/react/button` |
| `TextField` | `@base-ui-components/react/field` + `@base-ui-components/react/input` |
| `Select` | `@base-ui-components/react/select` |
| `Checkbox` | `@base-ui-components/react/checkbox` |
| `Radio / RadioGroup` | `@base-ui-components/react/radio-group` |
| `Switch` | `@base-ui-components/react/switch` |
| `Slider` | `@base-ui-components/react/slider` |
| `Dialog` | `@base-ui-components/react/dialog` |
| `BottomSheet` | `@base-ui-components/react/dialog` (모바일 오버라이드) |
| `Tooltip` | `@base-ui-components/react/tooltip` |
| `Tabs` | `@base-ui-components/react/tabs` |
| `Menu` | `@base-ui-components/react/menu` |
| `NavigationBar` | 커스텀 (Base UI 없음) |
| `Snackbar` | `@base-ui-components/react/toast` |
| `Progress` | 커스텀 SVG / div |

**Base UI 통합 원칙**

- Base UI 컴포넌트는 `headless` 상태·접근성만 담당, 스타일은 Tailwind CSS v4 + 디자인 토큰으로 100% 커스터마이징
- `data-*` 상태 속성(`data-checked`, `data-disabled`, `data-popup-open` 등)을 Tailwind의 `data-[]` 선택자로 스타일링
- ARIA 속성은 Base UI가 자동 주입하므로 별도 `aria-*` 수동 추가 지양

```tsx
// 예시: Base UI Switch를 MD3 Switch로 스타일링
import * as Switch from "@base-ui-components/react/switch"

export function MDSwitch({ checked, onCheckedChange, disabled }: SwitchProps) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={[
        "relative h-8 w-[52px] rounded-full transition-colors",
        "bg-surface-container-highest",
        "data-[checked]:bg-primary",
        "data-[disabled]:opacity-38 data-[disabled]:cursor-not-allowed",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
      ].join(" ")}
    >
      <Switch.Thumb
        className={[
          "absolute top-1 left-1 size-6 rounded-full bg-outline shadow-elevation-1",
          "transition-all duration-short-4 ease-standard",
          "data-[checked]:translate-x-5 data-[checked]:size-6 data-[checked]:bg-on-primary",
        ].join(" ")}
      />
    </Switch.Root>
  )
}
```

---

## 9. 구현 우선순위

### Phase 1 — 핵심 인프라 (즉시 필요)

1. `globals.css` 디자인 토큰 전체 작성
2. `Button` — 앱 전체에서 가장 많이 쓰임
3. `IconButton` — 헤더, 네비게이션 전반
4. `TopAppBar` — 모든 페이지 공통 헤더
5. `NavigationBar` — 기존 `BottomNav` 교체
6. `Skeleton` — 로딩 UI 일관화
7. `Card` — JourneyCard, WritingCard 기반

### Phase 2 — 세션 스텝 UI

8. `Tabs` — MyJourneys, WritingsList
9. `LinearProgress` — 세션 진행 헤더
10. `BottomSheet` — 글감 프리뷰, 나가기 확인
11. `Dialog` — 삭제 확인, 나가기 경고
12. `TextField` / `Textarea` — ShortAnswerStep, WritingStep
13. `Checkbox` / `Radio` — MultipleChoiceStep

### Phase 3 — 풍부한 인터랙션

14. `Snackbar` — 저장 완료, 오류 알림
15. `Chip` — 프롬프트 카테고리 필터
16. `Menu` — 드롭다운 메뉴 (에디터 더보기)
17. `Switch` — 설정 페이지
18. `Tooltip` — 도움말
19. `FAB` — 새 글쓰기 진입점

---

## 10. 파일 의존성 다이어그램

```
globals.css
    └── @theme 토큰
            ├── primitives/ (Tailwind 클래스로 소비)
            │       ├── button.tsx
            │       ├── card.tsx
            │       └── ...
            ├── providers/
            │       ├── theme-provider.tsx     (dark class 토글)
            │       └── snackbar-provider.tsx
            └── layout/
                    └── page-shell.tsx

features/journeys/components/
    ├── journey-card.tsx        → Card (primitive)
    └── session-card.tsx        → (자체 스타일, primitive 없음)

features/sessions/components/
    ├── session-header.tsx      → TopAppBar + LinearProgress
    ├── session-cta-bar.tsx     → Button
    └── steps/
            ├── multiple-choice-step.tsx → Radio / Checkbox
            ├── writing-step.tsx         → Textarea
            └── ai-feedback-step.tsx     → Skeleton + Card

features/writings/components/
    └── writing-editor.tsx      → (TipTap 직접, primitive 없음)

views/
    └── (조립만 담당, 직접 primitive 참조 가능)
```

---

## 11. 네이밍 컨벤션

| 항목 | 규칙 | 예시 |
|---|---|---|
| 컴포넌트 파일 | `kebab-case.tsx` | `session-card.tsx` |
| 컴포넌트 이름 | `PascalCase` | `SessionCard` |
| 타입/인터페이스 | `PascalCase` | `SessionCardProps` |
| CSS 클래스 | Tailwind 유틸리티 + 디자인 토큰 | `bg-surface-container` |
| 훅 | `use-` prefix, `camelCase` | `useDisclosure` |
| 인덱스 파일 | `index.ts` (named export만) | `export { Button }` |
| Variant prop | `variant` | `variant="filled"` |
| 크기 prop | `size` | `size="md"` |
