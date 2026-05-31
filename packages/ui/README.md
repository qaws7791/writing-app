앱 layout에서는 공통 primitive와 Next 통합 컴포넌트의 import 경계를 분리한다.

```tsx title="app/layout.tsx"
import { TooltipProvider } from "@workspace/ui/components/ui/tooltip"
import { ThemeProvider } from "@workspace/ui/next"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```
