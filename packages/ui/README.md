앱 layout에서는 공통 primitive와 Next 통합 컴포넌트의 import 경계를 분리한다.
현재 앱의 필수 root provider는 `ThemeProvider`이며, toast UI가 필요한 앱은 같은
`@workspace/ui/next` 경계에서 `Toaster`를 함께 배치한다.

```tsx title="app/layout.tsx"
import { ThemeProvider, Toaster } from "@workspace/ui/next"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
```

`TooltipProvider`는 tooltip delay 같은 전역 기본값을 조정해야 할 때만 선택적으로
추가한다. 개별 `Tooltip` 사용 자체를 위해 앱 root layout에 항상 추가할 필요는 없다.

## import 규칙

앱과 도메인 패키지는 전역 규칙에 따라 absolute import를 사용한다. 다만
`src/components/ui` 아래의 shadcn/Base UI primitive 구현 파일은 생성 코드 관례와
colocation을 유지하기 위해 `../../lib/utils`, `./button` 같은 로컬 상대 import를
허용한다. 이 예외는 primitive 내부 구현에만 적용하며, 패키지 바깥 경계나 앱 feature
코드는 absolute import를 유지한다.
