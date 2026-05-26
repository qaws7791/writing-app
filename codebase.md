This file is a merged representation of a subset of the codebase, containing files not matching ignore patterns, combined into a single document by Repomix.
The content has been processed where empty lines have been removed.

# File Summary

## Purpose
This file contains a packed representation of a subset of the repository's contents that is considered the most important context.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching these patterns are excluded: sonnet-to-react, .agents, apps/docs, apps/storybook, docs, packages/config, scripts
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Empty lines have been removed from all files
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
.env.docker.example
.eslintrc.js
.gitignore
.npmrc
.nvmrc
.prettierrc.json
AGENTS.md
apps/web/.gitignore
apps/web/AGENTS.md
apps/web/CLAUDE.md
apps/web/components.json
apps/web/eslint.config.mjs
apps/web/next.config.ts
apps/web/package.json
apps/web/postcss.config.mjs
apps/web/public/course-thumbnails/basic-sentence-writing.png
apps/web/public/course-thumbnails/business-email.png
apps/web/public/course-thumbnails/business-writing.png
apps/web/public/course-thumbnails/creative-writing.png
apps/web/public/course-thumbnails/emotion-writing.png
apps/web/public/course-thumbnails/essay-writing.png
apps/web/public/course-thumbnails/expression.png
apps/web/public/course-thumbnails/grammar-complete.png
apps/web/public/course-thumbnails/reading-comprehension.png
apps/web/public/course-thumbnails/sentence-structure.png
apps/web/public/course-thumbnails/vocabulary-basics.png
apps/web/README.md
apps/web/src/app/courses/[id]/not-found.tsx
apps/web/src/app/courses/[id]/page.tsx
apps/web/src/app/courses/page.tsx
apps/web/src/app/globals.css
apps/web/src/app/home/page.tsx
apps/web/src/app/layout.tsx
apps/web/src/app/lesson/not-found.tsx
apps/web/src/app/lesson/page.tsx
apps/web/src/app/page.tsx
apps/web/src/components/layout/app-shell.tsx
apps/web/src/components/layout/global-nav.tsx
apps/web/src/features/courses/course-card.tsx
apps/web/src/features/courses/course-curriculum.tsx
apps/web/src/features/courses/course-data.ts
apps/web/src/features/courses/course-detail-data.ts
apps/web/src/features/courses/course-detail-page.tsx
apps/web/src/features/courses/course-feed.tsx
apps/web/src/features/courses/courses-page.tsx
apps/web/src/features/home/home-data.ts
apps/web/src/features/home/home-page.tsx
apps/web/src/features/lessons/lesson-data.ts
apps/web/src/features/lessons/lesson-experience.tsx
apps/web/src/features/lessons/lesson-logic.ts
apps/web/src/features/lessons/lesson-page.tsx
apps/web/src/features/lessons/lesson-types.ts
apps/web/tsconfig.json
docker-compose.yml
lefthook.yml
package.json
packages/ui/AGENTS.md
packages/ui/components.json
packages/ui/eslint.config.js
packages/ui/package.json
packages/ui/postcss.config.mjs
packages/ui/README.md
packages/ui/src/components/.gitkeep
packages/ui/src/components/icons.tsx
packages/ui/src/components/ui/alert-dialog.tsx
packages/ui/src/components/ui/alert.tsx
packages/ui/src/components/ui/avatar.tsx
packages/ui/src/components/ui/badge.tsx
packages/ui/src/components/ui/breadcrumb.tsx
packages/ui/src/components/ui/button-group.tsx
packages/ui/src/components/ui/button.tsx
packages/ui/src/components/ui/card.tsx
packages/ui/src/components/ui/checkbox.tsx
packages/ui/src/components/ui/chip.tsx
packages/ui/src/components/ui/collapsible.tsx
packages/ui/src/components/ui/combobox.tsx
packages/ui/src/components/ui/command.tsx
packages/ui/src/components/ui/dialog.tsx
packages/ui/src/components/ui/drawer.tsx
packages/ui/src/components/ui/dropdown-menu.tsx
packages/ui/src/components/ui/empty.tsx
packages/ui/src/components/ui/field.tsx
packages/ui/src/components/ui/input-group.tsx
packages/ui/src/components/ui/input.tsx
packages/ui/src/components/ui/item.tsx
packages/ui/src/components/ui/kbd.tsx
packages/ui/src/components/ui/label.tsx
packages/ui/src/components/ui/pagination.tsx
packages/ui/src/components/ui/popover.tsx
packages/ui/src/components/ui/progress-bar.tsx
packages/ui/src/components/ui/progress.tsx
packages/ui/src/components/ui/radio-group.tsx
packages/ui/src/components/ui/scroll-area.tsx
packages/ui/src/components/ui/select.tsx
packages/ui/src/components/ui/separator.tsx
packages/ui/src/components/ui/sheet.tsx
packages/ui/src/components/ui/sidebar.tsx
packages/ui/src/components/ui/skeleton.tsx
packages/ui/src/components/ui/slider.tsx
packages/ui/src/components/ui/sonner.tsx
packages/ui/src/components/ui/spinner.tsx
packages/ui/src/components/ui/switch.tsx
packages/ui/src/components/ui/table.tsx
packages/ui/src/components/ui/tabs.tsx
packages/ui/src/components/ui/textarea.tsx
packages/ui/src/components/ui/theme-provider.tsx
packages/ui/src/components/ui/toggle-button.tsx
packages/ui/src/components/ui/toggle-group.tsx
packages/ui/src/components/ui/toggle.tsx
packages/ui/src/components/ui/tooltip.tsx
packages/ui/src/hooks/.gitkeep
packages/ui/src/hooks/use-mobile.ts
packages/ui/src/index.ts
packages/ui/src/lib/.gitkeep
packages/ui/src/lib/utils.ts
packages/ui/src/styles/globals.css
packages/ui/src/utils/index.ts
packages/ui/tsconfig.json
packages/ui/tsconfig.lint.json
packages/ui/vitest.config.ts
packages/ui/vitest.setup.ts
README.md
skills-lock.json
tsconfig.json
turbo.json
vitest.workspace.ts
```

# Files

## File: .eslintrc.js
````javascript
// Root-level ESLint config for a Turborepo workspace.
// App/package lint rules live in each workspace's eslint.config.js.
/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  ignorePatterns: [
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/.turbo/**",
    "**/coverage/**",
  ],
}
````

## File: .npmrc
````

````

## File: .nvmrc
````
20
````

## File: packages/ui/components.json
````json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-luma",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "styles/globals.css",
    "baseColor": "stone",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
````

## File: packages/ui/eslint.config.js
````javascript
import { config } from "@workspace/config/eslint/react-internal"
/** @type {import("eslint").Linter.Config} */
export default config
````

## File: packages/ui/postcss.config.mjs
````javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: { "@tailwindcss/postcss": {} },
}

export default config
````

## File: packages/ui/README.md
````markdown
Remember to wrap your app with the `TooltipProvider` and `ThemeProvider` components.

```tsx title="app/layout.tsx"
import { TooltipProvider } from "@workspace/ui/components/ui/tooltip"
import { ThemeProvider } from "@workspace/ui/components/ui/theme-provider"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```
````

## File: packages/ui/src/components/.gitkeep
````

````

## File: packages/ui/src/components/ui/alert-dialog.tsx
````typescript
"use client"
import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import { cn } from "../../lib/utils"
import { Button } from "./button"
function AlertDialog({ ...props }: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}
function AlertDialogTrigger({ ...props }: AlertDialogPrimitive.Trigger.Props) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}
function AlertDialogPortal({ ...props }: AlertDialogPrimitive.Portal.Props) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}
function AlertDialogOverlay({
  className,
  ...props
}: AlertDialogPrimitive.Backdrop.Props) {
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/30 duration-100 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}
function AlertDialogContent({
  className,
  size = "default",
  ...props
}: AlertDialogPrimitive.Popup.Props & {
  size?: "default" | "sm"
}) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        data-size={size}
        className={cn(
          "group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-6 rounded-4xl bg-popover p-6 text-popover-foreground shadow-xl ring-1 ring-foreground/5 duration-100 outline-none data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-md dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}
function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-6 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]",
        className
      )}
      {...props}
    />
  )
}
function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}
function AlertDialogMedia({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        "mb-2 inline-flex size-16 items-center justify-center rounded-full bg-muted sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-8",
        className
      )}
      {...props}
    />
  )
}
function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        "text-lg font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2",
        className
      )}
      {...props}
    />
  )
}
function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        "text-sm text-balance text-muted-foreground md:text-pretty *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}
function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="alert-dialog-action"
      className={cn(className)}
      {...props}
    />
  )
}
function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  ...props
}: AlertDialogPrimitive.Close.Props &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      className={cn(className)}
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  )
}
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
````

## File: packages/ui/src/components/ui/alert.tsx
````typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-2xl border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}
function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium group-has-[>svg]/alert:col-start-2 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}
function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-balance text-muted-foreground md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
        className
      )}
      {...props}
    />
  )
}
function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-2.5 right-3", className)}
      {...props}
    />
  )
}
export { Alert, AlertTitle, AlertDescription, AlertAction }
````

## File: packages/ui/src/components/ui/avatar.tsx
````typescript
"use client"
import * as React from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { cn } from "../../lib/utils"
function Avatar({
  className,
  size = "default",
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: "default" | "sm" | "lg"
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten",
        className
      )}
      {...props}
    />
  )
}
function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn(
        "aspect-square size-full rounded-full object-cover",
        className
      )}
      {...props}
    />
  )
}
function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground group-data-[size=sm]/avatar:text-xs",
        className
      )}
      {...props}
    />
  )
}
function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground bg-blend-color ring-2 ring-background select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className
      )}
      {...props}
    />
  )
}
function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className
      )}
      {...props}
    />
  )
}
function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className
      )}
      {...props}
    />
  )
}
export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}
````

## File: packages/ui/src/components/ui/badge.tsx
````typescript
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-3xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}
export { Badge, badgeVariants }
````

## File: packages/ui/src/components/ui/breadcrumb.tsx
````typescript
import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cn } from "../../lib/utils"
import { ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"
function Breadcrumb({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="breadcrumb"
      data-slot="breadcrumb"
      className={cn(className)}
      {...props}
    />
  )
}
function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "flex flex-wrap items-center gap-1.5 text-sm wrap-break-word text-muted-foreground sm:gap-2.5",
        className
      )}
      {...props}
    />
  )
}
function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  )
}
function BreadcrumbLink({
  className,
  render,
  ...props
}: useRender.ComponentProps<"a">) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn("transition-colors hover:text-foreground", className),
      },
      props
    ),
    render,
    state: {
      slot: "breadcrumb-link",
    },
  })
}
function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-normal text-foreground", className)}
      {...props}
    />
  )
}
function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRightIcon />}
    </li>
  )
}
function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn(
        "flex size-5 items-center justify-center [&>svg]:size-4",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className="sr-only">More</span>
    </span>
  )
}
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
````

## File: packages/ui/src/components/ui/button-group.tsx
````typescript
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Separator } from "./separator"
const buttonGroupVariants = cva(
  "flex w-fit items-stretch *:focus-visible:relative *:focus-visible:z-10 has-[>[data-slot=button-group]]:gap-2 has-[>[data-variant=outline]]:*:data-[slot=input-group]:border-border has-[>[data-variant=outline]]:*:data-[slot=select-trigger]:border-border has-[>[data-variant=outline]]:[&>[data-slot=input-group]:has(:focus-visible)]:border-ring has-[>[data-variant=outline]]:[&>[data-slot=select-trigger]:focus-visible]:border-ring has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-4xl [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1 has-[>[data-variant=outline]]:[&>input]:border-border has-[>[data-variant=outline]]:[&>input:focus-visible]:border-ring",
  {
    variants: {
      orientation: {
        horizontal:
          "*:data-slot:rounded-r-none [&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-4xl! [&>[data-slot]~[data-slot]]:rounded-l-none [&>[data-slot]~[data-slot]]:border-l-0",
        vertical:
          "flex-col *:data-slot:rounded-b-none [&>[data-slot]:not(:has(~[data-slot]))]:rounded-b-4xl! [&>[data-slot]~[data-slot]]:rounded-t-none [&>[data-slot]~[data-slot]]:border-t-0",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)
function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  )
}
function ButtonGroupText({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          "flex items-center gap-2 rounded-4xl border bg-muted px-2.5 text-sm font-medium [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: "button-group-text",
    },
  })
}
function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        "relative self-stretch bg-input data-horizontal:mx-px data-horizontal:w-auto data-vertical:my-px data-vertical:h-auto",
        className
      )}
      {...props}
    />
  )
}
export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
}
````

## File: packages/ui/src/components/ui/button.tsx
````typescript
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-4xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-transparent dark:hover:bg-input/30",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        xs: "h-6 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        lg: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
export { Button, buttonVariants }
````

## File: packages/ui/src/components/ui/checkbox.tsx
````typescript
"use client"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cn } from "../../lib/utils"
import { CheckIcon } from "lucide-react"
function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[5px] border border-transparent bg-input/90 transition-shadow outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
export { Checkbox }
````

## File: packages/ui/src/components/ui/chip.tsx
````typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
const chipVariants = cva("inline-flex items-center rounded-full font-medium", {
  variants: {
    variant: {
      primary: "bg-primary text-primary-foreground",
      secondary: "bg-muted text-muted-foreground",
    },
    size: {
      sm: "px-2.5 py-0.5 text-xs",
      md: "px-3 py-1 text-sm",
    },
  },
  defaultVariants: {
    variant: "secondary",
    size: "md",
  },
})
function Chip({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof chipVariants>) {
  return (
    <span
      data-slot="chip"
      className={cn(chipVariants({ variant, size }), className)}
      {...props}
    />
  )
}
export { Chip, chipVariants }
````

## File: packages/ui/src/components/ui/collapsible.tsx
````typescript
"use client"
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"
function Collapsible({ ...props }: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}
function CollapsibleTrigger({ ...props }: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
  )
}
function CollapsibleContent({ ...props }: CollapsiblePrimitive.Panel.Props) {
  return (
    <CollapsiblePrimitive.Panel data-slot="collapsible-content" {...props} />
  )
}
export { Collapsible, CollapsibleTrigger, CollapsibleContent }
````

## File: packages/ui/src/components/ui/combobox.tsx
````typescript
"use client"
import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "./input-group"
import { ChevronDownIcon, XIcon, CheckIcon } from "lucide-react"
const Combobox = ComboboxPrimitive.Root
function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />
}
function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      {children}
      <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
    </ComboboxPrimitive.Trigger>
  )
}
function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      render={<InputGroupButton variant="ghost" size="icon-xs" />}
      className={cn(className)}
      {...props}
    >
      <XIcon className="pointer-events-none" />
    </ComboboxPrimitive.Clear>
  )
}
function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean
  showClear?: boolean
}) {
  return (
    <InputGroup className={cn("w-auto", className)}>
      <ComboboxPrimitive.Input
        render={<InputGroupInput disabled={disabled} />}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            render={<ComboboxTrigger />}
            data-slot="input-group-button"
            className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
            disabled={disabled}
          />
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  )
}
function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    "side" | "align" | "sideOffset" | "alignOffset" | "anchor"
  >) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn(
            "group/combobox-content relative max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] origin-(--transform-origin) overflow-hidden rounded-3xl bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/5 duration-100 data-[chips=true]:min-w-(--anchor-width) data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 *:data-[slot=input-group]:m-1.5 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-8 *:data-[slot=input-group]:border-input/30 *:data-[slot=input-group]:bg-input/50 *:data-[slot=input-group]:shadow-none dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}
function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        "no-scrollbar max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1.5 overflow-y-auto overscroll-contain p-1.5 data-empty:p-0",
        className
      )}
      {...props}
    />
  )
}
function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2.5 rounded-2xl py-2 pr-8 pl-3 text-sm font-medium outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  )
}
function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn(className)}
      {...props}
    />
  )
}
function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn("px-3 py-2.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}
function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  )
}
function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "hidden w-full justify-center py-2 text-center text-sm text-muted-foreground group-data-empty/combobox-content:flex",
        className
      )}
      {...props}
    />
  )
}
function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn("-mx-1.5 my-1.5 h-px bg-border", className)}
      {...props}
    />
  )
}
function ComboboxChips({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> &
  ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        "flex min-h-9 flex-wrap items-center gap-1.5 rounded-3xl border border-transparent bg-input/50 bg-clip-padding px-3 py-1.5 text-sm transition-[color,box-shadow,background-color] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 has-data-[slot=combobox-chip]:px-1.5 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}
function ComboboxChip({
  className,
  children,
  showRemove = true,
  ...props
}: ComboboxPrimitive.Chip.Props & {
  showRemove?: boolean
}) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        "flex h-[calc(--spacing(5.5))] w-fit items-center justify-center gap-1 rounded-3xl bg-input px-2 text-xs font-medium whitespace-nowrap text-foreground has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-[slot=combobox-chip-remove]:pr-0 dark:bg-input/60",
        className
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          render={<Button variant="ghost" size="icon-xs" />}
          className="-ml-1 opacity-50 hover:opacity-100"
          data-slot="combobox-chip-remove"
        >
          <XIcon className="pointer-events-none" />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  )
}
function ComboboxChipsInput({
  className,
  ...props
}: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-chip-input"
      className={cn("min-w-16 flex-1 outline-none", className)}
      {...props}
    />
  )
}
function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null)
}
export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
}
````

## File: packages/ui/src/components/ui/command.tsx
````typescript
"use client"
import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { cn } from "../../lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import { InputGroup, InputGroupAddon } from "./input-group"
import { SearchIcon, CheckIcon } from "lucide-react"
function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-4xl bg-popover p-1 text-popover-foreground",
        className
      )}
      {...props}
    />
  )
}
function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
  children: React.ReactNode
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn(
          "top-1/3 translate-y-0 overflow-hidden rounded-4xl! p-0",
          className
        )}
        showCloseButton={showCloseButton}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}
function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="h-9 bg-input/50">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <InputGroupAddon>
          <SearchIcon className="size-4 shrink-0 opacity-50" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
        className
      )}
      {...props}
    />
  )
}
function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    />
  )
}
function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1.5 text-foreground **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("my-1.5 h-px bg-border/50", className)}
      {...props}
    />
  )
}
function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex cursor-default items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium outline-hidden select-none in-data-[slot=dialog-content]:rounded-3xl data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-muted data-selected:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:*:[svg]:text-foreground",
        className
      )}
      {...props}
    >
      {children}
      <CheckIcon className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  )
}
function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-data-selected/command-item:text-foreground",
        className
      )}
      {...props}
    />
  )
}
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
````

## File: packages/ui/src/components/ui/dialog.tsx
````typescript
"use client"
import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { XIcon } from "lucide-react"
function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}
function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}
function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}
function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}
function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/30 duration-100 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}
function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-6 rounded-4xl bg-popover p-6 text-sm text-popover-foreground shadow-xl ring-1 ring-foreground/5 duration-100 outline-none sm:max-w-md dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-4 right-4 bg-secondary"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  )
}
function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}
function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-base leading-none font-medium", className)}
      {...props}
    />
  )
}
function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
````

## File: packages/ui/src/components/ui/drawer.tsx
````typescript
"use client"
import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"
import { cn } from "../../lib/utils"
function Drawer({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />
}
function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}
function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}
function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}
function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/30 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}
function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "group/drawer-content fixed z-50 flex h-auto flex-col bg-transparent p-4 text-sm before:absolute before:inset-2 before:-z-10 before:rounded-4xl before:border before:border-border before:bg-popover before:shadow-xl data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=left]:sm:max-w-sm data-[vaul-drawer-direction=right]:sm:max-w-sm",
          className
        )}
        {...props}
      >
        <div className="mx-auto mt-4 hidden h-1.5 w-[100px] shrink-0 rounded-full bg-muted group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}
function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left",
        className
      )}
      {...props}
    />
  )
}
function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}
function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-base font-medium text-foreground", className)}
      {...props}
    />
  )
}
function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}
export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
````

## File: packages/ui/src/components/ui/dropdown-menu.tsx
````typescript
"use client"
import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { cn } from "../../lib/utils"
import { ChevronRightIcon, CheckIcon } from "lucide-react"
function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}
function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
}
function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}
function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "z-50 max-h-(--available-height) w-(--anchor-width) min-w-48 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-3xl bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/5 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}
function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}
function DropdownMenuLabel({
  className,
  inset,
  ...props
}: MenuPrimitive.GroupLabel.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-3 py-2.5 text-xs text-muted-foreground data-inset:pl-9.5",
        className
      )}
      {...props}
    />
  )
}
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/dropdown-menu-item relative flex cursor-default items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-medium outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-9.5 data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive dark:data-[variant=destructive]:focus:bg-destructive/20 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-[variant=destructive]:*:[svg]:text-destructive",
        className
      )}
      {...props}
    />
  )
}
function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}
function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex cursor-default items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-inset:pl-9.5 data-popup-open:bg-accent data-popup-open:text-accent-foreground data-open:bg-accent data-open:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
    </MenuPrimitive.SubmenuTrigger>
  )
}
function DropdownMenuSubContent({
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "w-auto min-w-36 rounded-3xl bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/5 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        className
      )}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  )
}
function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: MenuPrimitive.CheckboxItem.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-2.5 rounded-2xl py-2 pr-8 pl-3 text-sm font-medium outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-9.5 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      checked={checked}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}
function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return (
    <MenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}
function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: MenuPrimitive.RadioItem.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-default items-center gap-2.5 rounded-2xl py-2 pr-8 pl-3 text-sm font-medium outline-hidden select-none focus:bg-accent focus:text-accent-foreground focus:**:text-accent-foreground data-inset:pl-9.5 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <MenuPrimitive.RadioItemIndicator>
          <CheckIcon />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  )
}
function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1.5 my-1.5 h-px bg-border/50", className)}
      {...props}
    />
  )
}
function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}
export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
````

## File: packages/ui/src/components/ui/empty.tsx
````typescript
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-2xl border-dashed p-12 text-center text-balance",
        className
      )}
      {...props}
    />
  )
}
function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex max-w-sm flex-col items-center gap-2", className)}
      {...props}
    />
  )
}
const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  )
}
function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-title"
      className={cn("text-lg font-medium tracking-tight", className)}
      {...props}
    />
  )
}
function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "text-sm/relaxed text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className
      )}
      {...props}
    />
  )
}
function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance",
        className
      )}
      {...props}
    />
  )
}
export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
}
````

## File: packages/ui/src/components/ui/field.tsx
````typescript
"use client"
import { useMemo } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Label } from "./label"
import { Separator } from "./separator"
function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-6 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className
      )}
      {...props}
    />
  )
}
function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-3 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base",
        className
      )}
      {...props}
    />
  )
}
function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4",
        className
      )}
      {...props}
    />
  )
}
const fieldVariants = cva(
  "group/field flex w-full gap-3 data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)
function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  )
}
function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        "group/field-content flex flex-1 flex-col gap-1 leading-snug",
        className
      )}
      {...props}
    />
  )
}
function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50 has-data-checked:bg-input/30 has-[>[data-slot=field]]:rounded-2xl has-[>[data-slot=field]]:border *:data-[slot=field]:p-4",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
        className
      )}
      {...props}
    />
  )
}
function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-sm font-medium group-data-[disabled=true]/field:opacity-50",
        className
      )}
      {...props}
    />
  )
}
function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-left text-sm leading-normal font-normal text-muted-foreground group-has-data-horizontal/field:text-balance [[data-variant=legend]+&]:-mt-1.5",
        "last:mt-0 nth-last-2:-mt-1",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className
      )}
      {...props}
    />
  )
}
function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",
        className
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  )
}
function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>
}) {
  const content = useMemo(() => {
    if (children) {
      return children
    }
    if (!errors?.length) {
      return null
    }
    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ]
    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message
    }
    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>
        )}
      </ul>
    )
  }, [children, errors])
  if (!content) {
    return null
  }
  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-sm font-normal text-destructive", className)}
      {...props}
    >
      {content}
    </div>
  )
}
export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
}
````

## File: packages/ui/src/components/ui/input-group.tsx
````typescript
"use client"
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Input } from "./input"
import { Textarea } from "./textarea"
function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group relative flex h-9 w-full min-w-0 items-center rounded-4xl border border-transparent bg-input/50 transition-[color,box-shadow,background-color] outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-data-[align=block-end]:rounded-3xl has-data-[align=block-start]:rounded-3xl has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/30 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[textarea]:rounded-2xl has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5",
        className
      )}
      {...props}
    />
  )
}
const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-2 text-sm font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 **:data-[slot=kbd]:rounded-3xl **:data-[slot=kbd]:bg-muted-foreground/10 **:data-[slot=kbd]:px-1.5 [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start": "order-first pl-3 has-[>button]:-ml-1 has-[>kbd]:-ml-1",
        "inline-end": "order-last pr-3 has-[>button]:-mr-1 has-[>kbd]:-mr-1",
        "block-start":
          "order-first w-full justify-start px-3 pt-3 group-has-[>input]/input-group:pt-3.5 [.border-b]:pb-3.5",
        "block-end":
          "order-last w-full justify-start px-3 pb-3 group-has-[>input]/input-group:pb-3.5 [.border-t]:pt-3.5",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  }
)
function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus()
      }}
      {...props}
    />
  )
}
const inputGroupButtonVariants = cva(
  "flex items-center gap-2 rounded-4xl text-sm shadow-none",
  {
    variants: {
      size: {
        xs: "h-6 gap-1 rounded-xl px-1.5 [&>svg:not([class*='size-'])]:size-3.5",
        sm: "",
        "icon-xs": "size-6 rounded-xl p-0 has-[>svg]:p-0",
        "icon-sm": "size-8 p-0 has-[>svg]:p-0",
      },
    },
    defaultVariants: {
      size: "xs",
    },
  }
)
function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "type"> &
  VariantProps<typeof inputGroupButtonVariants> & {
    type?: "button" | "submit" | "reset"
  }) {
  return (
    <Button
      type={type}
      data-size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  )
}
function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}
function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent",
        className
      )}
      {...props}
    />
  )
}
function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-2.5 shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent",
        className
      )}
      {...props}
    />
  )
}
export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
}
````

## File: packages/ui/src/components/ui/input.tsx
````typescript
import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "../../lib/utils"
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-base transition-[color,box-shadow,background-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}
export { Input }
````

## File: packages/ui/src/components/ui/item.tsx
````typescript
import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Separator } from "./separator"
function ItemGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="list"
      data-slot="item-group"
      className={cn(
        "group/item-group flex w-full flex-col gap-4 has-data-[size=sm]:gap-2.5 has-data-[size=xs]:gap-2",
        className
      )}
      {...props}
    />
  )
}
function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      className={cn("my-2", className)}
      {...props}
    />
  )
}
const itemVariants = cva(
  "group/item flex w-full flex-wrap items-center rounded-2xl border text-sm transition-colors duration-100 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [a]:transition-colors [a]:hover:bg-muted",
  {
    variants: {
      variant: {
        default: "border-transparent",
        outline: "border-border",
        muted: "border-transparent bg-muted/50",
      },
      size: {
        default: "gap-3.5 px-4 py-3.5",
        sm: "gap-3.5 px-3.5 py-3",
        xs: "gap-2.5 px-3 py-2.5 in-data-[slot=dropdown-menu-content]:p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
function Item({
  className,
  variant = "default",
  size = "default",
  render,
  ...props
}: useRender.ComponentProps<"div"> & VariantProps<typeof itemVariants>) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(itemVariants({ variant, size, className })),
      },
      props
    ),
    render,
    state: {
      slot: "item",
      variant,
      size,
    },
  })
}
const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 group-has-data-[slot=item-description]/item:translate-y-0.5 group-has-data-[slot=item-description]/item:self-start [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "[&_svg:not([class*='size-'])]:size-4",
        image:
          "size-10 overflow-hidden rounded-xl group-data-[size=sm]/item:size-8 group-data-[size=xs]/item:size-6 group-data-[size=xs]/item:rounded-lg [&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
function ItemMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant, className }))}
      {...props}
    />
  )
}
function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn(
        "flex flex-1 flex-col gap-1 group-data-[size=xs]/item:gap-0.5 [&+[data-slot=item-content]]:flex-none",
        className
      )}
      {...props}
    />
  )
}
function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn(
        "line-clamp-1 flex w-fit items-center gap-2 text-sm leading-snug font-medium underline-offset-4",
        className
      )}
      {...props}
    />
  )
}
function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        "line-clamp-2 text-left text-sm font-normal text-muted-foreground [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary",
        className
      )}
      {...props}
    />
  )
}
function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}
function ItemHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-header"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}
function ItemFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-footer"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}
export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
}
````

## File: packages/ui/src/components/ui/kbd.tsx
````typescript
import { cn } from "../../lib/utils"
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5.5 w-fit min-w-5.5 items-center justify-center gap-1 rounded-lg bg-muted px-1.5 font-sans text-xs font-medium text-muted-foreground select-none in-data-[slot=input-group]:bg-input in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10 [&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    />
  )
}
function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}
export { Kbd, KbdGroup }
````

## File: packages/ui/src/components/ui/label.tsx
````typescript
"use client"
import * as React from "react"
import { cn } from "../../lib/utils"
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}
export { Label }
````

## File: packages/ui/src/components/ui/pagination.tsx
````typescript
import * as React from "react"
import { cn } from "../../lib/utils"
import { Button } from "./button"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react"
function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  )
}
function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  )
}
function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}
type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">
function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant={isActive ? "outline" : "ghost"}
      size={size}
      className={cn(className)}
      nativeButton={false}
      render={
        <a
          aria-current={isActive ? "page" : undefined}
          data-slot="pagination-link"
          data-active={isActive}
          {...props}
        />
      }
    />
  )
}
function PaginationPrevious({
  className,
  text = "Previous",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("pl-2!", className)}
      {...props}
    >
      <ChevronLeftIcon data-icon="inline-start" />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  )
}
function PaginationNext({
  className,
  text = "Next",
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("pr-2!", className)}
      {...props}
    >
      <span className="hidden sm:block">{text}</span>
      <ChevronRightIcon data-icon="inline-end" />
    </PaginationLink>
  )
}
function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex size-9 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className="sr-only">More pages</span>
    </span>
  )
}
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
````

## File: packages/ui/src/components/ui/popover.tsx
````typescript
"use client"
import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "../../lib/utils"
function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}
function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}
function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "z-50 flex w-72 origin-(--transform-origin) flex-col gap-4 rounded-3xl bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/5 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}
function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-1 text-sm", className)}
      {...props}
    />
  )
}
function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("text-base font-medium", className)}
      {...props}
    />
  )
}
function PopoverDescription({
  className,
  ...props
}: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
}
export {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}
````

## File: packages/ui/src/components/ui/progress-bar.tsx
````typescript
"use client"
import * as React from "react"
import { Progress, ProgressTrack, ProgressIndicator } from "./progress"
import { cn } from "../../lib/utils"
function ProgressBar({
  value,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { value: number }) {
  return (
    <Progress value={value} className={cn(className)} {...props}>
      {children}
    </Progress>
  )
}
function ProgressBarTrack({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <ProgressTrack className={cn(className)} {...props}>
      {children}
    </ProgressTrack>
  )
}
function ProgressBarFill({ className, ...props }: React.ComponentProps<"div">) {
  return <ProgressIndicator className={cn(className)} {...props} />
}
ProgressBar.Track = ProgressBarTrack
ProgressBar.Fill = ProgressBarFill
export { ProgressBar }
````

## File: packages/ui/src/components/ui/progress.tsx
````typescript
"use client"
import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cn } from "../../lib/utils"
function Progress({
  className,
  children,
  value,
  ...props
}: ProgressPrimitive.Root.Props) {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn("flex flex-wrap gap-3", className)}
      {...props}
    >
      {children}
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  )
}
function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      className={cn(
        "relative flex h-3 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      data-slot="progress-track"
      {...props}
    />
  )
}
function ProgressIndicator({
  className,
  ...props
}: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn("h-full bg-primary transition-all", className)}
      {...props}
    />
  )
}
function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      className={cn("text-sm font-medium", className)}
      data-slot="progress-label"
      {...props}
    />
  )
}
function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn(
        "ml-auto text-sm text-muted-foreground tabular-nums",
        className
      )}
      data-slot="progress-value"
      {...props}
    />
  )
}
export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
}
````

## File: packages/ui/src/components/ui/radio-group.tsx
````typescript
"use client"
import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { cn } from "../../lib/utils"
function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid w-full gap-3", className)}
      {...props}
    />
  )
}
function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        "group/radio-group-item peer relative flex aspect-square size-4 shrink-0 rounded-full border border-transparent bg-input/90 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
        className
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-4 items-center justify-center"
      >
        <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground dark:size-2.5" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  )
}
export { RadioGroup, RadioGroupItem }
````

## File: packages/ui/src/components/ui/scroll-area.tsx
````typescript
"use client"
import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"
import { cn } from "../../lib/utils"
function ScrollArea({
  className,
  children,
  ...props
}: ScrollAreaPrimitive.Root.Props) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}
function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}
export { ScrollArea, ScrollBar }
````

## File: packages/ui/src/components/ui/select.tsx
````typescript
"use client"
import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"
import { cn } from "../../lib/utils"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"
const Select = SelectPrimitive.Root
function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1.5 p-1.5", className)}
      {...props}
    />
  )
}
function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      {...props}
    />
  )
}
function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-1.5 rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow,background-color] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
        }
      />
    </SelectPrimitive.Trigger>
  )
}
function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn(
            "relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-3xl bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/5 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}
function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-3 py-2.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}
function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-2.5 rounded-2xl py-2 pr-8 pl-3 text-sm font-medium outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}
function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "pointer-events-none -mx-1.5 my-1.5 h-px bg-border",
        className
      )}
      {...props}
    />
  )
}
function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon />
    </SelectPrimitive.ScrollUpArrow>
  )
}
function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon />
    </SelectPrimitive.ScrollDownArrow>
  )
}
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
````

## File: packages/ui/src/components/ui/separator.tsx
````typescript
"use client"
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cn } from "../../lib/utils"
function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}
export { Separator }
````

## File: packages/ui/src/components/ui/skeleton.tsx
````typescript
import { cn } from "../../lib/utils"
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-2xl bg-muted", className)}
      {...props}
    />
  )
}
export { Skeleton }
````

## File: packages/ui/src/components/ui/slider.tsx
````typescript
import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "../../lib/utils"
function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: SliderPrimitive.Root.Props) {
  const _values = Array.isArray(value)
    ? value
    : Array.isArray(defaultValue)
      ? defaultValue
      : [min, max]
  return (
    <SliderPrimitive.Root
      className={cn("data-horizontal:w-full data-vertical:h-full", className)}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-vertical:h-full data-vertical:min-h-40 data-vertical:w-auto data-vertical:flex-col">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative grow overflow-hidden rounded-full bg-input/90 select-none data-horizontal:h-2 data-horizontal:w-full data-vertical:h-full data-vertical:w-2"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="bg-primary select-none data-horizontal:h-full data-vertical:w-full"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: _values.length }, (_, index) => (
          <SliderPrimitive.Thumb
            data-slot="slider-thumb"
            key={index}
            className="block h-4 w-6 shrink-0 rounded-full bg-white shadow-md ring-1 ring-black/10 transition-[color,box-shadow,background-color] select-none not-dark:bg-clip-padding hover:ring-4 hover:ring-ring/30 focus-visible:ring-4 focus-visible:ring-ring/30 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 data-vertical:h-6 data-vertical:w-4"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}
export { Slider }
````

## File: packages/ui/src/components/ui/spinner.tsx
````typescript
import { cn } from "../../lib/utils"
import { Loader2Icon } from "lucide-react"
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}
export { Spinner }
````

## File: packages/ui/src/components/ui/switch.tsx
````typescript
"use client"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "../../lib/utils"
function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border-2 transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-5 data-[size=default]:w-11 data-[size=sm]:h-4 data-[size=sm]:w-7 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-unchecked:border-transparent data-unchecked:bg-input/90 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-background shadow-sm ring-0 transition-transform not-dark:bg-clip-padding group-data-[size=default]/switch:h-4 group-data-[size=default]/switch:w-6 group-data-[size=sm]/switch:h-3 group-data-[size=sm]/switch:w-4 data-checked:translate-x-[calc(100%-8px)] dark:data-checked:bg-primary-foreground data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground"
      />
    </SwitchPrimitive.Root>
  )
}
export { Switch }
````

## File: packages/ui/src/components/ui/table.tsx
````typescript
"use client"
import * as React from "react"
import { cn } from "../../lib/utils"
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}
function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}
function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-12 px-3 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}
function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-3 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}
function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
````

## File: packages/ui/src/components/ui/tabs.tsx
````typescript
"use client"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}
const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-full p-1 text-muted-foreground group-data-horizontal/tabs:h-9 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col group-data-vertical/tabs:rounded-2xl data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}
function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-2 rounded-full border border-transparent! px-3 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-vertical/tabs:rounded-2xl group-data-vertical/tabs:px-3 group-data-vertical/tabs:py-1.5 hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}
function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}
export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
````

## File: packages/ui/src/components/ui/textarea.tsx
````typescript
import * as React from "react"
import { cn } from "../../lib/utils"
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full resize-none rounded-2xl border border-transparent bg-input/50 px-3 py-3 text-base transition-[color,box-shadow,background-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}
export { Textarea }
````

## File: packages/ui/src/components/ui/theme-provider.tsx
````typescript
"use client"
import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeHotkey />
      {children}
    </NextThemesProvider>
  )
}
function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}
function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }
      if (event.key.toLowerCase() !== "d") {
        return
      }
      if (isTypingTarget(event.target)) {
        return
      }
      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [resolvedTheme, setTheme])
  return null
}
export { ThemeProvider }
````

## File: packages/ui/src/components/ui/toggle-button.tsx
````typescript
"use client"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cn } from "../../lib/utils"
interface ToggleButtonProps extends Omit<
  TogglePrimitive.Props,
  "pressed" | "onPressedChange"
> {
  isSelected: boolean
  onChange: () => void
}
function ToggleButton({
  isSelected,
  onChange,
  className,
  children,
  ...props
}: ToggleButtonProps) {
  return (
    <TogglePrimitive
      data-slot="toggle-button"
      pressed={isSelected}
      onPressedChange={() => onChange()}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-border px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors outline-none select-none",
        "text-muted-foreground hover:text-foreground",
        "data-pressed:border-primary data-pressed:bg-primary data-pressed:text-primary-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring/30",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  )
}
export { ToggleButton }
````

## File: packages/ui/src/components/ui/toggle-group.tsx
````typescript
"use client"
import * as React from "react"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { toggleVariants } from "./toggle"
const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
  }
>({
  size: "default",
  variant: "default",
  spacing: 0,
  orientation: "horizontal",
})
function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  orientation = "horizontal",
  children,
  ...props
}: ToggleGroupPrimitive.Props &
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
  }) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-orientation={orientation}
      style={{ "--gap": spacing } as React.CSSProperties}
      className={cn(
        "group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] data-[spacing=0]:data-[variant=outline]:rounded-3xl data-vertical:flex-col data-vertical:items-stretch",
        className
      )}
      {...props}
    >
      <ToggleGroupContext.Provider
        value={{ variant, size, spacing, orientation }}
      >
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  )
}
function ToggleGroupItem({
  className,
  children,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        "shrink-0 group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-3 group-data-[spacing=0]/toggle-group:shadow-none focus:z-10 focus-visible:z-10 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-end]:pr-2.5 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-start]:pl-2.5 group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-3xl group-data-vertical/toggle-group:data-[spacing=0]:first:rounded-t-3xl group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-3xl group-data-vertical/toggle-group:data-[spacing=0]:last:rounded-b-3xl data-[state=on]:bg-muted group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:border-l-0 group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:border-t-0 group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-l group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-t",
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  )
}
export { ToggleGroup, ToggleGroupItem }
````

## File: packages/ui/src/components/ui/toggle.tsx
````typescript
"use client"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
const toggleVariants = cva(
  "group/toggle inline-flex items-center justify-center gap-1 rounded-3xl text-sm font-medium whitespace-nowrap transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-pressed:bg-muted dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent hover:bg-muted",
      },
      size: {
        default:
          "h-9 min-w-9 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        sm: "h-8 min-w-8 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        lg: "h-10 min-w-10 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}
export { Toggle, toggleVariants }
````

## File: packages/ui/src/components/ui/tooltip.tsx
````typescript
"use client"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { cn } from "../../lib/utils"
function TooltipProvider({
  delay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  )
}
function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}
function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}
function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-xl bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-lg data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:translate-x-[1.5px] data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:translate-x-[-1.5px] data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:translate-x-[-1.5px] data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:translate-x-[1.5px] data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
````

## File: packages/ui/src/hooks/.gitkeep
````

````

## File: packages/ui/src/index.ts
````typescript
export { cn } from "./lib/utils"
````

## File: packages/ui/src/lib/.gitkeep
````

````

## File: packages/ui/src/lib/utils.ts
````typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
````

## File: packages/ui/src/utils/index.ts
````typescript
export { cn } from "../lib/utils"
````

## File: packages/ui/tsconfig.json
````json
{
  "extends": "@workspace/config/typescript/react-library.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["."],
  "exclude": ["node_modules", "dist", "**/*.stories.tsx", "**/*.stories.ts"]
}
````

## File: packages/ui/tsconfig.lint.json
````json
{
  "extends": "@workspace/config/typescript/react-library.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src", "turbo"],
  "exclude": ["node_modules", "dist"]
}
````

## File: packages/ui/vitest.setup.ts
````typescript
import "@testing-library/jest-dom/vitest"
import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"
afterEach(() => {
  cleanup()
})
````

## File: tsconfig.json
````json
{
  "extends": "@workspace/config/typescript/base.json"
}
````

## File: .env.docker.example
````
# Copy this file to .env.docker and replace the placeholder values before
# running docker compose. Do not commit .env.docker.
RUSTFS_ACCESS_KEY=replace-with-local-access-key
RUSTFS_SECRET_KEY=replace-with-local-secret-key
````

## File: .prettierrc.json
````json
{
  "endOfLine": "lf",
  "semi": false,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
````

## File: apps/web/.gitignore
````
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
````

## File: apps/web/CLAUDE.md
````markdown
@AGENTS.md
````

## File: apps/web/src/app/courses/[id]/not-found.tsx
````typescript
import Link from "next/link"
import { Button } from "@workspace/ui/components/ui/button"
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-8rem)] max-w-[720px] flex-col items-start justify-center gap-5 px-5 py-16 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-2xl/8 font-bold tracking-normal">
          코스를 찾을 수 없습니다
        </h1>
        <p className="m-0 max-w-md text-base/7 text-muted-foreground">
          요청한 코스가 없거나 아직 공개되지 않았습니다. 전체 코스 목록에서 다시
          선택해 주세요.
        </p>
      </div>
      <Button nativeButton={false} render={<Link href="/courses" />}>
        코스 목록으로 돌아가기
      </Button>
    </div>
  )
}
````

## File: apps/web/src/app/courses/[id]/page.tsx
````typescript
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import {
  getCourseDetailById,
  getCourseDetailStaticParams,
} from "@/features/courses/course-detail-data"
import { CourseDetailPage } from "@/features/courses/course-detail-page"
type CoursePageProps = {
  params: Promise<{ id: string }>
}
export function generateStaticParams() {
  return getCourseDetailStaticParams()
}
export async function generateMetadata({
  params,
}: CoursePageProps): Promise<Metadata> {
  const { id } = await params
  const course = getCourseDetailById(id)
  if (!course) {
    return {
      title: "코스를 찾을 수 없습니다 — 한글쓰기",
    }
  }
  return {
    title: `${course.title} — 한글쓰기`,
    description: course.description,
  }
}
export default async function Page({ params }: CoursePageProps) {
  const { id } = await params
  const course = getCourseDetailById(id)
  if (!course) {
    notFound()
  }
  return <CourseDetailPage course={course} />
}
````

## File: apps/web/src/app/courses/page.tsx
````typescript
import type { Metadata } from "next"
import { CoursesPage } from "@/features/courses/courses-page"
export const metadata: Metadata = {
  title: "배우기 — 한글쓰기",
  description:
    "체계적인 커리큘럼으로 한국어 글쓰기 실력을 키워보세요. 문장 구조, 문법, 에세이, 비즈니스 글쓰기까지 다양한 코스를 탐색하세요.",
}
export default function Page() {
  return <CoursesPage />
}
````

## File: apps/web/src/app/home/page.tsx
````typescript
import { HomePage } from "@/features/home/home-page"
export default function Page() {
  return <HomePage />
}
````

## File: apps/web/src/app/lesson/not-found.tsx
````typescript
import Link from "next/link"
import { Button } from "@workspace/ui/components/ui/button"
export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-6 text-foreground">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <h1 className="m-0 text-2xl/8 font-bold tracking-normal">
          레슨을 찾을 수 없습니다
        </h1>
        <p className="m-0 text-sm/6 text-muted-foreground">
          요청한 레슨이 없거나 아직 연결되지 않았습니다. 코스 목록에서 다시
          선택해주세요.
        </p>
        <Button nativeButton={false} render={<Link href="/courses" />}>
          코스 목록으로 돌아가기
        </Button>
      </div>
    </div>
  )
}
````

## File: apps/web/src/components/layout/global-nav.tsx
````typescript
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@workspace/ui/components/ui/button"
import {
  BookOpenIcon,
  HomeIcon,
  LogoIcon,
  SearchIcon,
  UserIcon,
  type LucideIcon,
} from "@workspace/ui/components/icons"
import { cn } from "@workspace/ui/lib/utils"
interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  id: string
}
const primaryNavItems: NavItem[] = [
  {
    href: "/",
    label: "홈",
    icon: HomeIcon,
    id: "nav-home",
  },
  {
    href: "/courses",
    label: "배우기",
    icon: BookOpenIcon,
    id: "nav-courses",
  },
]
const profileNavItem: NavItem = {
  href: "/profile",
  label: "프로필",
  icon: UserIcon,
  id: "nav-profile",
}
const mobileNavItems: NavItem[] = [...primaryNavItems, profileNavItem]
function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/" || pathname === "/home"
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
export function GlobalNav() {
  const pathname = usePathname()
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 hidden h-14 border-b border-border/70 bg-background/95 backdrop-blur-xl md:block">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-8 px-6">
          <div className="flex flex-1 items-center gap-8">
            <Link
              href="/"
              className="flex shrink-0 items-center text-primary transition-opacity hover:opacity-80"
              aria-label="홈으로 이동"
              id="header-logo"
            >
              <LogoIcon className="size-7" aria-hidden="true" />
            </Link>
            <nav className="flex items-center gap-1" aria-label="주요 메뉴">
              {primaryNavItems.map((item) => {
                const Icon = item.icon
                const active = isActivePath(pathname, item.href)
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    id={item.id}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      active && "bg-muted font-semibold text-foreground"
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon
                      className="size-5"
                      strokeWidth={active ? 2.5 : 2}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="검색"
              id="header-search-btn"
            >
              <SearchIcon aria-hidden="true" />
            </Button>
            <Link
              href="/profile"
              className={cn(
                "flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                isActivePath(pathname, "/profile") && "text-foreground"
              )}
              aria-label="프로필"
              aria-current={
                isActivePath(pathname, "/profile") ? "page" : undefined
              }
              id="header-profile-btn"
            >
              <UserIcon className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(4rem+env(safe-area-inset-bottom))] border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        aria-label="하단 메뉴"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon
          const active = isActivePath(pathname, item.href)
          return (
            <Link
              key={item.id}
              href={item.href}
              id={`bottom-${item.id}`}
              className={cn(
                "group relative flex flex-1 flex-col items-center justify-center gap-1 p-2 text-muted-foreground transition-colors hover:text-foreground",
                active && "text-foreground"
              )}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative flex size-7 items-center justify-center transition-transform group-active:scale-95">
                <Icon
                  className="size-5"
                  strokeWidth={active ? 2.5 : 2}
                  aria-hidden="true"
                />
                {active ? (
                  <span className="absolute top-0 size-1 rounded-full bg-primary" />
                ) : null}
              </span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
````

## File: apps/web/src/features/courses/course-card.tsx
````typescript
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@workspace/ui/components/ui/card"
import { BookOpenIcon } from "@workspace/ui/components/icons"
import type { Course } from "@/features/courses/course-data"
interface CourseCardProps {
  course: Course
}
export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className="group block h-full rounded-3xl outline-none transition-transform active:scale-[0.99] focus-visible:ring-3 focus-visible:ring-ring/30"
      aria-label={`${course.title} — 레슨 ${course.lessonCount}개`}
      id={`course-card-${course.id}`}
    >
      <Card
        variant="filled"
        size="sm"
        className="h-full gap-0 rounded-3xl bg-transparent py-0 transition-colors group-hover:bg-muted/60"
      >
        <div className="relative aspect-[3/2] overflow-hidden rounded-2xl bg-muted">
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 559px) calc(100vw - 32px), (max-width: 899px) calc((100vw - 72px) / 2), 352px"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        </div>
        <CardContent className="flex flex-1 flex-col gap-1.5 px-1 pt-4 pb-2">
          <h3 className="m-0 line-clamp-2 text-base/6 font-bold tracking-normal transition-colors group-hover:text-primary md:text-lg/7">
            {course.title}
          </h3>
          <div className="flex items-center gap-1 text-[13px]/5 font-semibold text-muted-foreground">
            <BookOpenIcon className="size-3.5 opacity-70" aria-hidden="true" />
            <span>{course.lessonCount}개 레슨</span>
          </div>
          <p className="m-0 line-clamp-3 text-sm/6 text-muted-foreground">
            {course.description}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
````

## File: apps/web/src/features/courses/course-curriculum.tsx
````typescript
"use client"
import { useState } from "react"
import Link from "next/link"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/ui/collapsible"
import { Separator } from "@workspace/ui/components/ui/separator"
import {
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleIcon,
} from "@workspace/ui/components/icons"
import { cn } from "@workspace/ui/lib/utils"
import type {
  CourseChapter,
  CourseDetail,
  CourseLesson,
  CourseChapterId,
} from "@/features/courses/course-detail-data"
interface CourseCurriculumProps {
  course: CourseDetail
}
export function CourseCurriculum({ course }: CourseCurriculumProps) {
  const [openChapterIds, setOpenChapterIds] = useState<
    readonly CourseChapterId[]
  >(() => [getInitialOpenChapterId(course.chapters)])
  function setChapterOpen(chapterId: CourseChapterId, open: boolean) {
    setOpenChapterIds((current) => {
      if (open) {
        return current.includes(chapterId) ? current : [...current, chapterId]
      }
      return current.filter(
        (currentChapterId) => currentChapterId !== chapterId
      )
    })
  }
  return (
    <section className="w-full" aria-labelledby="course-curriculum-title">
      <div className="mb-10 flex items-baseline justify-between gap-4 px-1">
        <h2
          id="course-curriculum-title"
          className="m-0 text-xl/7 font-semibold tracking-normal"
        >
          커리큘럼
        </h2>
        <span className="shrink-0 text-sm font-medium text-muted-foreground">
          총 {course.chapters.length}단원 · {course.progress.totalLessons}레슨
        </span>
      </div>
      <div className="flex flex-col">
        {course.chapters.map((chapter, index) => {
          const open = openChapterIds.includes(chapter.id)
          const completedLessons = chapter.lessons.filter(
            (lesson) => lesson.completed
          ).length
          const complete = completedLessons === chapter.lessons.length
          return (
            <Collapsible
              key={chapter.id}
              open={open}
              onOpenChange={(nextOpen) => setChapterOpen(chapter.id, nextOpen)}
              className="flex flex-col"
            >
              {index > 0 ? <Separator className="opacity-50" /> : null}
              <article className="mb-8 sm:mb-0">
                <CollapsibleTrigger className="flex min-h-16 w-full items-center justify-between rounded-3xl border-0 bg-transparent px-1 py-3 text-left font-[inherit] text-inherit transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.998] sm:p-6">
                  <span className="flex min-w-0 flex-col gap-1.5">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      {chapter.label}
                    </span>
                    <span className="truncate text-lg/7 font-semibold tracking-normal text-foreground">
                      {chapter.title}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-4">
                    <ChapterStatus
                      complete={complete}
                      completedLessons={completedLessons}
                      totalLessons={chapter.lessons.length}
                    />
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full text-muted-foreground transition-transform duration-300",
                        open && "rotate-180"
                      )}
                      aria-hidden="true"
                    >
                      <ChevronDownIcon className="size-5" />
                    </span>
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent
                  keepMounted
                  className="overflow-hidden transition-[height,opacity] duration-300 ease-out data-[closed]:h-0 data-[closed]:opacity-0 data-[open]:h-[var(--collapsible-panel-height)] data-[open]:opacity-100 data-[starting-style]:h-0 data-[starting-style]:opacity-0"
                >
                  <div className="flex flex-col pt-2.5 pr-0 pb-1.5 pl-1 sm:pl-3">
                    {chapter.lessons.map((lesson) => (
                      <LessonRow key={lesson.id} lesson={lesson} />
                    ))}
                  </div>
                </CollapsibleContent>
              </article>
            </Collapsible>
          )
        })}
      </div>
    </section>
  )
}
function ChapterStatus({
  complete,
  completedLessons,
  totalLessons,
}: {
  complete: boolean
  completedLessons: number
  totalLessons: number
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium text-muted-foreground",
        complete && "text-primary"
      )}
    >
      {complete ? (
        <CheckCircleIcon className="size-4.5" aria-hidden="true" />
      ) : (
        <CheckIcon className="size-4.5" aria-hidden="true" />
      )}
      {complete ? "완료" : `${completedLessons}/${totalLessons}`}
    </span>
  )
}
function LessonRow({ lesson }: { lesson: CourseLesson }) {
  return (
    <Link
      href={`/lesson?lesson_id=${lesson.lessonId}`}
      className="group relative flex min-h-12 w-full items-center gap-3.5 rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-3.5"
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center transition-transform duration-200 group-hover:translate-x-1",
          lesson.completed ? "text-primary" : "text-muted-foreground"
        )}
        aria-hidden="true"
      >
        {lesson.completed ? (
          <CheckCircleIcon className="size-5" />
        ) : (
          <CircleIcon className="size-5" />
        )}
      </span>
      <span
        className={cn(
          "min-w-0 text-[15px]/6 tracking-normal transition-transform duration-200 group-hover:translate-x-1",
          lesson.completed ? "text-muted-foreground" : "text-foreground/85"
        )}
      >
        {lesson.title}
      </span>
    </Link>
  )
}
function getInitialOpenChapterId(
  chapters: readonly CourseChapter[]
): CourseChapterId {
  const firstChapter = chapters[0]
  if (!firstChapter) {
    throw new Error("Course curriculum must include at least one chapter")
  }
  const nextChapter = chapters.find((chapter) =>
    chapter.lessons.some((lesson) => !lesson.completed)
  )
  return nextChapter?.id ?? firstChapter.id
}
````

## File: apps/web/src/features/courses/course-detail-data.ts
````typescript
import {
  courseId,
  type Brand,
  type CourseId,
} from "@/features/courses/course-data"
export type CourseChapterId = Brand<string, "course-chapter-id">
export type CourseLessonId = Brand<string, "course-lesson-id">
export interface CourseLesson {
  id: CourseLessonId
  lessonId: CourseLessonId
  title: string
  description: string
  completed: boolean
}
export interface CourseChapter {
  id: CourseChapterId
  label: string
  title: string
  lessons: readonly CourseLesson[]
}
export interface CourseProgress {
  completedLessons: number
  totalLessons: number
  percentage: number
}
export interface CourseNextLesson {
  chapterLabel: string
  title: string
  description: string
  lessonId: CourseLessonId
}
export interface CourseDetail {
  id: CourseId
  title: string
  description: string
  thumbnail: string
  progress: CourseProgress
  nextLesson: CourseNextLesson
  chapters: readonly CourseChapter[]
}
interface CourseDetailInput {
  id: CourseId
  title: string
  description: string
  thumbnail: string
  chapters: readonly CourseChapter[]
}
function chapterId(value: string): CourseChapterId {
  return value as CourseChapterId
}
function lessonId(value: string): CourseLessonId {
  return value as CourseLessonId
}
function lesson(
  id: string,
  title: string,
  description: string,
  completed = false
): CourseLesson {
  return {
    id: lessonId(id),
    lessonId: lessonId(id),
    title,
    description,
    completed,
  }
}
function chapter(
  id: string,
  label: string,
  title: string,
  lessons: readonly CourseLesson[]
): CourseChapter {
  return {
    id: chapterId(id),
    label,
    title,
    lessons,
  }
}
function createCourseDetail(input: CourseDetailInput): CourseDetail {
  const lessonsWithChapter = input.chapters.flatMap((courseChapter) =>
    courseChapter.lessons.map((courseLesson) => ({
      chapterLabel: courseChapter.label,
      lesson: courseLesson,
    }))
  )
  const totalLessons = lessonsWithChapter.length
  const completedLessons = lessonsWithChapter.filter(
    ({ lesson: courseLesson }) => courseLesson.completed
  ).length
  const nextLessonSource =
    lessonsWithChapter.find(
      ({ lesson: courseLesson }) => !courseLesson.completed
    ) ?? lessonsWithChapter[0]
  if (!nextLessonSource) {
    throw new Error(
      `Course detail must include at least one lesson: ${input.id}`
    )
  }
  return {
    ...input,
    progress: {
      completedLessons,
      totalLessons,
      percentage: Math.round((completedLessons / totalLessons) * 100),
    },
    nextLesson: {
      chapterLabel: nextLessonSource.chapterLabel,
      title: nextLessonSource.lesson.title,
      description: nextLessonSource.lesson.description,
      lessonId: nextLessonSource.lesson.lessonId,
    },
  }
}
export const courseDetails: readonly CourseDetail[] = [
  createCourseDetail({
    id: courseId("sentence-structure"),
    title: "문장 구조의 기본",
    description:
      "한국어 문장의 뼈대를 이해하고 주어, 서술어, 목적어의 관계를 파악해 올바른 문장을 작성하는 방법을 배웁니다.",
    thumbnail: "/course-thumbnails/sentence-structure.png",
    chapters: [
      chapter("sentence-structure-chapter-1", "1단원", "문장의 뼈대", [
        lesson(
          "sentence-structure-01",
          "주어와 서술어 찾기",
          "문장의 중심 성분을 구분하고 기본 의미 관계를 확인합니다."
        ),
        lesson(
          "sentence-structure-02",
          "목적어와 보어의 자리",
          "서술어가 요구하는 성분을 보고 문장 구조를 완성합니다."
        ),
        lesson(
          "sentence-structure-03",
          "꾸밈말이 놓이는 위치",
          "관형어와 부사어가 문장의 의미를 어떻게 좁히는지 배웁니다."
        ),
        lesson(
          "sentence-structure-04",
          "문장 성분 점검표",
          "짧은 문장을 분석하며 빠진 성분과 불필요한 성분을 찾습니다."
        ),
      ]),
      chapter("sentence-structure-chapter-2", "2단원", "문장의 연결", [
        lesson(
          "sentence-structure-05",
          "이어진 문장의 기본",
          "대등하게 이어진 절과 종속적으로 이어진 절을 구분합니다."
        ),
        lesson(
          "sentence-structure-06",
          "접속 표현 고르기",
          "원인, 조건, 전환의 관계에 맞는 연결 표현을 선택합니다."
        ),
        lesson(
          "sentence-structure-07",
          "문장 길이 조절하기",
          "긴 문장을 나누고 짧은 문장을 묶어 읽기 쉬운 흐름을 만듭니다."
        ),
        lesson(
          "sentence-structure-08",
          "중복 구조 줄이기",
          "반복되는 주어와 서술어를 정리해 문장을 간결하게 다듬습니다."
        ),
      ]),
      chapter("sentence-structure-chapter-3", "3단원", "문단으로 확장", [
        lesson(
          "sentence-structure-09",
          "중심 문장 세우기",
          "문단의 핵심 문장을 먼저 정하고 뒷문장을 연결합니다."
        ),
        lesson(
          "sentence-structure-10",
          "근거 문장 배치",
          "예시와 설명을 중심 문장 뒤에 자연스럽게 놓습니다."
        ),
        lesson(
          "sentence-structure-11",
          "전환 문장 만들기",
          "다음 문단으로 넘어가는 연결 문장을 작성합니다."
        ),
        lesson(
          "sentence-structure-12",
          "구조 중심 퇴고",
          "문장 성분과 문단 흐름을 함께 점검하며 글을 고칩니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("vocabulary-basics"),
    title: "어휘 확장 입문",
    description:
      "일상적인 글쓰기에 필요한 핵심 어휘를 익히고, 다양한 상황에서 정확한 단어를 선택하는 감각을 기릅니다.",
    thumbnail: "/course-thumbnails/vocabulary-basics.png",
    chapters: [
      chapter("vocabulary-basics-chapter-1", "1단원", "정확한 단어 선택", [
        lesson(
          "vocabulary-basics-01",
          "비슷한 말의 차이",
          "의미가 가까운 단어들의 뉘앙스와 사용 장면을 구분합니다."
        ),
        lesson(
          "vocabulary-basics-02",
          "막연한 표현 바꾸기",
          "좋다, 많다, 크다처럼 넓은 표현을 구체적인 단어로 고칩니다."
        ),
        lesson(
          "vocabulary-basics-03",
          "감각어 늘리기",
          "시각, 청각, 촉각을 활용해 묘사의 해상도를 높입니다."
        ),
        lesson(
          "vocabulary-basics-04",
          "상황에 맞는 높임 어휘",
          "격식과 관계에 따라 어휘의 높낮이를 조절합니다."
        ),
        lesson(
          "vocabulary-basics-05",
          "단어장 작성법",
          "외운 단어가 아니라 실제 문장에 쓸 수 있는 단어장을 만듭니다."
        ),
      ]),
      chapter("vocabulary-basics-chapter-2", "2단원", "문맥 안에서 쓰기", [
        lesson(
          "vocabulary-basics-06",
          "문맥 단서 읽기",
          "앞뒤 문장을 보고 가장 어울리는 단어를 추론합니다."
        ),
        lesson(
          "vocabulary-basics-07",
          "관용 표현 익히기",
          "자주 쓰이는 관용 표현의 의미와 자연스러운 활용을 배웁니다."
        ),
        lesson(
          "vocabulary-basics-08",
          "군더더기 어휘 줄이기",
          "의미가 겹치는 단어를 정리해 문장을 선명하게 만듭니다."
        ),
        lesson(
          "vocabulary-basics-09",
          "주제별 어휘 묶기",
          "감정, 관계, 일상 주제에 맞춰 어휘를 분류합니다."
        ),
        lesson(
          "vocabulary-basics-10",
          "새 단어로 짧은 글 쓰기",
          "새로 익힌 단어를 활용해 짧은 단락을 완성합니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("reading-comprehension"),
    title: "독해와 요약",
    description:
      "글의 핵심 내용을 파악하고 간결하게 요약하는 능력을 키웁니다. 다양한 장르의 텍스트를 읽고 분석합니다.",
    thumbnail: "/course-thumbnails/reading-comprehension.png",
    chapters: [
      chapter("reading-comprehension-chapter-1", "1단원", "정독의 기술", [
        lesson(
          "reading-comprehension-01",
          "빠르게 읽기와 깊이 읽기",
          "읽기 목적에 따라 속도와 집중 지점을 달리하는 법을 배웁니다."
        ),
        lesson(
          "reading-comprehension-02",
          "밑줄 긋기의 기준",
          "핵심 주장, 근거, 전환 표현을 표시하는 기준을 세웁니다."
        ),
        lesson(
          "reading-comprehension-03",
          "한 문단 세 번 읽기",
          "표면 의미, 구조, 의도를 차례로 파악합니다."
        ),
        lesson(
          "reading-comprehension-04",
          "작가의 선택에 주목하기",
          "왜 이 단어와 순서를 선택했는지 질문하며 읽습니다."
        ),
      ]),
      chapter("reading-comprehension-chapter-2", "2단원", "요약의 구조", [
        lesson(
          "reading-comprehension-05",
          "중심 문장 찾기",
          "문단마다 반드시 남겨야 할 핵심 정보를 구분합니다."
        ),
        lesson(
          "reading-comprehension-06",
          "세부 정보 덜어내기",
          "예시, 반복, 부연 설명을 요약문에서 정리합니다."
        ),
        lesson(
          "reading-comprehension-07",
          "한 문장 요약하기",
          "글 전체의 주장과 근거를 하나의 문장으로 압축합니다."
        ),
        lesson(
          "reading-comprehension-08",
          "요약문 퇴고",
          "원문의 의미를 유지하면서 더 짧고 정확하게 고칩니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("grammar-complete"),
    title: "문법 완성",
    description:
      "맞춤법, 띄어쓰기, 문장 부호 등 한국어 표기법의 핵심 규칙을 체계적으로 정리하고 실습합니다.",
    thumbnail: "/course-thumbnails/grammar-complete.png",
    chapters: [
      chapter("grammar-complete-chapter-1", "1단원", "맞춤법의 기본", [
        lesson(
          "grammar-complete-01",
          "자주 틀리는 받침",
          "발음과 표기가 달라지는 대표 사례를 익힙니다."
        ),
        lesson(
          "grammar-complete-02",
          "되와 돼 구분",
          "문장 속 활용 형태를 보고 올바른 표기를 선택합니다."
        ),
        lesson(
          "grammar-complete-03",
          "안과 않",
          "부정 표현의 구조를 분석해 혼동을 줄입니다."
        ),
        lesson(
          "grammar-complete-04",
          "로서와 로써",
          "자격과 수단의 차이를 문맥 안에서 구분합니다."
        ),
        lesson(
          "grammar-complete-05",
          "맞춤법 점검 루틴",
          "글을 제출하기 전 확인할 맞춤법 체크리스트를 만듭니다."
        ),
      ]),
      chapter("grammar-complete-chapter-2", "2단원", "띄어쓰기", [
        lesson(
          "grammar-complete-06",
          "조사와 어미",
          "붙여 쓰는 요소와 띄어 쓰는 요소를 구분합니다."
        ),
        lesson(
          "grammar-complete-07",
          "의존 명사",
          "것, 수, 만큼처럼 자주 쓰는 의존 명사의 띄어쓰기를 연습합니다."
        ),
        lesson(
          "grammar-complete-08",
          "보조 용언",
          "해 보다, 먹어 버리다처럼 헷갈리는 보조 용언을 다룹니다."
        ),
        lesson(
          "grammar-complete-09",
          "단위와 수 표현",
          "숫자, 단위, 순서를 문장 안에서 바르게 씁니다."
        ),
        lesson(
          "grammar-complete-10",
          "띄어쓰기 퇴고",
          "짧은 글의 띄어쓰기 오류를 찾아 수정합니다."
        ),
      ]),
      chapter("grammar-complete-chapter-3", "3단원", "문장 부호와 문체", [
        lesson(
          "grammar-complete-11",
          "쉼표의 역할",
          "나열, 삽입, 호흡 조절에 맞게 쉼표를 씁니다."
        ),
        lesson(
          "grammar-complete-12",
          "따옴표와 인용",
          "직접 인용과 간접 인용의 표기 방식을 익힙니다."
        ),
        lesson(
          "grammar-complete-13",
          "문장 끝맺음",
          "평서, 의문, 청유의 끝맺음을 문체에 맞춥니다."
        ),
        lesson(
          "grammar-complete-14",
          "문체 일관성",
          "높임과 어조가 섞이지 않도록 한 글 안의 문체를 통일합니다."
        ),
        lesson(
          "grammar-complete-15",
          "최종 교정 실습",
          "맞춤법, 띄어쓰기, 부호를 한 번에 점검합니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("expression"),
    title: "표현력 향상",
    description:
      "같은 내용을 더 풍부하고 생동감 있게 전달하는 표현 방법을 연습합니다. 피동문, 사동문, 비유 표현을 다룹니다.",
    thumbnail: "/course-thumbnails/expression.png",
    chapters: [
      chapter("expression-chapter-1", "1단원", "선명한 묘사", [
        lesson(
          "expression-01",
          "구체적인 명사 고르기",
          "대상을 흐리게 만드는 단어를 더 정확한 명사로 바꿉니다."
        ),
        lesson(
          "expression-02",
          "움직임이 보이는 동사",
          "정적인 문장을 생동감 있는 동사 중심 문장으로 바꿉니다."
        ),
        lesson(
          "expression-03",
          "감각 묘사 확장",
          "시각 중심 묘사를 소리, 냄새, 촉감으로 넓힙니다."
        ),
        lesson(
          "expression-04",
          "묘사와 설명 구분",
          "독자가 장면을 상상하게 만드는 문장과 정보를 주는 문장을 나눕니다."
        ),
      ]),
      chapter("expression-chapter-2", "2단원", "문장의 힘 조절", [
        lesson(
          "expression-05",
          "피동 표현 다듬기",
          "불필요한 피동문을 능동적인 문장으로 고칩니다."
        ),
        lesson(
          "expression-06",
          "사동 표현 쓰기",
          "원인과 작용을 자연스럽게 드러내는 사동 표현을 연습합니다."
        ),
        lesson(
          "expression-07",
          "강조의 위치",
          "중요한 정보를 문장 앞뒤 어디에 놓을지 판단합니다."
        ),
        lesson(
          "expression-08",
          "리듬 있는 문장",
          "문장 길이와 반복을 조절해 읽는 맛을 만듭니다."
        ),
      ]),
      chapter("expression-chapter-3", "3단원", "비유와 어조", [
        lesson(
          "expression-09",
          "좋은 비유의 조건",
          "익숙하지만 새롭게 느껴지는 비유를 만드는 기준을 배웁니다."
        ),
        lesson(
          "expression-10",
          "상투적 표현 피하기",
          "습관적으로 쓰는 표현을 글의 맥락에 맞게 새로 씁니다."
        ),
        lesson(
          "expression-11",
          "어조 통일하기",
          "문장마다 다른 온도를 하나의 글 흐름으로 정리합니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("essay-writing"),
    title: "에세이 쓰기",
    description:
      "주제 선정부터 개요 작성, 본문 전개, 마무리까지 설득력 있는 에세이를 완성하는 전 과정을 익힙니다.",
    thumbnail: "/course-thumbnails/essay-writing.png",
    chapters: [
      chapter("essay-writing-chapter-1", "1단원", "주제와 관점", [
        lesson(
          "essay-writing-01",
          "쓸 만한 질문 찾기",
          "개인 경험에서 독자가 함께 생각할 질문을 뽑습니다."
        ),
        lesson(
          "essay-writing-02",
          "주제 좁히기",
          "넓은 소재를 한 편의 글에 맞는 범위로 줄입니다."
        ),
        lesson(
          "essay-writing-03",
          "관점 문장 쓰기",
          "글 전체를 이끄는 관점 문장을 선명하게 만듭니다."
        ),
        lesson(
          "essay-writing-04",
          "독자 설정",
          "누구에게 말하는 글인지 정하고 설명의 깊이를 조절합니다."
        ),
        lesson(
          "essay-writing-05",
          "핵심 메시지 점검",
          "글을 읽고 남아야 할 한 문장을 정합니다."
        ),
      ]),
      chapter("essay-writing-chapter-2", "2단원", "구성과 전개", [
        lesson(
          "essay-writing-06",
          "도입부 설계",
          "독자의 관심을 여는 장면, 질문, 진술을 비교합니다."
        ),
        lesson(
          "essay-writing-07",
          "본문 단락 배열",
          "경험, 해석, 주장 단락을 설득력 있게 배치합니다."
        ),
        lesson(
          "essay-writing-08",
          "사례와 근거",
          "개인적 경험을 보편적 의미로 확장하는 근거를 씁니다."
        ),
        lesson(
          "essay-writing-09",
          "전환 문장",
          "단락 사이의 논리적 이동을 자연스럽게 만듭니다."
        ),
        lesson(
          "essay-writing-10",
          "결론의 여운",
          "반복이 아니라 확장으로 끝나는 마무리를 연습합니다."
        ),
      ]),
      chapter("essay-writing-chapter-3", "3단원", "퇴고와 완성", [
        lesson(
          "essay-writing-11",
          "초고 읽기",
          "쓴 사람의 의도와 독자의 이해 사이의 차이를 찾습니다."
        ),
        lesson(
          "essay-writing-12",
          "문단 순서 바꾸기",
          "글의 흐름이 더 잘 살아나는 배열을 비교합니다."
        ),
        lesson(
          "essay-writing-13",
          "제목 붙이기",
          "주제를 드러내면서도 읽고 싶게 만드는 제목을 만듭니다."
        ),
        lesson(
          "essay-writing-14",
          "최종 원고 다듬기",
          "불필요한 문장을 덜어내고 완성 원고를 정리합니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("business-writing"),
    title: "비즈니스 글쓰기",
    description:
      "이메일, 보고서, 제안서 등 업무 환경에서 요구되는 명확하고 전문적인 문서 작성 스킬을 기릅니다.",
    thumbnail: "/course-thumbnails/business-writing.png",
    chapters: [
      chapter("business-writing-chapter-1", "1단원", "업무 문장의 기본", [
        lesson(
          "business-writing-01",
          "목적 먼저 쓰기",
          "문서의 목적을 첫 문장에 분명하게 드러냅니다."
        ),
        lesson(
          "business-writing-02",
          "요청과 공유 구분",
          "상대가 해야 할 일과 알아야 할 일을 분리합니다."
        ),
        lesson(
          "business-writing-03",
          "모호한 표현 줄이기",
          "가능한 빨리, 적절히 같은 표현을 구체적인 조건으로 바꿉니다."
        ),
        lesson(
          "business-writing-04",
          "격식 있는 어조",
          "딱딱하지 않지만 신뢰를 주는 업무 문체를 연습합니다."
        ),
      ]),
      chapter("business-writing-chapter-2", "2단원", "보고와 제안", [
        lesson(
          "business-writing-05",
          "핵심 요약 만들기",
          "긴 내용을 의사 결정에 필요한 정보로 압축합니다."
        ),
        lesson(
          "business-writing-06",
          "현황과 이슈 분리",
          "사실, 문제, 원인을 구분해 보고서 구조를 세웁니다."
        ),
        lesson(
          "business-writing-07",
          "대안 제시",
          "선택지를 비교하고 추천안을 명확히 씁니다."
        ),
        lesson(
          "business-writing-08",
          "근거 자료 연결",
          "숫자와 사례를 문장 안에서 설득력 있게 설명합니다."
        ),
        lesson(
          "business-writing-09",
          "실행 계획 정리",
          "담당자, 일정, 다음 행동을 빠짐없이 적습니다."
        ),
      ]),
      chapter("business-writing-chapter-3", "3단원", "실무 문서 퇴고", [
        lesson(
          "business-writing-10",
          "읽는 순서 점검",
          "상사가 빠르게 읽어도 핵심이 남는 구조를 만듭니다."
        ),
        lesson(
          "business-writing-11",
          "리스크 표현",
          "문제를 숨기지 않으면서도 대응 방향을 함께 제시합니다."
        ),
        lesson(
          "business-writing-12",
          "문서 제목 개선",
          "목적과 결론이 보이는 제목으로 바꿉니다."
        ),
        lesson(
          "business-writing-13",
          "최종 검토 체크",
          "수신자, 근거, 요청, 일정이 모두 드러나는지 확인합니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("creative-writing"),
    title: "창의적 글쓰기",
    description:
      "상상력을 자극하는 글쓰기 기법을 배웁니다. 단편 소설, 시, 수필 등 다양한 창작 형식을 탐구합니다.",
    thumbnail: "/course-thumbnails/creative-writing.png",
    chapters: [
      chapter("creative-writing-chapter-1", "1단원", "발상과 관찰", [
        lesson(
          "creative-writing-01",
          "낯설게 보기",
          "익숙한 사물을 새로운 관점으로 묘사합니다."
        ),
        lesson(
          "creative-writing-02",
          "질문에서 시작하기",
          "이야기를 밀고 가는 질문을 만들고 확장합니다."
        ),
        lesson(
          "creative-writing-03",
          "장면 수집",
          "일상의 장면을 기록해 글감으로 바꿉니다."
        ),
        lesson(
          "creative-writing-04",
          "감정의 씨앗",
          "작은 감정을 이야기의 출발점으로 삼습니다."
        ),
      ]),
      chapter("creative-writing-chapter-2", "2단원", "인물과 장면", [
        lesson(
          "creative-writing-05",
          "인물의 욕망",
          "인물이 원하는 것과 두려워하는 것을 설정합니다."
        ),
        lesson(
          "creative-writing-06",
          "행동으로 보여주기",
          "설명 대신 행동과 대화로 성격을 드러냅니다."
        ),
        lesson(
          "creative-writing-07",
          "장소의 분위기",
          "공간 묘사를 통해 이야기의 정서를 만듭니다."
        ),
        lesson(
          "creative-writing-08",
          "대화의 리듬",
          "인물마다 다른 말투와 침묵을 설계합니다."
        ),
      ]),
      chapter("creative-writing-chapter-3", "3단원", "플롯과 전개", [
        lesson(
          "creative-writing-09",
          "사건의 압력",
          "인물이 변할 수밖에 없는 사건을 만듭니다."
        ),
        lesson(
          "creative-writing-10",
          "갈등의 단계",
          "긴장감이 높아지는 순서로 장면을 배열합니다."
        ),
        lesson(
          "creative-writing-11",
          "반전과 발견",
          "뜬금없는 반전이 아니라 필연적인 발견을 설계합니다."
        ),
        lesson(
          "creative-writing-12",
          "끝맺음 선택",
          "해결, 여운, 열린 결말의 효과를 비교합니다."
        ),
      ]),
      chapter("creative-writing-chapter-4", "4단원", "형식 실험", [
        lesson(
          "creative-writing-13",
          "짧은 소설 쓰기",
          "한 장면 안에서 인물과 변화를 담습니다."
        ),
        lesson(
          "creative-writing-14",
          "시적 문장",
          "이미지와 리듬을 중심으로 짧은 글을 씁니다."
        ),
        lesson(
          "creative-writing-15",
          "수필의 목소리",
          "개인적 경험을 사유로 확장하는 목소리를 찾습니다."
        ),
        lesson(
          "creative-writing-16",
          "작품 퇴고",
          "의도, 장면, 문장을 차례로 점검해 작품을 완성합니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("basic-sentence-writing"),
    title: "기초 문장 만들기",
    description: "주어, 서술어, 목적어의 긴밀한 관계 탐구",
    thumbnail: "/course-thumbnails/basic-sentence-writing.png",
    chapters: [
      chapter("basic-sentence-writing-chapter-1", "1단원", "문장 성분 익히기", [
        lesson(
          "basic-sentence-writing-01",
          "누가 무엇을 하는가",
          "주어와 서술어를 중심으로 가장 작은 문장을 만듭니다.",
          true
        ),
        lesson(
          "basic-sentence-writing-02",
          "목적어 붙이기",
          "행동의 대상을 더해 문장의 의미를 완성합니다.",
          true
        ),
        lesson(
          "basic-sentence-writing-03",
          "필수 성분과 선택 성분",
          "문장에서 꼭 필요한 말과 덧붙이는 말을 구분합니다.",
          true
        ),
        lesson(
          "basic-sentence-writing-04",
          "짧은 문장 10개 쓰기",
          "기본 구조를 반복해 안정적인 문장 감각을 만듭니다.",
          true
        ),
      ]),
      chapter("basic-sentence-writing-chapter-2", "2단원", "꾸밈과 확장", [
        lesson(
          "basic-sentence-writing-05",
          "형용사 꾸밈과 명사의 배치",
          "명사를 꾸미는 말의 위치와 범위를 확인합니다.",
          true
        ),
        lesson(
          "basic-sentence-writing-06",
          "부사어로 상황 더하기",
          "시간, 장소, 방법 정보를 자연스럽게 붙입니다."
        ),
        lesson(
          "basic-sentence-writing-07",
          "중복 꾸밈 줄이기",
          "같은 의미가 반복되는 꾸밈말을 덜어냅니다."
        ),
        lesson(
          "basic-sentence-writing-08",
          "한 문장 확장 실습",
          "짧은 문장을 목적에 맞게 길게 확장합니다."
        ),
      ]),
      chapter("basic-sentence-writing-chapter-3", "3단원", "문장 다듬기", [
        lesson(
          "basic-sentence-writing-09",
          "어색한 호응 찾기",
          "주어와 서술어, 목적어와 서술어의 호응을 점검합니다."
        ),
        lesson(
          "basic-sentence-writing-10",
          "문장 순서 바꾸기",
          "정보의 우선순위에 따라 문장 성분을 재배치합니다."
        ),
        lesson(
          "basic-sentence-writing-11",
          "간결하게 고치기",
          "불필요한 반복과 군더더기를 삭제합니다."
        ),
        lesson(
          "basic-sentence-writing-12",
          "문장 묶어 문단 만들기",
          "완성한 문장을 연결해 짧은 문단을 씁니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("emotion-writing"),
    title: "감정 표현 글쓰기",
    description: "추상적 상태를 정확한 서술어로 기술하는 법",
    thumbnail: "/course-thumbnails/emotion-writing.png",
    chapters: [
      chapter("emotion-writing-chapter-1", "1단원", "감정의 이름", [
        lesson(
          "emotion-writing-01",
          "기본 감정 나누기",
          "기쁨, 분노, 슬픔, 불안을 더 작은 감정으로 분류합니다.",
          true
        ),
        lesson(
          "emotion-writing-02",
          "감정 강도 표현",
          "약한 감정과 강한 감정을 정확한 단어로 구분합니다.",
          true
        ),
        lesson(
          "emotion-writing-03",
          "미묘한 감정 변화",
          "시간이 지나며 달라지는 감정을 문장으로 기록합니다."
        ),
        lesson(
          "emotion-writing-04",
          "몸의 반응 쓰기",
          "감정을 직접 말하지 않고 신체 반응으로 보여줍니다."
        ),
        lesson(
          "emotion-writing-05",
          "감정 어휘 사전",
          "자주 쓰는 감정 단어를 상황별로 정리합니다."
        ),
      ]),
      chapter("emotion-writing-chapter-2", "2단원", "장면으로 표현하기", [
        lesson(
          "emotion-writing-06",
          "대상을 통해 감정 이입하기",
          "사물과 공간을 활용해 감정의 방향을 드러냅니다."
        ),
        lesson(
          "emotion-writing-07",
          "대화 속 감정",
          "말의 내용보다 말투와 간격으로 감정을 표현합니다."
        ),
        lesson(
          "emotion-writing-08",
          "감정 과잉 덜어내기",
          "직접 설명을 줄이고 장면의 증거를 남깁니다."
        ),
        lesson(
          "emotion-writing-09",
          "반대 감정 함께 쓰기",
          "기쁨 속 불안처럼 섞인 감정을 자연스럽게 씁니다."
        ),
        lesson(
          "emotion-writing-10",
          "감정 장면 완성",
          "인물, 행동, 배경을 묶어 짧은 감정 장면을 씁니다."
        ),
      ]),
    ],
  }),
  createCourseDetail({
    id: courseId("business-email"),
    title: "비즈니스 이메일 작성법",
    description: "업무 격식과 명확한 전개로 신뢰감 구축",
    thumbnail: "/course-thumbnails/business-email.png",
    chapters: [
      chapter("business-email-chapter-1", "1단원", "이메일의 첫인상", [
        lesson(
          "business-email-01",
          "제목의 핵심 표현",
          "목적, 요청, 기한이 보이는 이메일 제목을 씁니다."
        ),
        lesson(
          "business-email-02",
          "첫 문장 목적 정리",
          "수신자가 바로 상황을 이해하는 시작 문장을 만듭니다."
        ),
        lesson(
          "business-email-03",
          "수신자에 맞는 호칭",
          "관계와 조직 문화에 맞게 인사와 호칭을 정합니다."
        ),
        lesson(
          "business-email-04",
          "배경 설명의 양",
          "너무 길거나 부족하지 않은 배경 설명을 연습합니다."
        ),
        lesson(
          "business-email-05",
          "핵심 요약 블록",
          "긴 이메일 앞에 핵심 요약을 배치합니다."
        ),
        lesson(
          "business-email-06",
          "읽기 쉬운 단락",
          "한 단락에 하나의 목적만 담도록 정리합니다."
        ),
      ]),
      chapter("business-email-chapter-2", "2단원", "요청과 회신", [
        lesson(
          "business-email-07",
          "명확한 요청 문장",
          "상대가 해야 할 행동을 한 문장으로 씁니다."
        ),
        lesson(
          "business-email-08",
          "기한과 조건 쓰기",
          "언제까지 무엇을 해야 하는지 오해 없이 전달합니다."
        ),
        lesson(
          "business-email-09",
          "자료 첨부 안내",
          "첨부 자료의 목적과 확인 지점을 함께 씁니다."
        ),
        lesson(
          "business-email-10",
          "거절과 조율",
          "단호하지만 관계를 해치지 않는 조율 문장을 연습합니다."
        ),
        lesson(
          "business-email-11",
          "회신 지연 안내",
          "늦어진 상황과 다음 회신 시점을 신뢰 있게 전달합니다."
        ),
        lesson(
          "business-email-12",
          "확인 요청 정리",
          "상대의 확인이 필요한 항목을 빠짐없이 묶습니다."
        ),
      ]),
      chapter("business-email-chapter-3", "3단원", "상황별 이메일", [
        lesson(
          "business-email-13",
          "회의 일정 조율",
          "후보 시간과 목적을 간결하게 제안합니다."
        ),
        lesson(
          "business-email-14",
          "업무 공유 메일",
          "진행 상황, 이슈, 다음 행동을 한눈에 보이게 씁니다."
        ),
        lesson(
          "business-email-15",
          "고객 응대 메일",
          "공감, 설명, 해결안을 균형 있게 담습니다."
        ),
        lesson(
          "business-email-16",
          "상급자 보고 메일",
          "결론과 판단 근거를 먼저 제시합니다."
        ),
        lesson(
          "business-email-17",
          "감사와 후속 안내",
          "협업 이후의 감사와 다음 절차를 자연스럽게 씁니다."
        ),
        lesson(
          "business-email-18",
          "최종 이메일 퇴고",
          "제목, 목적, 요청, 어조를 한 번에 점검합니다."
        ),
      ]),
    ],
  }),
]
const courseDetailMap = new Map(
  courseDetails.map((courseDetail) => [courseDetail.id, courseDetail])
)
export function getCourseDetailById(id: string): CourseDetail | undefined {
  return courseDetailMap.get(courseId(id))
}
export function getCourseDetailStaticParams(): Array<{ id: string }> {
  return courseDetails.map(({ id }) => ({ id }))
}
````

## File: apps/web/src/features/courses/course-detail-page.tsx
````typescript
import Image from "next/image"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@workspace/ui/components/ui/card"
import { Button } from "@workspace/ui/components/ui/button"
import { ProgressBar } from "@workspace/ui/components/ui/progress-bar"
import { Separator } from "@workspace/ui/components/ui/separator"
import { PlayIcon } from "@workspace/ui/components/icons"
import { CourseCurriculum } from "@/features/courses/course-curriculum"
import type { CourseDetail } from "@/features/courses/course-detail-data"
interface CourseDetailPageProps {
  course: CourseDetail
}
export function CourseDetailPage({ course }: CourseDetailPageProps) {
  return (
    <div className="w-full bg-background text-foreground">
      <div className="mx-auto flex max-w-[720px] flex-col px-5 pt-8 pb-20 sm:px-6 sm:pt-10 sm:pb-28">
        <section className="flex flex-col gap-8" aria-labelledby="course-title">
          <div className="relative aspect-video w-full overflow-hidden rounded-[20px] bg-muted">
            <Image
              src={course.thumbnail}
              alt={`${course.title} 썸네일`}
              fill
              sizes="(max-width: 767px) calc(100vw - 40px), 672px"
              className="object-cover"
              preload
            />
          </div>
          <header className="mb-10 flex flex-col gap-5 sm:mb-12">
            <div className="flex flex-col gap-3">
              <h1
                id="course-title"
                className="m-0 text-3xl/10 font-bold tracking-normal sm:text-4xl/11"
              >
                {course.title}
              </h1>
              <p className="m-0 max-w-[560px] text-base/7 text-muted-foreground sm:text-[17px]/8">
                {course.description}
              </p>
            </div>
            <Card variant="filled" className="rounded-4xl">
              <CardHeader className="gap-3">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-sm font-medium text-muted-foreground">
                    전체 진행률
                  </span>
                  <span className="shrink-0 text-2xl font-bold text-primary">
                    {course.progress.percentage}%
                  </span>
                </div>
                <ProgressBar
                  value={course.progress.percentage}
                  aria-label={`${course.title} 전체 진행률`}
                  className="gap-0 [&_[data-slot=progress-indicator]]:bg-primary [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-muted"
                />
                <p className="m-0 text-sm font-medium text-muted-foreground">
                  {course.progress.completedLessons} /{" "}
                  {course.progress.totalLessons} 완료
                </p>
              </CardHeader>
              <CardContent>
                <Separator />
              </CardContent>
              <CardFooter className="flex-col items-stretch gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-xs font-bold text-primary uppercase">
                    이어서 학습하기
                  </span>
                  <h2 className="m-0 text-base/6 font-semibold tracking-normal">
                    {course.nextLesson.chapterLabel} · {course.nextLesson.title}
                  </h2>
                  <p className="m-0 text-sm/6 text-muted-foreground">
                    {course.nextLesson.description}
                  </p>
                </div>
                <Button
                  nativeButton={false}
                  render={
                    <Link
                      href={`/lesson?lesson_id=${course.nextLesson.lessonId}`}
                    />
                  }
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <span>이어하기</span>
                  <PlayIcon data-icon="inline-end" className="fill-current" />
                </Button>
              </CardFooter>
            </Card>
          </header>
        </section>
        <CourseCurriculum course={course} />
      </div>
    </div>
  )
}
````

## File: apps/web/src/features/courses/course-feed.tsx
````typescript
import Link from "next/link"
import { ChevronRightIcon } from "@workspace/ui/components/icons"
import { CourseCard } from "@/features/courses/course-card"
import type { CourseCategory } from "@/features/courses/course-data"
interface CourseFeedProps {
  categories: readonly CourseCategory[]
}
interface CourseSectionProps {
  category: CourseCategory
}
export function CourseFeed({ categories }: CourseFeedProps) {
  return (
    <div className="flex flex-col gap-12 md:gap-16">
      {categories.map((category) => (
        <CourseSection key={category.id} category={category} />
      ))}
    </div>
  )
}
function CourseSection({ category }: CourseSectionProps) {
  return (
    <section
      className="flex flex-col gap-5"
      aria-labelledby={`section-title-${category.id}`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2
          className="m-0 text-xl/7 font-bold tracking-normal md:text-2xl/8"
          id={`section-title-${category.id}`}
        >
          {category.title}
        </h2>
        <Link
          href={`/courses?category=${category.id}`}
          className="group flex shrink-0 items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          id={`see-all-${category.id}`}
          aria-label={`${category.title} 전체 보기`}
        >
          <span>전체 보기</span>
          <ChevronRightIcon
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>
      <div
        className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 min-[900px]:grid-cols-3 md:gap-6"
        role="list"
      >
        {category.courses.map((course) => (
          <div key={course.id} role="listitem">
            <CourseCard course={course} />
          </div>
        ))}
      </div>
    </section>
  )
}
````

## File: apps/web/src/features/courses/courses-page.tsx
````typescript
import { courseCategories } from "@/features/courses/course-data"
import { CourseFeed } from "@/features/courses/course-feed"
export function CoursesPage() {
  return (
    <div className="w-full bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col px-4 pt-6 pb-12 sm:px-6 sm:pt-9 md:px-8 md:pt-12 md:pb-20">
        <header className="mb-8 flex flex-col gap-2 md:mb-12">
          <h1 className="m-0 text-3xl/9 font-bold tracking-normal md:text-4xl/10">
            학습 코스 둘러보기
          </h1>
          <p className="m-0 max-w-2xl text-base/7 text-muted-foreground md:text-lg/8">
            체계적인 커리큘럼으로 한국어 글쓰기 실력을 키워보세요.
          </p>
        </header>
        <CourseFeed categories={courseCategories} />
      </div>
    </div>
  )
}
````

## File: apps/web/src/features/lessons/lesson-logic.ts
````typescript
import type {
  ChoiceOption,
  LessonStep,
  LessonTone,
} from "@/features/lessons/lesson-types"
export type ChoiceStatus = "neutral" | "selected" | "correct" | "incorrect"
export type ClassifyStatus = "neutral" | "correct" | "incorrect"
export type BlankStatus = "neutral" | "filled" | "correct" | "incorrect"
export type BlankAssignments = Record<string, string>
export type ClassifyAssignments = Record<string, string>
export type MatchConnections = Record<string, string>
export interface MarkdownSegment {
  id: string
  text: string
  emphasized: boolean
}
export interface MarkedTextPlainPart {
  id: string
  type: "text"
  content: string
}
export interface MarkedTextSpanPart {
  type: "span"
  content: string
  id: string
  isCorrect: boolean
}
export type MarkedTextPart = MarkedTextPlainPart | MarkedTextSpanPart
export interface ConfettiPiece {
  id: number
  tone: LessonTone
  left: string
  delay: string
  duration: string
  size: string
}
export function getLessonProgress(
  currentStepIndex: number,
  totalSteps: number
) {
  if (totalSteps === 0) {
    return 0
  }
  return (currentStepIndex / totalSteps) * 100
}
export function findStepIndexByType(
  steps: readonly LessonStep[],
  type: LessonStep["type"]
) {
  return steps.findIndex((step) => step.type === type)
}
export function getChoiceStatus(
  option: ChoiceOption,
  selectedId: string | null,
  confirmed: boolean
): ChoiceStatus {
  if (!confirmed) {
    return selectedId === option.id ? "selected" : "neutral"
  }
  if (option.isCorrect) {
    return "correct"
  }
  if (option.id === selectedId) {
    return "incorrect"
  }
  return "neutral"
}
export function isSelectedChoiceCorrect(
  options: readonly ChoiceOption[],
  selectedId: string | null
) {
  return Boolean(
    selectedId && options.find((option) => option.id === selectedId)?.isCorrect
  )
}
export function splitMarkdownEmphasis(text: string): MarkdownSegment[] {
  const segments: MarkdownSegment[] = []
  const regex = /\*\*(.*?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        id: `text-${lastIndex}`,
        text: text.slice(lastIndex, match.index),
        emphasized: false,
      })
    }
    segments.push({
      id: `strong-${match.index}`,
      text: match[1] ?? "",
      emphasized: true,
    })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    segments.push({
      id: `text-${lastIndex}`,
      text: text.slice(lastIndex),
      emphasized: false,
    })
  }
  return segments
}
export function splitParagraphs(text: string) {
  return text.split(/\n+/).filter((line) => line.trim().length > 0)
}
export function parseMarkedText(markedText: string): MarkedTextPart[] {
  const parts: MarkedTextPart[] = []
  const regex = /\{\{([^:]+):([^:]+):(correct|incorrect)\}\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(markedText)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        id: `text-${lastIndex}`,
        type: "text",
        content: markedText.slice(lastIndex, match.index),
      })
    }
    parts.push({
      type: "span",
      content: match[1] ?? "",
      id: match[2] ?? "",
      isCorrect: match[3] === "correct",
    })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < markedText.length) {
    parts.push({
      id: `text-${lastIndex}`,
      type: "text",
      content: markedText.slice(lastIndex),
    })
  }
  return parts
}
export function parseFillBlankTemplate(template: string) {
  let offset = 0
  return template.split(/(\{\{[^}]+\}\})/g).map((part) => {
    const key = `part-${offset}`
    offset += part.length
    const match = part.match(/\{\{([^}]+)\}\}/)
    if (!match) {
      return {
        key,
        type: "text" as const,
        content: part,
      }
    }
    return {
      key,
      type: "blank" as const,
      id: match[1] ?? "",
    }
  })
}
export function getBlankStatus({
  blankId,
  blankValue,
  correctAnswers,
  confirmed,
  caseSensitive,
}: {
  blankId: string
  blankValue: string | undefined
  correctAnswers: readonly string[]
  confirmed: boolean
  caseSensitive: boolean
}): BlankStatus {
  void blankId
  if (!blankValue) {
    return "neutral"
  }
  if (!confirmed) {
    return "filled"
  }
  const answer = caseSensitive ? blankValue : blankValue.toLowerCase()
  const correct = correctAnswers.some((correctAnswer) => {
    const normalizedCorrect = caseSensitive
      ? correctAnswer
      : correctAnswer.toLowerCase()
    return normalizedCorrect === answer
  })
  return correct ? "correct" : "incorrect"
}
export function getClassifyStatus({
  correctCategoryId,
  assignedCategoryId,
  confirmed,
}: {
  correctCategoryId: string
  assignedCategoryId: string | undefined
  confirmed: boolean
}): ClassifyStatus {
  if (!confirmed) {
    return "neutral"
  }
  return correctCategoryId === assignedCategoryId ? "correct" : "incorrect"
}
export function getChecklistComplete({
  checkedCount,
  totalCount,
  completionMode,
  minimumChecks,
}: {
  checkedCount: number
  totalCount: number
  completionMode: "minimum" | "all" | "any"
  minimumChecks: number
}) {
  if (completionMode === "all") {
    return checkedCount === totalCount
  }
  if (completionMode === "minimum") {
    return checkedCount >= minimumChecks
  }
  return checkedCount > 0
}
export function getMatchRate({
  sourceText,
  userText,
  caseSensitive,
  punctuationSensitive,
}: {
  sourceText: string
  userText: string
  caseSensitive: boolean
  punctuationSensitive: boolean
}) {
  const source = normalizeComparableText({
    text: sourceText,
    caseSensitive,
    punctuationSensitive,
  })
  const user = normalizeComparableText({
    text: userText,
    caseSensitive,
    punctuationSensitive,
  })
  if (!user) {
    return 0
  }
  let matches = 0
  const maxLength = Math.max(user.length, source.length)
  for (
    let index = 0;
    index < Math.min(user.length, source.length);
    index += 1
  ) {
    if (user[index] === source[index]) {
      matches += 1
    }
  }
  return Math.round((matches / maxLength) * 100)
}
export function getMockAiFeedback() {
  return {
    good: [
      "능동태로의 전환이 자연스럽습니다.",
      "주어와 서술어의 호응이 명확합니다.",
    ],
    improve: [
      '조금 더 간결하게 쓸 수 있어요. "이 제안을"이 이미 목적어이므로 "이"를 생략해도 됩니다.',
    ],
  }
}
export function getDeterministicOrder<TItem extends { id: string }>(
  items: readonly TItem[]
) {
  return [...items].sort((left, right) => {
    const leftHash = getStableHash(left.id)
    const rightHash = getStableHash(right.id)
    return leftHash - rightHash
  })
}
export function createConfettiPieces(count: number): readonly ConfettiPiece[] {
  const tones: readonly LessonTone[] = [
    "primary",
    "success",
    "info",
    "warning",
    "danger",
    "neutral",
  ]
  return Array.from({ length: count }, (_, index) => ({
    id: index,
    tone: tones[index % tones.length] ?? "primary",
    left: `${(index * 37) % 100}%`,
    delay: `${(index % 8) * 0.16}s`,
    duration: `${2 + (index % 5) * 0.28}s`,
    size: `${6 + (index % 4) * 2}px`,
  }))
}
function normalizeComparableText({
  text,
  caseSensitive,
  punctuationSensitive,
}: {
  text: string
  caseSensitive: boolean
  punctuationSensitive: boolean
}) {
  let normalized = caseSensitive ? text : text.toLowerCase()
  if (!punctuationSensitive) {
    normalized = normalized.replace(/[.,!?;:'"()[\]{}\-—]/g, "")
  }
  return normalized
}
function getStableHash(value: string) {
  return [...value].reduce(
    (current, character) => current + character.charCodeAt(0),
    0
  )
}
````

## File: apps/web/src/features/lessons/lesson-page.tsx
````typescript
import { LessonExperience } from "@/features/lessons/lesson-experience"
import type { Lesson } from "@/features/lessons/lesson-types"
interface LessonPageProps {
  lesson: Lesson
}
export function LessonPage({ lesson }: LessonPageProps) {
  return <LessonExperience lesson={lesson} />
}
````

## File: packages/ui/AGENTS.md
````markdown
# Shared UI primitives and design-system level components

Rules:

- shadcn/ui-based primitives live here
- this package should remain domain-agnostic
- avoid embedding essay-specific product language here
- Important: don't edit without user request
````

## File: packages/ui/src/components/ui/sheet.tsx
````typescript
"use client"
import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}
function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}
function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}
function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}
function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs",
        className
      )}
      {...props}
    />
  )
}
function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition duration-200 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-[2.5rem] data-[side=bottom]:data-starting-style:translate-y-[2.5rem] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:border-r data-[side=left]:data-ending-style:translate-x-[-2.5rem] data-[side=left]:data-starting-style:translate-x-[-2.5rem] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-[2.5rem] data-[side=right]:data-starting-style:translate-x-[2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-ending-style:translate-y-[-2.5rem] data-[side=top]:data-starting-style:translate-y-[-2.5rem] data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3"
                size="icon-sm"
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </Button>
            }
          />
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}
function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  )
}
function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}
function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "cn-font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}
function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
````

## File: packages/ui/src/components/ui/sidebar.tsx
````typescript
"use client"
import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { PanelLeftIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"
type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}
const SidebarContext = React.createContext<SidebarContextProps | null>(null)
function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }
  return context
}
function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)
  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }
      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )
  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])
  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])
  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed"
  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  )
  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}
function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  dir,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()
  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          dir={dir}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }
  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
        )}
      />
      <div
        data-slot="sidebar-container"
        data-side={side}
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear data-[side=left]:left-0 data-[side=left]:group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)] data-[side=right]:right-0 data-[side=right]:group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)] md:flex",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="flex size-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:ring-1 group-data-[variant=floating]:ring-sidebar-border"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon-sm"
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeftIcon className="cn-rtl-flip" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}
function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:start-1/2 after:w-[2px] hover:after:bg-sidebar-border sm:flex ltr:-translate-x-1/2 rtl:-translate-x-1/2",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
}
function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className
      )}
      {...props}
    />
  )
}
function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("h-8 w-full bg-background shadow-none", className)}
      {...props}
    />
  )
}
function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
}
function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
}
function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  )
}
function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "no-scrollbar flex min-h-0 flex-1 flex-col gap-0 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
}
function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
}
function SidebarGroupLabel({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div"> & React.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-group-label",
      sidebar: "group-label",
    },
  })
}
function SidebarGroupAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<"button"> & React.ComponentProps<"button">) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-group-action",
      sidebar: "group-action",
    },
  })
}
function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  )
}
function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-0", className)}
      {...props}
    />
  )
}
function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
}
const sidebarMenuButtonVariants = cva(
  "peer/menu-button group/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-open:hover:bg-sidebar-accent data-open:hover:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&>span:last-child]:truncate",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
function SidebarMenuButton({
  render,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>) {
  const { isMobile, state } = useSidebar()
  const comp = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(sidebarMenuButtonVariants({ variant, size }), className),
      },
      props
    ),
    render: !tooltip ? render : <TooltipTrigger render={render} />,
    state: {
      slot: "sidebar-menu-button",
      sidebar: "menu-button",
      size,
      active: isActive,
    },
  })
  if (!tooltip) {
    return comp
  }
  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    }
  }
  return (
    <Tooltip>
      {comp}
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
        {...tooltip}
      />
    </Tooltip>
  )
}
function SidebarMenuAction({
  className,
  render,
  showOnHover = false,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    showOnHover?: boolean
  }) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 after:absolute after:-inset-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 md:after:hidden [&>svg]:size-4 [&>svg]:shrink-0",
          showOnHover &&
            "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-active/menu-button:text-sidebar-accent-foreground aria-expanded:opacity-100 md:opacity-0",
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-menu-action",
      sidebar: "menu-action",
    },
  })
}
function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none group-data-[collapsible=icon]:hidden peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[size=default]/menu-button:top-1.5 peer-data-[size=lg]/menu-button:top-2.5 peer-data-[size=sm]/menu-button:top-1 peer-data-active/menu-button:text-sidebar-accent-foreground",
        className
      )}
      {...props}
    />
  )
}
function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean
}) {
  // Random width between 50 to 90%.
  const [width] = React.useState(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  })
  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
}
function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5 group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}
function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  )
}
function SidebarMenuSubButton({
  render,
  size = "md",
  isActive = false,
  className,
  ...props
}: useRender.ComponentProps<"a"> &
  React.ComponentProps<"a"> & {
    size?: "sm" | "md"
    isActive?: boolean
  }) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn(
          "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[size=md]:text-sm data-[size=sm]:text-xs data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-menu-sub-button",
      sidebar: "menu-sub-button",
      size,
      active: isActive,
    },
  })
}
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
````

## File: packages/ui/src/components/ui/sonner.tsx
````typescript
"use client"
import { useTheme } from "next-themes"
import { toast, Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react"
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}
export { Toaster, toast }
````

## File: packages/ui/src/hooks/use-mobile.ts
````typescript
import * as React from "react"
export function useIsMobile(mobileBreakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < mobileBreakpoint)
    return () => mql.removeEventListener("change", onChange)
  }, [mobileBreakpoint])
  return !!isMobile
}
````

## File: packages/ui/vitest.config.ts
````typescript
import { fileURLToPath } from "node:url"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig } from "vitest/config"
const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url))
export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  plugins: [tsconfigPaths({ ignoreConfigErrors: true })],
  test: {
    coverage: {
      thresholds: {
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
      },
    },
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    passWithNoTests: true,
    restoreMocks: true,
    setupFiles: ["./vitest.setup.ts"],
  },
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
})
````

## File: skills-lock.json
````json
{
  "version": 1,
  "skills": {
    "chrome-devtools": {
      "source": "chromedevtools/chrome-devtools-mcp",
      "sourceType": "github",
      "computedHash": "9bf87c1640e0d5ff76bdaabeb9d66ae00f526e72f9a5c3a010062a4e7d31626e"
    },
    "next-best-practices": {
      "source": "vercel-labs/next-skills",
      "sourceType": "github",
      "skillPath": "skills/next-best-practices/SKILL.md",
      "computedHash": "f4678aef4ffc10a5ea64a91e57abe5a5081af813b06d58d565caf3e8ef56e26c"
    },
    "shadcn": {
      "source": "shadcn/ui",
      "sourceType": "github",
      "computedHash": "642a177bee320618caa49f5106cadb4e7594c606e867f61ba7b56d19cf745cd5"
    },
    "vercel-react-best-practices": {
      "source": "vercel-labs/agent-skills",
      "sourceType": "github",
      "skillPath": "skills/react-best-practices/SKILL.md",
      "computedHash": "ca7b0c0c6e5f2750043f7f0cd72d16ac4e2abc48f9b5500d047a4b77a2506212"
    },
    "web-design-guidelines": {
      "source": "vercel-labs/agent-skills",
      "sourceType": "github",
      "skillPath": "skills/web-design-guidelines/SKILL.md",
      "computedHash": "f3bc47f890f42a44db1007ab390709ec368e4b8c089baee6b0007182236ac474"
    }
  }
}
````

## File: apps/web/AGENTS.md
````markdown
<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->
````

## File: apps/web/components.json
````json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-luma",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "../../packages/ui/src/styles/globals.css",
    "baseColor": "stone",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@workspace/ui/lib/utils",
    "ui": "@workspace/ui/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "menuColor": "default",
  "menuAccent": "subtle",
  "registries": {}
}
````

## File: apps/web/eslint.config.mjs
````javascript
import { nextJsConfig } from "@workspace/config/eslint/next-js"

/** @type {import("eslint").Linter.Config} */
export default nextJsConfig
````

## File: apps/web/postcss.config.mjs
````javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}

export default config
````

## File: apps/web/src/app/lesson/page.tsx
````typescript
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getDefaultLesson, getLessonById } from "@/features/lessons/lesson-data"
import { LessonPage } from "@/features/lessons/lesson-page"
type LessonRouteProps = {
  searchParams: Promise<{
    lesson_id?: string | string[]
  }>
}
export async function generateMetadata({
  searchParams,
}: LessonRouteProps): Promise<Metadata> {
  const lesson = resolveLesson(await searchParams)
  if (!lesson) {
    return {
      title: "레슨을 찾을 수 없습니다 — 한글쓰기",
      description: "요청한 한국어 글쓰기 레슨을 찾을 수 없습니다.",
    }
  }
  return {
    title: `${lesson.title} — 한글쓰기`,
    description: "한국어 글쓰기 레슨을 단계별로 학습합니다.",
  }
}
export default async function Page({ searchParams }: LessonRouteProps) {
  const lesson = resolveLesson(await searchParams)
  if (!lesson) {
    notFound()
  }
  return <LessonPage lesson={lesson} />
}
function resolveLesson(
  searchParams: Awaited<LessonRouteProps["searchParams"]>
) {
  const lessonIdParam = getLessonIdParam(searchParams.lesson_id)
  if (!lessonIdParam) {
    return getDefaultLesson()
  }
  return getLessonById(lessonIdParam)
}
function getLessonIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
````

## File: apps/web/src/components/layout/app-shell.tsx
````typescript
"use client"
import { usePathname } from "next/navigation"
import { GlobalNav } from "@/components/layout/global-nav"
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLessonRoute =
    pathname === "/lesson" || pathname.startsWith("/lesson/")
  if (isLessonRoute) {
    return (
      <div className="min-h-svh bg-background text-foreground">{children}</div>
    )
  }
  return (
    <div className="min-h-svh bg-background text-foreground">
      <GlobalNav />
      <main className="min-h-svh pb-[calc(4rem+env(safe-area-inset-bottom))] md:pt-14 md:pb-0">
        {children}
      </main>
    </div>
  )
}
````

## File: apps/web/src/features/courses/course-data.ts
````typescript
export type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand
}
export type CourseId = Brand<string, "course-id">
export interface Course {
  id: CourseId
  title: string
  description: string
  lessonCount: number
  thumbnail: string
}
export interface CourseCategory {
  id: string
  title: string
  courses: readonly Course[]
}
export function courseId(value: string): CourseId {
  return value as CourseId
}
export const courseCategories: readonly CourseCategory[] = [
  {
    id: "beginner",
    title: "입문자를 위한 코스",
    courses: [
      {
        id: courseId("sentence-structure"),
        title: "문장 구조의 기본",
        description:
          "한국어 문장의 뼈대를 이해하고 주어, 서술어, 목적어의 관계를 파악해 올바른 문장을 작성하는 방법을 배웁니다.",
        lessonCount: 12,
        thumbnail: "/course-thumbnails/sentence-structure.png",
      },
      {
        id: courseId("vocabulary-basics"),
        title: "어휘 확장 입문",
        description:
          "일상적인 글쓰기에 필요한 핵심 어휘를 익히고, 다양한 상황에서 정확한 단어를 선택하는 감각을 기릅니다.",
        lessonCount: 10,
        thumbnail: "/course-thumbnails/vocabulary-basics.png",
      },
      {
        id: courseId("reading-comprehension"),
        title: "독해와 요약",
        description:
          "글의 핵심 내용을 파악하고 간결하게 요약하는 능력을 키웁니다. 다양한 장르의 텍스트를 읽고 분석합니다.",
        lessonCount: 8,
        thumbnail: "/course-thumbnails/reading-comprehension.png",
      },
    ],
  },
  {
    id: "grammar",
    title: "문법 심화",
    courses: [
      {
        id: courseId("grammar-complete"),
        title: "문법 완성",
        description:
          "맞춤법, 띄어쓰기, 문장 부호 등 한국어 표기법의 핵심 규칙을 체계적으로 정리하고 실습합니다.",
        lessonCount: 15,
        thumbnail: "/course-thumbnails/grammar-complete.png",
      },
      {
        id: courseId("expression"),
        title: "표현력 향상",
        description:
          "같은 내용을 더 풍부하고 생동감 있게 전달하는 표현 방법을 연습합니다. 피동문, 사동문, 비유 표현을 다룹니다.",
        lessonCount: 11,
        thumbnail: "/course-thumbnails/expression.png",
      },
    ],
  },
  {
    id: "practical",
    title: "실전 글쓰기",
    courses: [
      {
        id: courseId("essay-writing"),
        title: "에세이 쓰기",
        description:
          "주제 선정부터 개요 작성, 본문 전개, 마무리까지 설득력 있는 에세이를 완성하는 전 과정을 익힙니다.",
        lessonCount: 14,
        thumbnail: "/course-thumbnails/essay-writing.png",
      },
      {
        id: courseId("business-writing"),
        title: "비즈니스 글쓰기",
        description:
          "이메일, 보고서, 제안서 등 업무 환경에서 요구되는 명확하고 전문적인 문서 작성 스킬을 기릅니다.",
        lessonCount: 13,
        thumbnail: "/course-thumbnails/business-writing.png",
      },
      {
        id: courseId("creative-writing"),
        title: "창의적 글쓰기",
        description:
          "상상력을 자극하는 글쓰기 기법을 배웁니다. 단편 소설, 시, 수필 등 다양한 창작 형식을 탐구합니다.",
        lessonCount: 16,
        thumbnail: "/course-thumbnails/creative-writing.png",
      },
    ],
  },
]
````

## File: apps/web/src/features/home/home-data.ts
````typescript
type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand
}
export type CourseId = Brand<string, "course-id">
export type LessonId = Brand<string, "lesson-id">
export type LessonStatus = "completed" | "next-up" | "locked"
export interface HomeLesson {
  id: LessonId
  name: string
  status: LessonStatus
}
export interface InProgressCourse {
  id: CourseId
  title: string
  description: string
  thumbnail: string
  completedLessons: number
  totalLessons: number
  progressPercent: number
  lessons: readonly HomeLesson[]
}
function courseId(value: string): CourseId {
  return value as CourseId
}
function lessonId(value: string): LessonId {
  return value as LessonId
}
export const inProgressCourses: readonly InProgressCourse[] = [
  {
    id: courseId("basic-sentence-writing"),
    title: "기초 문장 만들기",
    description: "주어, 서술어, 목적어의 긴밀한 관계 탐구",
    thumbnail: "/course-thumbnails/basic-sentence-writing.png",
    completedLessons: 5,
    totalLessons: 12,
    progressPercent: 41.6,
    lessons: [
      {
        id: lessonId("basic-sentence-writing-05"),
        name: "5강. 형용사 꾸밈과 명사의 배치",
        status: "completed",
      },
      {
        id: lessonId("basic-sentence-writing-06"),
        name: "6강. 부사어로 상황 더하기",
        status: "next-up",
      },
    ],
  },
  {
    id: courseId("emotion-writing"),
    title: "감정 표현 글쓰기",
    description: "추상적 상태를 정확한 서술어로 기술하는 법",
    thumbnail: "/course-thumbnails/emotion-writing.png",
    completedLessons: 2,
    totalLessons: 10,
    progressPercent: 20,
    lessons: [
      {
        id: lessonId("emotion-writing-02"),
        name: "2강. 감정 강도 표현",
        status: "completed",
      },
      {
        id: lessonId("emotion-writing-03"),
        name: "3강. 미묘한 감정 변화",
        status: "next-up",
      },
    ],
  },
  {
    id: courseId("business-email"),
    title: "비즈니스 이메일 작성법",
    description: "업무 격식과 명확한 전개로 신뢰감 구축",
    thumbnail: "/course-thumbnails/business-email.png",
    completedLessons: 0,
    totalLessons: 18,
    progressPercent: 0,
    lessons: [
      {
        id: lessonId("business-email-01"),
        name: "1강. 제목의 핵심 표현",
        status: "next-up",
      },
      {
        id: lessonId("business-email-02"),
        name: "2강. 첫 문장 목적 정리",
        status: "locked",
      },
    ],
  },
]
````

## File: apps/web/src/features/home/home-page.tsx
````typescript
import Image from "next/image"
import Link from "next/link"
import { ProgressBar } from "@workspace/ui/components/ui/progress-bar"
import { Separator } from "@workspace/ui/components/ui/separator"
import {
  CheckIcon,
  ChevronRightIcon,
  LockIcon,
  PlayIcon,
} from "@workspace/ui/components/icons"
import { cn } from "@workspace/ui/lib/utils"
import {
  inProgressCourses,
  type HomeLesson,
  type InProgressCourse,
  type LessonStatus,
} from "@/features/home/home-data"
export function HomePage() {
  return (
    <div className="w-full bg-background text-foreground">
      <div className="mx-auto flex max-w-[778px] flex-col px-4 pt-6 pb-10 sm:pt-8">
        <header className="mb-6 flex items-baseline justify-between gap-4 sm:mb-8">
          <h1 className="m-0 text-2xl font-bold tracking-normal">
            진행 중인 코스
          </h1>
          <p className="m-0 shrink-0 text-sm font-medium text-muted-foreground">
            총 {inProgressCourses.length}개 진행 중
          </p>
        </header>
        <main className="flex flex-col">
          {inProgressCourses.map((course, index) => (
            <CourseProgressItem
              key={course.id}
              course={course}
              isLast={index === inProgressCourses.length - 1}
            />
          ))}
        </main>
      </div>
    </div>
  )
}
function CourseProgressItem({
  course,
  isLast,
}: {
  course: InProgressCourse
  isLast: boolean
}) {
  return (
    <article className="flex flex-col">
      <Link
        href={`/courses/${course.id}`}
        className="group -mx-3 mb-2 flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-muted/70 active:bg-muted"
        aria-label={`${course.title} 코스 상세로 이동`}
      >
        <Image
          src={course.thumbnail}
          alt={`${course.title} 썸네일`}
          width={80}
          height={80}
          sizes="80px"
          className="size-20 shrink-0 rounded-2xl object-cover"
          priority={course.progressPercent > 40}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="m-0 truncate text-lg font-bold tracking-normal">
            {course.title}
          </h2>
          <p className="m-0 truncate text-[15px] text-muted-foreground">
            {course.description}
          </p>
          <div className="flex w-full items-center gap-3">
            <ProgressBar
              value={course.progressPercent}
              aria-label={`${course.title} 진행률`}
              className="flex-1 gap-0 [&_[data-slot=progress-indicator]]:bg-primary [&_[data-slot=progress-track]]:h-1.5"
            />
            <span className="shrink-0 text-[13px] font-medium text-muted-foreground">
              {Math.round(course.progressPercent)}% 완료
            </span>
          </div>
        </div>
        <ChevronRightIcon
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden="true"
        />
      </Link>
      <div className="mt-1 flex flex-col gap-1">
        {course.lessons.map((lesson) => (
          <LessonRow
            key={lesson.id}
            lesson={lesson}
            courseTitle={course.title}
          />
        ))}
      </div>
      {isLast ? null : <Separator className="my-6" />}
    </article>
  )
}
function LessonRow({
  lesson,
  courseTitle,
}: {
  lesson: HomeLesson
  courseTitle: string
}) {
  const statusLabel = getLessonStatusLabel(lesson.status)
  return (
    <Link
      href={`/lesson?lesson_id=${lesson.id}`}
      className={cn(
        "-mx-3 flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors hover:bg-muted/60 active:bg-muted",
        lesson.status === "next-up"
          ? "font-semibold text-foreground"
          : "font-medium text-muted-foreground hover:text-foreground",
        lesson.status === "locked" && "text-muted-foreground/80"
      )}
      aria-label={`${courseTitle}: ${lesson.name} ${statusLabel}`}
    >
      <LessonStatusIcon status={lesson.status} />
      <span className="flex-1 truncate">{lesson.name}</span>
    </Link>
  )
}
function LessonStatusIcon({ status }: { status: LessonStatus }) {
  if (status === "completed") {
    return <CheckIcon className="size-3.5 shrink-0" aria-hidden="true" />
  }
  if (status === "locked") {
    return <LockIcon className="size-3.5 shrink-0" aria-hidden="true" />
  }
  return (
    <PlayIcon className="size-3.5 shrink-0 fill-current" aria-hidden="true" />
  )
}
function getLessonStatusLabel(status: LessonStatus) {
  if (status === "completed") {
    return "복습"
  }
  if (status === "locked") {
    return "잠김"
  }
  return "시작"
}
````

## File: apps/web/src/features/lessons/lesson-data.ts
````typescript
import {
  courseDetails,
  type CourseChapter,
  type CourseDetail,
  type CourseLesson,
} from "@/features/courses/course-detail-data"
import type {
  Lesson,
  LessonId,
  LessonStep,
  LessonStepId,
  LessonTone,
} from "@/features/lessons/lesson-types"
export function lessonId(value: string): LessonId {
  return value as LessonId
}
export function lessonStepId(value: string): LessonStepId {
  return value as LessonStepId
}
type LessonPattern =
  | "sentence"
  | "vocabulary"
  | "reading"
  | "grammar"
  | "expression"
  | "essay"
  | "business"
  | "creative"
  | "emotion"
interface CourseProfile {
  categoryId: string
  categoryLabel: string
  pattern: LessonPattern
  tone: LessonTone
  coreSkill: string
  goodLabel: string
  avoidLabel: string
  correctSpan: string
  incorrectSpan: string
  writingGoal: string
}
interface LessonBuildInput {
  course: CourseDetail
  chapter: CourseChapter
  lesson: CourseLesson
  profile: CourseProfile
  courseLessonIndex: number
  chapterIndex: number
  lessonIndexInChapter: number
  nextLesson?: CourseLesson
}
interface CourseLessonRef {
  course: CourseDetail
  chapter: CourseChapter
  lesson: CourseLesson
  courseLessonIndex: number
  chapterIndex: number
  lessonIndexInChapter: number
  nextLesson?: CourseLesson
}
const courseProfiles: Record<string, CourseProfile> = {
  "sentence-structure": {
    categoryId: "beginner",
    categoryLabel: "문장 구조",
    pattern: "sentence",
    tone: "info",
    coreSkill: "문장 성분의 관계",
    goodLabel: "구조가 보이는 문장",
    avoidLabel: "관계가 흐린 문장",
    correctSpan: "주어와 서술어가 서로 맞물리는 부분",
    incorrectSpan: "의미 없이 길어진 꾸밈말",
    writingGoal: "짧고 정확한 문장",
  },
  "vocabulary-basics": {
    categoryId: "beginner",
    categoryLabel: "어휘 감각",
    pattern: "vocabulary",
    tone: "primary",
    coreSkill: "문맥에 맞는 단어 선택",
    goodLabel: "문맥에 맞는 표현",
    avoidLabel: "막연한 표현",
    correctSpan: "문맥을 좁히는 단어",
    incorrectSpan: "뜻이 넓어 흐려진 단어",
    writingGoal: "정확한 어휘가 들어간 문장",
  },
  "reading-comprehension": {
    categoryId: "beginner",
    categoryLabel: "독해와 요약",
    pattern: "reading",
    tone: "info",
    coreSkill: "핵심과 세부의 구분",
    goodLabel: "중심이 남은 요약",
    avoidLabel: "세부에 끌려간 요약",
    correctSpan: "글의 중심을 알려 주는 문장",
    incorrectSpan: "예시를 반복하는 문장",
    writingGoal: "핵심만 남긴 요약문",
  },
  "grammar-complete": {
    categoryId: "grammar",
    categoryLabel: "문법 완성",
    pattern: "grammar",
    tone: "warning",
    coreSkill: "규칙을 문맥에 적용하는 힘",
    goodLabel: "규칙이 맞는 문장",
    avoidLabel: "습관적으로 틀린 문장",
    correctSpan: "규칙을 적용해야 하는 자리",
    incorrectSpan: "소리만 믿고 쓴 표기",
    writingGoal: "오류 없이 다듬은 문장",
  },
  expression: {
    categoryId: "grammar",
    categoryLabel: "표현력",
    pattern: "expression",
    tone: "primary",
    coreSkill: "장면과 어조를 살리는 표현",
    goodLabel: "살아 있는 표현",
    avoidLabel: "평면적인 표현",
    correctSpan: "독자가 장면을 떠올리게 하는 표현",
    incorrectSpan: "설명만 남은 표현",
    writingGoal: "생생하게 전달되는 문장",
  },
  "essay-writing": {
    categoryId: "practical",
    categoryLabel: "에세이",
    pattern: "essay",
    tone: "info",
    coreSkill: "관점과 구조의 일관성",
    goodLabel: "관점이 선명한 글",
    avoidLabel: "소재만 나열한 글",
    correctSpan: "글의 관점을 드러내는 문장",
    incorrectSpan: "방향 없이 붙은 사례",
    writingGoal: "읽고 남는 에세이 문단",
  },
  "business-writing": {
    categoryId: "practical",
    categoryLabel: "비즈니스 글쓰기",
    pattern: "business",
    tone: "neutral",
    coreSkill: "목적과 요청의 명확성",
    goodLabel: "바로 실행할 수 있는 문장",
    avoidLabel: "책임이 흐린 문장",
    correctSpan: "수신자가 할 일을 알려 주는 부분",
    incorrectSpan: "판단을 미루는 표현",
    writingGoal: "업무 행동이 분명한 문단",
  },
  "creative-writing": {
    categoryId: "practical",
    categoryLabel: "창의적 글쓰기",
    pattern: "creative",
    tone: "primary",
    coreSkill: "관찰과 장면화",
    goodLabel: "장면이 움직이는 문장",
    avoidLabel: "설명으로 끝난 문장",
    correctSpan: "이미지와 행동이 함께 있는 표현",
    incorrectSpan: "감정 이름만 붙인 표현",
    writingGoal: "한 장면이 보이는 글",
  },
  "basic-sentence-writing": {
    categoryId: "home",
    categoryLabel: "기초 문장",
    pattern: "sentence",
    tone: "info",
    coreSkill: "가장 작은 문장을 정확히 세우는 힘",
    goodLabel: "호응이 맞는 문장",
    avoidLabel: "성분이 빠진 문장",
    correctSpan: "누가 무엇을 하는지 보이는 부분",
    incorrectSpan: "주어 없이 떠 있는 서술어",
    writingGoal: "기본 성분이 갖춰진 문장",
  },
  "emotion-writing": {
    categoryId: "home",
    categoryLabel: "감정 표현",
    pattern: "emotion",
    tone: "primary",
    coreSkill: "감정을 장면과 몸의 반응으로 옮기는 힘",
    goodLabel: "감정이 드러나는 장면",
    avoidLabel: "감정 이름만 적은 문장",
    correctSpan: "몸의 반응으로 감정을 보여 주는 표현",
    incorrectSpan: "그냥 슬펐다고 말하는 표현",
    writingGoal: "감정을 직접 말하지 않는 장면",
  },
  "business-email": {
    categoryId: "home",
    categoryLabel: "비즈니스 이메일",
    pattern: "business",
    tone: "neutral",
    coreSkill: "수신자가 바로 이해하는 이메일 구조",
    goodLabel: "목적이 보이는 이메일",
    avoidLabel: "빙빙 도는 이메일",
    correctSpan: "요청과 기한이 함께 있는 문장",
    incorrectSpan: "확인이 어렵게 흐린 문장",
    writingGoal: "목적과 요청이 분명한 이메일",
  },
}
const lessonCatalogSource = createLessonCatalog()
export const lessonCatalog: readonly Lesson[] = lessonCatalogSource
export const prototypeLesson: Lesson = lessonCatalog[0] ?? createEmptyFallback()
const lessonMap = new Map(lessonCatalog.map((lesson) => [lesson.id, lesson]))
validateLessonCatalog(lessonCatalog)
export function getLessonById(id: string): Lesson | undefined {
  return lessonMap.get(lessonId(id))
}
export function getDefaultLesson(): Lesson {
  return prototypeLesson
}
export function getNextLessonId(currentLessonId: LessonId): LessonId | null {
  return lessonMap.get(currentLessonId)?.nextLessonId ?? null
}
function createLessonCatalog(): readonly Lesson[] {
  return courseDetails.flatMap((course) => {
    const profile = getCourseProfile(course)
    const lessonRefs = getCourseLessonRefs(course)
    return lessonRefs.map((lessonRef) =>
      createLesson({
        ...lessonRef,
        profile,
      })
    )
  })
}
function getCourseProfile(course: CourseDetail): CourseProfile {
  const profile = courseProfiles[String(course.id)]
  if (!profile) {
    throw new Error(`Missing lesson course profile: ${course.id}`)
  }
  return profile
}
function getCourseLessonRefs(course: CourseDetail): readonly CourseLessonRef[] {
  const refs = course.chapters.flatMap((chapter, chapterIndex) =>
    chapter.lessons.map((lesson, lessonIndexInChapter) => ({
      course,
      chapter,
      lesson,
      chapterIndex,
      lessonIndexInChapter,
    }))
  )
  return refs.map((ref, courseLessonIndex) => ({
    ...ref,
    courseLessonIndex,
    nextLesson: refs[courseLessonIndex + 1]?.lesson,
  }))
}
function createLesson(input: LessonBuildInput): Lesson {
  const currentLessonId = lessonId(String(input.lesson.lessonId))
  const middleSteps = createMiddleSteps(input, currentLessonId)
  const totalSteps = middleSteps.length + 3
  const xpEarned =
    10 + middleSteps.reduce((total, step) => total + step.points, 0) + 10
  const summaryOrder = totalSteps - 1
  const steps: readonly LessonStep[] = [
    lessonStep(currentLessonId, 1, "INTRO", {
      title: input.lesson.title,
      category: input.profile.categoryLabel,
      tagTone: input.profile.tone,
      bullets: [
        `${input.profile.coreSkill}을 ${input.lesson.title} 맥락에서 익힙니다.`,
        input.lesson.description,
        `마지막에는 ${input.profile.writingGoal}을 직접 작성합니다.`,
      ],
      estimatedMinutes: getEstimatedMinutes(input.profile.pattern, totalSteps),
      totalSteps,
      xpAvailable: xpEarned,
    }),
    ...middleSteps,
    lessonStep(currentLessonId, summaryOrder, "SUMMARY", {
      points: [
        {
          number: 1,
          text: `${input.lesson.title}의 핵심은 ${input.profile.coreSkill}을 실제 문장 안에서 확인하는 것입니다.`,
          icon: "1",
        },
        {
          number: 2,
          text: `${input.profile.avoidLabel}은 줄이고 ${input.profile.goodLabel}을 남기면 글의 목적이 선명해집니다.`,
          icon: "2",
        },
        {
          number: 3,
          text: `다음 글을 쓸 때는 "${input.lesson.description}"라는 기준을 먼저 떠올려보세요.`,
          icon: "3",
        },
      ],
      nextLesson: input.nextLesson
        ? {
            title: input.nextLesson.title,
            description: input.nextLesson.description,
          }
        : undefined,
      shareableQuote: `${input.lesson.title}: 좋은 글은 기준을 알고 고친 문장으로 완성된다.`,
    }),
    lessonStep(currentLessonId, totalSteps, "COMPLETE", {
      celebrationStyle: "confetti",
      xpEarned,
      showStreak: true,
      lessonStats: {
        correctRate: 82 + (input.courseLessonIndex % 13),
        writingCount: getWritingStepCount(middleSteps),
        aiFeedbackCount: middleSteps.some((step) => step.type === "AI_FEEDBACK")
          ? 1
          : 0,
      },
      nextAction: "next-lesson",
    }),
  ]
  return {
    id: currentLessonId,
    title: input.lesson.title,
    categoryId: input.profile.categoryId,
    courseId: String(input.course.id),
    unitNumber: input.chapterIndex + 1,
    nextLessonId: input.nextLesson
      ? lessonId(String(input.nextLesson.lessonId))
      : undefined,
    steps,
  }
}
function createMiddleSteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  switch (input.profile.pattern) {
    case "sentence":
      return createSentenceSteps(input, currentLessonId)
    case "vocabulary":
      return createVocabularySteps(input, currentLessonId)
    case "reading":
      return createReadingSteps(input, currentLessonId)
    case "grammar":
      return createGrammarSteps(input, currentLessonId)
    case "expression":
      return createExpressionSteps(input, currentLessonId)
    case "essay":
      return createEssaySteps(input, currentLessonId)
    case "business":
      return createBusinessSteps(input, currentLessonId)
    case "creative":
      return createCreativeSteps(input, currentLessonId)
    case "emotion":
      return createEmotionSteps(input, currentLessonId)
  }
}
function createSentenceSteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  const steps: LessonStep[] = []
  const add = createStepAdder(steps, currentLessonId)
  add(
    "CONCEPT",
    conceptContent(input, "문장은 성분이 아니라 관계로 읽어야 합니다.")
  )
  add("EXAMPLE_REVEAL", exampleRevealContent(input))
  add("MULTIPLE_CHOICE", multipleChoiceContent(input))
  add("FILL_BLANK", fillBlankContent(input))
  add("REORDER", reorderContent(input))
  const writeStep = add("SHORT_WRITE", shortWriteContent(input))
  add("AI_FEEDBACK", aiFeedbackContent(input, writeStep.id))
  add("CHECKLIST", checklistContent(input))
  return steps
}
function createVocabularySteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  const steps: LessonStep[] = []
  const add = createStepAdder(steps, currentLessonId)
  add(
    "CONCEPT",
    conceptContent(input, "좋은 단어는 뜻보다 쓰이는 장면이 먼저 보입니다.")
  )
  add("COMPARE", compareContent(input))
  add("MATCH", matchContent(input))
  add("FILL_BLANK", fillBlankContent(input))
  add("CLASSIFY", classifyContent(input))
  const writeStep = add("SHORT_WRITE", shortWriteContent(input))
  add("AI_FEEDBACK", aiFeedbackContent(input, writeStep.id))
  add("REFLECTION", reflectionContent(input), { required: false, points: 5 })
  return steps
}
function createReadingSteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  const steps: LessonStep[] = []
  const add = createStepAdder(steps, currentLessonId)
  add("READING_PASSAGE", readingPassageContent(input))
  add("WORD_SELECT", wordSelectContent(input))
  add("MULTIPLE_CHOICE", multipleChoiceContent(input))
  add("COMPARE", compareContent(input))
  add("REORDER", reorderContent(input))
  const writeStep = add("SHORT_WRITE", shortWriteContent(input))
  add("AI_FEEDBACK", aiFeedbackContent(input, writeStep.id))
  return steps
}
function createGrammarSteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  const steps: LessonStep[] = []
  const add = createStepAdder(steps, currentLessonId)
  add(
    "CONCEPT",
    conceptContent(input, "문법 규칙은 외운 뒤보다 적용할 때 더 분명해집니다.")
  )
  add("MULTIPLE_CHOICE", multipleChoiceContent(input))
  add("FILL_BLANK", fillBlankContent(input))
  add("WORD_SELECT", wordSelectContent(input))
  add("REVISION", revisionContent(input))
  add("CHECKLIST", checklistContent(input))
  add("TRANSCRIBE", transcribeContent(input))
  return steps
}
function createExpressionSteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  const steps: LessonStep[] = []
  const add = createStepAdder(steps, currentLessonId)
  add(
    "CONCEPT",
    conceptContent(
      input,
      "표현력은 화려함이 아니라 장면을 정확히 전달하는 힘입니다."
    )
  )
  add("EXAMPLE_REVEAL", exampleRevealContent(input))
  add("COMPARE", compareContent(input))
  add("WORD_SELECT", wordSelectContent(input))
  add("CLASSIFY", classifyContent(input))
  const writeStep = add("LONG_WRITE", longWriteContent(input))
  add("AI_FEEDBACK", aiFeedbackContent(input, writeStep.id))
  add("REVISION", revisionContent(input))
  return steps
}
function createEssaySteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  const steps: LessonStep[] = []
  const add = createStepAdder(steps, currentLessonId)
  add(
    "CONCEPT",
    conceptContent(input, "에세이는 소재보다 관점이 먼저 독자를 붙잡습니다.")
  )
  add("READING_PASSAGE", readingPassageContent(input))
  add("COMPARE", compareContent(input))
  add("REORDER", reorderContent(input))
  const writeStep = add("LONG_WRITE", longWriteContent(input))
  add("AI_FEEDBACK", aiFeedbackContent(input, writeStep.id))
  add("REVISION", revisionContent(input))
  add("REFLECTION", reflectionContent(input), { required: false, points: 5 })
  return steps
}
function createBusinessSteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  const steps: LessonStep[] = []
  const add = createStepAdder(steps, currentLessonId)
  add(
    "CONCEPT",
    conceptContent(
      input,
      "업무 글은 읽는 사람이 다음 행동을 정할 수 있어야 합니다."
    )
  )
  add("EXAMPLE_REVEAL", exampleRevealContent(input))
  add("MULTIPLE_CHOICE", multipleChoiceContent(input))
  add("REORDER", reorderContent(input))
  add("REVISION", revisionContent(input))
  const writeStep = add("LONG_WRITE", longWriteContent(input))
  add("AI_FEEDBACK", aiFeedbackContent(input, writeStep.id))
  add("CHECKLIST", checklistContent(input))
  return steps
}
function createCreativeSteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  const steps: LessonStep[] = []
  const add = createStepAdder(steps, currentLessonId)
  add(
    "CONCEPT",
    conceptContent(
      input,
      "창작 글은 설명을 덜고 독자가 볼 수 있는 증거를 남길 때 힘이 생깁니다."
    )
  )
  add("READING_PASSAGE", readingPassageContent(input))
  add("EXAMPLE_REVEAL", exampleRevealContent(input))
  add("WORD_SELECT", wordSelectContent(input))
  add("CLASSIFY", classifyContent(input))
  const writeStep = add("LONG_WRITE", longWriteContent(input))
  add("AI_FEEDBACK", aiFeedbackContent(input, writeStep.id))
  add("REFLECTION", reflectionContent(input), { required: false, points: 5 })
  return steps
}
function createEmotionSteps(
  input: LessonBuildInput,
  currentLessonId: LessonId
): readonly LessonStep[] {
  const steps: LessonStep[] = []
  const add = createStepAdder(steps, currentLessonId)
  add(
    "CONCEPT",
    conceptContent(input, "감정은 이름보다 흔적을 보여줄 때 더 오래 남습니다.")
  )
  add("EXAMPLE_REVEAL", exampleRevealContent(input))
  add("COMPARE", compareContent(input))
  add("CLASSIFY", classifyContent(input))
  const writeStep = add("LONG_WRITE", longWriteContent(input))
  add("AI_FEEDBACK", aiFeedbackContent(input, writeStep.id))
  add("REVISION", revisionContent(input))
  add("REFLECTION", reflectionContent(input), { required: false, points: 5 })
  return steps
}
function createStepAdder(steps: LessonStep[], currentLessonId: LessonId) {
  return function add<TType extends LessonStep["type"]>(
    type: TType,
    content: Extract<LessonStep, { type: TType }>["content"],
    options?: {
      points?: number
      required?: boolean
    }
  ): Extract<LessonStep, { type: TType }> {
    const order = steps.length + 2
    const step = {
      id: lessonStepId(`${currentLessonId}-step-${order}`),
      type,
      order,
      points: options?.points ?? getDefaultPoints(type),
      required: options?.required ?? true,
      content,
    } as Extract<LessonStep, { type: TType }>
    steps.push(step)
    return step
  }
}
function lessonStep<TType extends LessonStep["type"]>(
  currentLessonId: LessonId,
  order: number,
  type: TType,
  content: Extract<LessonStep, { type: TType }>["content"],
  options?: {
    points?: number
    required?: boolean
  }
): Extract<LessonStep, { type: TType }> {
  return {
    id: lessonStepId(`${currentLessonId}-step-${order}`),
    type,
    order,
    points: options?.points ?? getDefaultPoints(type),
    required: options?.required ?? true,
    content,
  } as Extract<LessonStep, { type: TType }>
}
function conceptContent(input: LessonBuildInput, principle: string) {
  return {
    subtitle: `${input.lesson.title}의 기준`,
    body: `${input.lesson.description}\n\n${principle} 이번 레슨에서는 "${input.lesson.title}"을/를 기준으로 문장을 읽고, 고르고, 직접 고쳐 씁니다.`,
    highlight: {
      icon: "!",
      text: `${input.profile.goodLabel}을 만들려면 ${input.profile.avoidLabel}을 먼저 찾아야 합니다.`,
      tone: input.profile.tone,
    },
    keyTerms: [
      {
        term: input.profile.coreSkill,
        definition: `${input.chapter.title} 단원에서 반복해서 쓰는 판단 기준입니다.`,
      },
      {
        term: input.profile.writingGoal,
        definition: `이번 레슨의 마지막 쓰기 과제에서 완성할 결과물입니다.`,
      },
    ],
  } satisfies Extract<LessonStep, { type: "CONCEPT" }>["content"]
}
function exampleRevealContent(input: LessonBuildInput) {
  return {
    instruction: `"${input.lesson.title}" 관점에서 두 문장을 비교해보세요.`,
    bad: {
      label: input.profile.avoidLabel,
      text: `${input.lesson.title}은 중요하다고 볼 수 있으며 여러모로 신경 써야 하는 부분이다.`,
    },
    good: {
      label: input.profile.goodLabel,
      text: `${input.lesson.description} 그래서 문장을 쓰기 전 ${input.profile.coreSkill}을 먼저 확인한다.`,
    },
    analysis: `${input.profile.avoidLabel}은 판단 기준이 흐립니다. 반면 좋은 예시는 "${input.lesson.title}"에서 해야 할 행동을 바로 보여 줍니다.`,
    revealTrigger: "button",
  } satisfies Extract<LessonStep, { type: "EXAMPLE_REVEAL" }>["content"]
}
function readingPassageContent(input: LessonBuildInput) {
  return {
    instruction: "다음 짧은 지문을 읽고 핵심 문장을 표시해보세요.",
    title: `${input.lesson.title} 연습 지문`,
    source: "한글쓰기 레슨 자체 제작 지문",
    text: `${input.chapter.title}을 배울 때 가장 먼저 해야 할 일은 글의 목적을 좁히는 것이다. ${input.lesson.description} 이 기준이 없으면 문장은 길어지지만 남는 내용은 줄어든다.\n\n좋은 글은 한 번에 완성되지 않는다. 먼저 ${input.profile.coreSkill}을 확인하고, 그 다음 ${input.profile.avoidLabel}을 덜어낸다. 마지막으로 독자가 실제로 기억할 한 문장을 남긴다.\n\n오늘의 과제는 거창한 글을 쓰는 것이 아니다. "${input.lesson.title}"이라는 한 가지 기준으로 문장을 읽고 고치는 것이다.`,
    estimatedReadMinutes: 1,
    highlightEnabled: true,
    focusQuestion: `${input.profile.goodLabel}을 보여 주는 문장은 어디인가요?`,
  } satisfies Extract<LessonStep, { type: "READING_PASSAGE" }>["content"]
}
function compareContent(input: LessonBuildInput) {
  return {
    instruction: `${input.lesson.title}을/를 적용한 버전과 적용하지 않은 버전을 비교하세요.`,
    versions: [
      {
        label: "초안",
        text: `${input.lesson.title}에 대해 여러 가지를 생각해 보았고, 전반적으로 좋은 방향으로 써야 한다.`,
        tone: "danger",
      },
      {
        label: "개선안",
        text: `${input.lesson.description} 이를 위해 첫 문장부터 ${input.profile.coreSkill}을 드러낸다.`,
        tone: input.profile.tone,
      },
      {
        label: "응용안",
        text: `${input.chapter.title}의 흐름에 맞춰 ${input.profile.writingGoal}을 한 문단 안에서 완성한다.`,
        tone: "info",
      },
    ],
    analysis: `초안은 의도만 있고 판단 기준이 없습니다. 개선안과 응용안은 ${input.profile.goodLabel}을 중심으로 독자가 확인할 수 있는 행동을 남깁니다.`,
    discussionQuestion: `내 글에서 ${input.profile.avoidLabel}이 자주 나타나는 위치는 어디일까요?`,
  } satisfies Extract<LessonStep, { type: "COMPARE" }>["content"]
}
function multipleChoiceContent(input: LessonBuildInput) {
  return {
    context: `${input.lesson.title}: ${input.lesson.description}`,
    question: "이번 레슨의 핵심 기준에 가장 가까운 설명은 무엇인가요?",
    options: [
      {
        id: "A",
        text: `${input.profile.coreSkill}을 확인하고 ${input.profile.writingGoal}으로 옮긴다.`,
        isCorrect: true,
      },
      {
        id: "B",
        text: "문장을 길게 늘려 더 성실해 보이게 만든다.",
        isCorrect: false,
      },
      {
        id: "C",
        text: "익숙한 표현을 그대로 두고 맞춤법만 확인한다.",
        isCorrect: false,
      },
      {
        id: "D",
        text: "독자가 알아서 맥락을 추측하도록 여지를 많이 남긴다.",
        isCorrect: false,
      },
    ],
    explanation: `정답은 A입니다. "${input.lesson.title}"에서는 ${input.lesson.description} 그래서 ${input.profile.coreSkill}을 문장 안에서 확인해야 합니다.`,
    allowMultiple: false,
    shuffleOptions: false,
  } satisfies Extract<LessonStep, { type: "MULTIPLE_CHOICE" }>["content"]
}
function fillBlankContent(input: LessonBuildInput) {
  return {
    instruction: "빈칸에 들어갈 핵심 표현을 고르세요.",
    template: `${input.lesson.title}에서는 {{blank_1}}을/를 먼저 확인하고, 초안에서 {{blank_2}}을/를 덜어냅니다.`,
    blanks: [
      {
        id: "blank_1",
        correctAnswers: [input.profile.coreSkill],
        hint: "이번 코스에서 반복하는 판단 기준",
      },
      {
        id: "blank_2",
        correctAnswers: [input.profile.avoidLabel],
        hint: "초안에서 줄여야 할 표현",
      },
    ],
    inputMode: "word-bank",
    wordBank: [
      input.profile.coreSkill,
      input.profile.goodLabel,
      input.profile.avoidLabel,
      input.profile.writingGoal,
      "글자 수",
      "장식적인 표현",
    ],
    explanation: `${input.profile.coreSkill}을 먼저 세우면 ${input.profile.avoidLabel}을 더 쉽게 발견할 수 있습니다.`,
    caseSensitive: false,
  } satisfies Extract<LessonStep, { type: "FILL_BLANK" }>["content"]
}
function wordSelectContent(input: LessonBuildInput) {
  return {
    instruction: `${input.profile.goodLabel}에 해당하는 부분을 모두 선택하세요.`,
    markedText: `{{${input.profile.correctSpan}:s1:correct}}은 "${input.lesson.title}"의 기준을 보여 줍니다. {{${input.profile.incorrectSpan}:s2:incorrect}}은 초안에서 줄여야 합니다. {{${input.lesson.description}:s3:correct}}`,
    globalExplanation: `${input.profile.correctSpan}처럼 기준을 드러내는 표현을 남기고, ${input.profile.incorrectSpan}처럼 흐린 표현은 고칩니다.`,
    spanExplanations: {
      s1: "이번 레슨의 핵심 판단 기준입니다.",
      s2: "의미가 흐려져 개선이 필요한 표현입니다.",
      s3: "레슨 설명 자체가 오늘의 적용 방향을 알려 줍니다.",
    },
  } satisfies Extract<LessonStep, { type: "WORD_SELECT" }>["content"]
}
function reorderContent(input: LessonBuildInput) {
  return {
    instruction: `${input.lesson.title}을 적용하는 순서로 문장을 배열하세요.`,
    items: [
      {
        id: "r1",
        text: `${input.profile.avoidLabel}을 초안에서 찾는다.`,
        correctOrder: 2,
      },
      {
        id: "r2",
        text: `${input.profile.writingGoal}으로 한 문장을 다시 쓴다.`,
        correctOrder: 4,
      },
      {
        id: "r3",
        text: `${input.profile.coreSkill}을 오늘의 기준으로 정한다.`,
        correctOrder: 1,
      },
      {
        id: "r4",
        text: `${input.profile.goodLabel}이 남도록 표현을 고른다.`,
        correctOrder: 3,
      },
    ],
    itemType: "sentence",
    explanation: `기준 설정 → 문제 발견 → 개선 표현 선택 → 재작성 순서가 가장 안정적입니다.`,
    showNumberHint: true,
  } satisfies Extract<LessonStep, { type: "REORDER" }>["content"]
}
function matchContent(input: LessonBuildInput) {
  return {
    instruction: "왼쪽 개념과 오른쪽 설명을 연결하세요.",
    pairs: [
      {
        id: "p1",
        left: input.profile.coreSkill,
        right: `${input.lesson.title}의 판단 기준`,
      },
      {
        id: "p2",
        left: input.profile.goodLabel,
        right: "초안에 남겨야 할 방향",
      },
      {
        id: "p3",
        left: input.profile.avoidLabel,
        right: "퇴고 때 먼저 줄일 표현",
      },
      {
        id: "p4",
        left: input.profile.writingGoal,
        right: "레슨 마지막에 직접 만들 결과물",
      },
    ],
    shuffleRight: true,
    displayMode: "tap-connect",
    explanation: `네 개념은 ${input.lesson.title} 레슨 전체를 관통하는 작은 지도입니다.`,
  } satisfies Extract<LessonStep, { type: "MATCH" }>["content"]
}
function classifyContent(input: LessonBuildInput) {
  return {
    instruction: "각 문장을 알맞은 묶음으로 분류하세요.",
    categories: [
      {
        id: "good",
        label: input.profile.goodLabel,
        tone: input.profile.tone,
      },
      {
        id: "avoid",
        label: input.profile.avoidLabel,
        tone: "danger",
      },
    ],
    items: [
      {
        id: "i1",
        text: `${input.lesson.description}`,
        correctCategoryId: "good",
      },
      {
        id: "i2",
        text: `${input.lesson.title}은 여러모로 중요하므로 잘해야 한다.`,
        correctCategoryId: "avoid",
      },
      {
        id: "i3",
        text: `${input.profile.coreSkill}을 기준으로 첫 문장을 고친다.`,
        correctCategoryId: "good",
      },
      {
        id: "i4",
        text: "독자가 알아서 의미를 파악할 수 있을 것이다.",
        correctCategoryId: "avoid",
      },
    ],
    globalExplanation: `${input.profile.goodLabel}은 행동과 기준이 보입니다. ${input.profile.avoidLabel}은 의도만 있고 확인 가능한 변화가 없습니다.`,
  } satisfies Extract<LessonStep, { type: "CLASSIFY" }>["content"]
}
function shortWriteContent(input: LessonBuildInput) {
  return {
    instruction: `${input.lesson.title} 짧은 쓰기`,
    prompt: `${input.lesson.description} 이 기준을 반영해 한 문장을 새로 써보세요.`,
    sourceText: `${input.profile.avoidLabel}: ${input.lesson.title}은 중요해서 잘 써야 한다.`,
    maxChars: 220,
    minChars: 20,
    referenceAnswer: `${input.profile.coreSkill}을 먼저 확인한 뒤, ${input.profile.writingGoal}으로 문장을 다듬는다.`,
    aiEvaluationEnabled: false,
    showReferenceAfterSubmit: true,
  } satisfies Extract<LessonStep, { type: "SHORT_WRITE" }>["content"]
}
function longWriteContent(input: LessonBuildInput) {
  return {
    instruction: `${input.lesson.title} 글쓰기 과제`,
    topic: `${input.lesson.description} 이 목표가 드러나도록 150자 안팎의 문단을 작성하세요.`,
    context: `${input.chapter.label} "${input.chapter.title}" 단원의 흐름을 떠올리며 ${input.profile.goodLabel}을 남겨보세요.`,
    structureGuide: [
      `첫 문장: ${input.profile.coreSkill}을 드러내기`,
      `중간 문장: ${input.profile.avoidLabel}을 피하고 구체화하기`,
      `마지막 문장: ${input.profile.writingGoal}으로 마무리하기`,
    ],
    minChars: 80,
    targetChars: 150,
    maxChars: 360,
    aiEvaluationEnabled: false,
    evaluationCriteria: `${input.profile.coreSkill}, ${input.profile.goodLabel}, 문장 흐름`,
    draftSaveEnabled: true,
  } satisfies Extract<LessonStep, { type: "LONG_WRITE" }>["content"]
}
function aiFeedbackContent(
  input: LessonBuildInput,
  sourceStepId: LessonStepId
) {
  return {
    sourceStepId,
    feedbackPrompt: `${input.lesson.title} 과제에서 ${input.profile.coreSkill}이 드러나는지 평가합니다.`,
    focusAreas: ["clarity", "expression"],
    showScore: true,
    scoreRange: [0, 100],
    allowRevision: true,
    maxRevisions: 2,
  } satisfies Extract<LessonStep, { type: "AI_FEEDBACK" }>["content"]
}
function revisionContent(input: LessonBuildInput) {
  return {
    instruction: "아래 초안을 퇴고해보세요.",
    revisionTask: `${input.profile.avoidLabel}을 줄이고 ${input.profile.goodLabel}으로 바꾸세요.`,
    originalText: `${input.lesson.title}은 중요한 내용이다. 여러 가지 점에서 신경 써야 하며, 좋은 글이 되도록 잘 정리하는 것이 필요하다.`,
    hints: [
      `${input.profile.coreSkill}이 보이는 문장으로 바꿔보세요.`,
      `${input.lesson.description}라는 목표가 직접 드러나는지 확인하세요.`,
    ],
    revisionType: "targeted",
    referenceRevision: `${input.lesson.description} 그래서 초안의 흐린 표현을 덜고 ${input.profile.writingGoal}으로 다시 쓴다.`,
    aiEvaluationEnabled: false,
    evaluationCriteria: `${input.profile.avoidLabel} 제거, ${input.profile.goodLabel} 강화`,
  } satisfies Extract<LessonStep, { type: "REVISION" }>["content"]
}
function checklistContent(input: LessonBuildInput) {
  return {
    instruction: `${input.lesson.title} 점검표`,
    items: [
      {
        id: "c1",
        text: `${input.profile.coreSkill}이 문장에 드러나나요?`,
        required: true,
        tip: "문장을 읽고 판단 기준을 한 단어로 말할 수 있어야 합니다.",
      },
      {
        id: "c2",
        text: `${input.profile.avoidLabel}을 줄였나요?`,
        required: true,
      },
      {
        id: "c3",
        text: `${input.profile.goodLabel}이 독자에게 바로 보이나요?`,
        required: false,
      },
      {
        id: "c4",
        text: `${input.profile.writingGoal}로 마무리됐나요?`,
        required: false,
      },
    ],
    completionMode: "minimum",
    minimumChecks: 2,
    saveResponses: true,
  } satisfies Extract<LessonStep, { type: "CHECKLIST" }>["content"]
}
function reflectionContent(input: LessonBuildInput) {
  return {
    question: `${input.lesson.title}을 내 글에 적용한다면 어디부터 고치고 싶나요?`,
    context: `${input.lesson.description} 오늘 배운 기준을 실제 글쓰기 습관과 연결해봅니다.`,
    promptStarters: [
      "내가 자주 쓰는 흐린 표현은...",
      "다음 글에서 먼저 확인할 것은...",
      "오늘 가장 도움이 된 기준은...",
    ],
    minChars: 20,
    saveToJournal: true,
    category: input.profile.categoryLabel,
    isSkippable: true,
  } satisfies Extract<LessonStep, { type: "REFLECTION" }>["content"]
}
function transcribeContent(input: LessonBuildInput) {
  return {
    instruction: "핵심 문장을 그대로 따라 써보세요.",
    sourceText: `${input.lesson.description} ${input.profile.coreSkill}을 기준으로 ${input.profile.writingGoal}을 완성한다.`,
    source: `${input.lesson.title} 핵심 문장`,
    showMatchRate: true,
    caseSensitive: false,
    punctuationSensitive: true,
    focusNote: "표기와 띄어쓰기를 함께 확인하세요.",
  } satisfies Extract<LessonStep, { type: "TRANSCRIBE" }>["content"]
}
function getDefaultPoints(type: LessonStep["type"]) {
  if (type === "INTRO" || type === "SUMMARY") {
    return 10
  }
  if (type === "COMPLETE") {
    return 0
  }
  if (type === "SHORT_WRITE" || type === "REVISION") {
    return 15
  }
  if (type === "LONG_WRITE") {
    return 25
  }
  if (type === "AI_FEEDBACK") {
    return 5
  }
  return 10
}
function getEstimatedMinutes(pattern: LessonPattern, totalSteps: number) {
  if (pattern === "essay" || pattern === "creative" || pattern === "business") {
    return Math.max(12, totalSteps + 4)
  }
  if (pattern === "expression" || pattern === "emotion") {
    return Math.max(10, totalSteps + 2)
  }
  return Math.max(8, totalSteps)
}
function getWritingStepCount(steps: readonly LessonStep[]) {
  return steps.filter(
    (step) => step.type === "SHORT_WRITE" || step.type === "LONG_WRITE"
  ).length
}
function validateLessonCatalog(catalog: readonly Lesson[]) {
  const courseLessonIds = new Set(
    courseDetails.flatMap((course) =>
      course.chapters.flatMap((chapter) =>
        chapter.lessons.map((lesson) => String(lesson.lessonId))
      )
    )
  )
  const catalogIds = new Set(catalog.map((lesson) => String(lesson.id)))
  for (const courseLessonId of courseLessonIds) {
    if (!catalogIds.has(courseLessonId)) {
      throw new Error(
        `Missing lesson data for course lesson: ${courseLessonId}`
      )
    }
  }
  for (const catalogId of catalogIds) {
    if (!courseLessonIds.has(catalogId)) {
      throw new Error(
        `Lesson data has no course curriculum match: ${catalogId}`
      )
    }
  }
  if (catalogIds.size !== catalog.length) {
    throw new Error("Lesson data contains duplicated lesson IDs")
  }
  for (const lesson of catalog) {
    validateLessonSteps(lesson)
  }
}
function validateLessonSteps(lesson: Lesson) {
  const stepIds = new Set(lesson.steps.map((step) => String(step.id)))
  if (stepIds.size !== lesson.steps.length) {
    throw new Error(`Lesson has duplicated step IDs: ${lesson.id}`)
  }
  lesson.steps.forEach((step, index) => {
    const expectedOrder = index + 1
    if (step.order !== expectedOrder) {
      throw new Error(
        `Lesson step order mismatch: ${lesson.id} expected ${expectedOrder}`
      )
    }
  })
  const introStep = lesson.steps[0]
  if (introStep?.type !== "INTRO") {
    throw new Error(`Lesson must start with INTRO: ${lesson.id}`)
  }
  if (introStep.content.totalSteps !== lesson.steps.length) {
    throw new Error(`Lesson intro totalSteps mismatch: ${lesson.id}`)
  }
  const completeStep = lesson.steps[lesson.steps.length - 1]
  if (completeStep?.type !== "COMPLETE") {
    throw new Error(`Lesson must end with COMPLETE: ${lesson.id}`)
  }
  for (const step of lesson.steps) {
    if (step.type !== "AI_FEEDBACK") {
      continue
    }
    if (!stepIds.has(String(step.content.sourceStepId))) {
      throw new Error(
        `AI feedback references a missing source step: ${lesson.id}`
      )
    }
  }
}
function createEmptyFallback(): Lesson {
  throw new Error("Lesson catalog must include at least one lesson")
}
````

## File: apps/web/src/features/lessons/lesson-experience.tsx
````typescript
"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@workspace/ui/components/ui/badge"
import { Button } from "@workspace/ui/components/ui/button"
import { Card, CardContent } from "@workspace/ui/components/ui/card"
import { Checkbox } from "@workspace/ui/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/ui/dialog"
import { ProgressBar } from "@workspace/ui/components/ui/progress-bar"
import { Textarea } from "@workspace/ui/components/ui/textarea"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/ui/toggle-group"
import {
  CheckIcon,
  GripVerticalIcon,
  HeartIcon,
  SparklesIcon,
  XIcon,
} from "@workspace/ui/components/icons"
import { cn } from "@workspace/ui/lib/utils"
import {
  createConfettiPieces,
  findStepIndexByType,
  getBlankStatus,
  getChecklistComplete,
  getChoiceStatus,
  getClassifyStatus,
  getDeterministicOrder,
  getLessonProgress,
  getMatchRate,
  getMockAiFeedback,
  isSelectedChoiceCorrect,
  parseFillBlankTemplate,
  parseMarkedText,
  splitMarkdownEmphasis,
  splitParagraphs,
  type BlankAssignments,
  type ChoiceStatus,
  type ClassifyAssignments,
  type ClassifyStatus,
  type MatchConnections,
} from "@/features/lessons/lesson-logic"
import type {
  AiFeedbackContent,
  ChecklistContent,
  ClassifyContent,
  CompareContent,
  CompleteContent,
  ConceptContent,
  ExampleRevealContent,
  FillBlankContent,
  IntroContent,
  Lesson,
  LessonStep,
  LessonStepId,
  LessonTone,
  LongWriteContent,
  MatchContent,
  MultipleChoiceContent,
  ReadingPassageContent,
  ReflectionContent,
  ReorderContent,
  RevisionContent,
  ShortWriteContent,
  SummaryContent,
  TranscribeContent,
  WordSelectContent,
} from "@/features/lessons/lesson-types"
const lessonMaxWidthClassName = "mx-auto w-full max-w-[680px]"
const actionHeightClassName = "h-[52px]"
const toneClasses: Record<
  LessonTone,
  {
    bg: string
    border: string
    text: string
    strong: string
    solid: string
    solidText: string
  }
> = {
  primary: {
    bg: "bg-primary/10",
    border: "border-primary/35",
    text: "text-primary",
    strong: "text-primary",
    solid: "bg-primary",
    solidText: "text-primary-foreground",
  },
  success: {
    bg: "bg-primary/10",
    border: "border-primary/35",
    text: "text-primary",
    strong: "text-primary",
    solid: "bg-primary",
    solidText: "text-primary-foreground",
  },
  info: {
    bg: "bg-chart-2/10",
    border: "border-chart-2/35",
    text: "text-chart-2",
    strong: "text-chart-2",
    solid: "bg-chart-2",
    solidText: "text-white",
  },
  warning: {
    bg: "bg-chart-3/10",
    border: "border-chart-3/35",
    text: "text-chart-3",
    strong: "text-chart-3",
    solid: "bg-chart-3",
    solidText: "text-background",
  },
  danger: {
    bg: "bg-destructive/10",
    border: "border-destructive/35",
    text: "text-destructive",
    strong: "text-destructive",
    solid: "bg-destructive",
    solidText: "text-destructive-foreground",
  },
  neutral: {
    bg: "bg-muted",
    border: "border-border/70",
    text: "text-muted-foreground",
    strong: "text-foreground",
    solid: "bg-muted",
    solidText: "text-foreground",
  },
}
const confettiToneClasses: Record<LessonTone, string> = {
  primary: "bg-primary",
  success: "bg-primary",
  info: "bg-chart-2",
  warning: "bg-chart-3",
  danger: "bg-destructive",
  neutral: "bg-foreground",
}
interface LessonExperienceProps {
  lesson: Lesson
}
type WrittenStepResponses = Partial<Record<LessonStepId, string>>
export function LessonExperience({ lesson }: LessonExperienceProps) {
  const router = useRouter()
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0)
  const [showExitDialog, setShowExitDialog] = React.useState(false)
  const [writtenResponses, setWrittenResponses] =
    React.useState<WrittenStepResponses>({})
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const currentStep = lesson.steps[currentStepIndex] ?? lesson.steps[0]
  const progress = getLessonProgress(currentStepIndex, lesson.steps.length)
  const scrollToTop = React.useCallback(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }, [])
  const handleNext = React.useCallback(() => {
    setCurrentStepIndex((index) => {
      const nextIndex = Math.min(index + 1, lesson.steps.length - 1)
      return nextIndex
    })
    scrollToTop()
  }, [lesson.steps.length, scrollToTop])
  const handleRevise = React.useCallback(
    (sourceStepId: LessonStepId) => {
      const writeStepIndex = lesson.steps.findIndex(
        (step) => step.id === sourceStepId
      )
      if (writeStepIndex >= 0) {
        setCurrentStepIndex(writeStepIndex)
        scrollToTop()
        return
      }
      const fallbackWriteStepIndex =
        findStepIndexByType(lesson.steps, "SHORT_WRITE") >= 0
          ? findStepIndexByType(lesson.steps, "SHORT_WRITE")
          : findStepIndexByType(lesson.steps, "LONG_WRITE")
      if (fallbackWriteStepIndex >= 0) {
        setCurrentStepIndex(fallbackWriteStepIndex)
        scrollToTop()
      }
    },
    [lesson.steps, scrollToTop]
  )
  const saveWrittenResponse = React.useCallback(
    (stepId: LessonStepId, text: string) => {
      setWrittenResponses((current) => ({
        ...current,
        [stepId]: text,
      }))
    },
    []
  )
  const goToCourses = React.useCallback(() => {
    setCurrentStepIndex(0)
    setShowExitDialog(false)
    router.push("/courses")
  }, [router])
  const continueAfterComplete = React.useCallback(() => {
    if (lesson.nextLessonId) {
      router.push(`/lesson?lesson_id=${lesson.nextLessonId}`)
      return
    }
    router.push("/courses")
  }, [lesson.nextLessonId, router])
  React.useEffect(() => {
    setCurrentStepIndex(0)
    setWrittenResponses({})
    contentRef.current?.scrollTo({ top: 0 })
  }, [lesson.id])
  if (!currentStep) {
    return null
  }
  return (
    <div className="dark min-h-svh bg-background text-foreground">
      <LessonHeader
        progress={progress}
        lives={3}
        onExit={() => setShowExitDialog(true)}
      />
      <div ref={contentRef} className="h-svh overflow-y-auto pt-14">
        <LessonStepRenderer
          step={currentStep}
          lessonTitle={lesson.title}
          writtenResponses={writtenResponses}
          onNext={handleNext}
          onRevise={handleRevise}
          onSaveWrite={saveWrittenResponse}
          onHome={goToCourses}
          onContinue={continueAfterComplete}
        />
      </div>
      <ExitLessonDialog
        open={showExitDialog}
        onOpenChange={setShowExitDialog}
        onConfirm={goToCourses}
      />
    </div>
  )
}
function LessonHeader({
  progress,
  lives,
  onExit,
}: {
  progress: number
  lives: number
  onExit: () => void
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center border-b border-border/50 bg-background px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="레슨 나가기"
        onClick={onExit}
      >
        <XIcon aria-hidden="true" />
      </Button>
      <div className="mx-4 flex-1">
        <ProgressBar
          value={progress}
          aria-label="레슨 진행률"
          className="gap-0 [&_[data-slot=progress-indicator]]:bg-primary [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-muted"
        />
      </div>
      <div
        className="flex shrink-0 items-center gap-1"
        aria-label={`${lives}개 남음`}
      >
        {["heart-1", "heart-2", "heart-3"].map((heartKey, index) => (
          <HeartIcon
            key={heartKey}
            className={cn(
              "size-4.5",
              index < lives
                ? "fill-destructive text-destructive"
                : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
        ))}
      </div>
    </header>
  )
}
function ExitLessonDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="p-6">
          <DialogTitle className="text-lg font-bold">
            레슨을 나가시겠어요?
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            현재 진행 상황은 자동으로 저장됩니다. 나중에 이어서 학습할 수
            있어요.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="grid grid-cols-2 gap-0 border-t border-border p-0 sm:grid-cols-2">
          <Button
            type="button"
            variant="ghost"
            className="h-14 rounded-none border-r border-border"
            onClick={() => onOpenChange(false)}
          >
            계속 학습
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-14 rounded-none text-destructive hover:text-destructive"
            onClick={onConfirm}
          >
            나가기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
function LessonStepRenderer({
  step,
  lessonTitle,
  writtenResponses,
  onNext,
  onRevise,
  onSaveWrite,
  onHome,
  onContinue,
}: {
  step: LessonStep
  lessonTitle: string
  writtenResponses: WrittenStepResponses
  onNext: () => void
  onRevise: (sourceStepId: LessonStepId) => void
  onSaveWrite: (stepId: LessonStepId, text: string) => void
  onHome: () => void
  onContinue: () => void
}) {
  switch (step.type) {
    case "INTRO":
      return (
        <>
          <IntroStep content={step.content} />
          <BottomActionBar>
            <PrimaryActionButton onClick={onNext}>시작하기</PrimaryActionButton>
          </BottomActionBar>
        </>
      )
    case "CONCEPT":
      return (
        <>
          <ConceptStep content={step.content} />
          <BottomActionBar>
            <PrimaryActionButton onClick={onNext}>
              이해했어요
            </PrimaryActionButton>
          </BottomActionBar>
        </>
      )
    case "READING_PASSAGE":
      return (
        <>
          <ReadingPassageStep content={step.content} />
          <BottomActionBar>
            <PrimaryActionButton onClick={onNext}>
              다 읽었어요
            </PrimaryActionButton>
          </BottomActionBar>
        </>
      )
    case "EXAMPLE_REVEAL":
      return (
        <>
          <ExampleRevealStep content={step.content} />
          <BottomActionBar>
            <PrimaryActionButton onClick={onNext}>다음</PrimaryActionButton>
          </BottomActionBar>
        </>
      )
    case "COMPARE":
      return (
        <>
          <CompareStep content={step.content} />
          <BottomActionBar>
            <PrimaryActionButton onClick={onNext}>다음</PrimaryActionButton>
          </BottomActionBar>
        </>
      )
    case "MULTIPLE_CHOICE":
      return <MultipleChoiceStep content={step.content} onNext={onNext} />
    case "FILL_BLANK":
      return <FillBlankStep content={step.content} onNext={onNext} />
    case "WORD_SELECT":
      return <WordSelectStep content={step.content} onNext={onNext} />
    case "REORDER":
      return <ReorderStep content={step.content} onNext={onNext} />
    case "MATCH":
      return <MatchStep content={step.content} onNext={onNext} />
    case "CLASSIFY":
      return <ClassifyStep content={step.content} onNext={onNext} />
    case "SHORT_WRITE":
      return (
        <ShortWriteStep
          stepId={step.id}
          content={step.content}
          onNext={onNext}
          onSaveWrite={onSaveWrite}
          savedText={writtenResponses[step.id] ?? ""}
        />
      )
    case "LONG_WRITE":
      return (
        <LongWriteStep
          stepId={step.id}
          content={step.content}
          onNext={onNext}
          onSaveWrite={onSaveWrite}
          savedText={writtenResponses[step.id] ?? ""}
        />
      )
    case "AI_FEEDBACK":
      return (
        <AiFeedbackStep
          content={step.content}
          userWrite={writtenResponses[step.content.sourceStepId] ?? ""}
          onNext={onNext}
          onRevise={onRevise}
        />
      )
    case "REVISION":
      return <RevisionStep content={step.content} onNext={onNext} />
    case "CHECKLIST":
      return <ChecklistStep content={step.content} onNext={onNext} />
    case "REFLECTION":
      return <ReflectionStep content={step.content} onNext={onNext} />
    case "SUMMARY":
      return <SummaryStep content={step.content} onNext={onNext} />
    case "TRANSCRIBE":
      return <TranscribeStep content={step.content} onNext={onNext} />
    case "COMPLETE":
      return (
        <CompleteStep
          content={step.content}
          lessonTitle={lessonTitle}
          onHome={onHome}
          onContinue={onContinue}
        />
      )
  }
}
function StepFrame({
  children,
  centered = false,
}: {
  children: React.ReactNode
  centered?: boolean
}) {
  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 px-5 pt-6 pb-28 duration-300">
      <div
        className={cn(
          lessonMaxWidthClassName,
          "flex flex-col gap-5",
          centered && "items-center text-center"
        )}
      >
        {children}
      </div>
    </section>
  )
}
function BottomActionBar({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-background px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <div
        className={cn(
          lessonMaxWidthClassName,
          "flex items-center gap-3",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
function PrimaryActionButton({
  children,
  disabled,
  onClick,
  className,
  tone = "primary",
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
  className?: string
  tone?: "primary" | "info"
}) {
  return (
    <Button
      type="button"
      disabled={disabled}
      size="lg"
      onClick={onClick}
      className={cn(
        actionHeightClassName,
        "flex-1 rounded-full text-[15px] font-bold tracking-[0.08em] uppercase",
        tone === "info" && "bg-chart-2 text-white hover:bg-chart-2/85",
        className
      )}
    >
      {children}
    </Button>
  )
}
function SecondaryActionButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      disabled={disabled}
      onClick={onClick}
      className={cn(actionHeightClassName, "shrink-0 px-4 font-semibold")}
    >
      {children}
    </Button>
  )
}
function IntroStep({ content }: { content: IntroContent }) {
  return (
    <StepFrame>
      <Badge
        variant="outline"
        className={cn(
          "w-fit border text-xs font-bold tracking-[0.08em] uppercase",
          toneClasses[content.tagTone].bg,
          toneClasses[content.tagTone].border,
          toneClasses[content.tagTone].text
        )}
      >
        {content.category}
      </Badge>
      <h1 className="m-0 text-3xl/10 font-bold tracking-normal">
        {content.title}
      </h1>
      <div className="flex flex-col gap-4">
        <p className="m-0 text-sm font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          이 레슨에서 배우는 것
        </p>
        <div className="flex flex-col gap-3">
          {content.bullets.map((bullet, index) => (
            <div
              key={bullet}
              className="animate-in fade-in slide-in-from-bottom-2 flex items-start gap-3 duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-primary/50 bg-primary/15 text-primary">
                <SparklesIcon className="size-3" aria-hidden="true" />
              </span>
              <span className="text-sm/6 text-foreground">{bullet}</span>
            </div>
          ))}
        </div>
      </div>
      <Card variant="filled" className="rounded-xl bg-muted py-0">
        <CardContent className="grid grid-cols-3 px-0 py-4">
          <IntroStat
            value={`${content.estimatedMinutes}분`}
            label="예상 시간"
          />
          <IntroStat
            value={`${content.totalSteps}개`}
            label="학습 스텝"
            bordered
          />
          <IntroStat
            value={`${content.xpAvailable} XP`}
            label="획득 가능"
            bordered
          />
        </CardContent>
      </Card>
    </StepFrame>
  )
}
function IntroStat({
  value,
  label,
  bordered,
}: {
  value: string
  label: string
  bordered?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 text-center",
        bordered && "border-l border-border/70"
      )}
    >
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
function ConceptStep({ content }: { content: ConceptContent }) {
  const [expandedTermIndex, setExpandedTermIndex] = React.useState<
    number | null
  >(null)
  return (
    <StepFrame>
      <h2 className="m-0 text-xl/7 font-bold">{content.subtitle}</h2>
      <ParagraphMarkdown text={content.body} />
      {content.highlight ? (
        <ToneCallout
          tone={content.highlight.tone}
          icon={content.highlight.icon}
        >
          {content.highlight.text}
        </ToneCallout>
      ) : null}
      {content.keyTerms ? (
        <div className="flex flex-col gap-2">
          <p className="m-0 text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
            핵심 용어
          </p>
          {content.keyTerms.map((term, index) => {
            const expanded = expandedTermIndex === index
            return (
              <div
                key={term.term}
                className="overflow-hidden rounded-xl border border-border/70"
              >
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors",
                    expanded ? "bg-muted" : "bg-card hover:bg-muted/80"
                  )}
                  onClick={() =>
                    setExpandedTermIndex((current) =>
                      current === index ? null : index
                    )
                  }
                >
                  <span>{term.term}</span>
                  <span className="text-lg text-muted-foreground">
                    {expanded ? "-" : "+"}
                  </span>
                </button>
                {expanded ? (
                  <div className="bg-muted px-4 pt-1 pb-3 text-sm/6 text-muted-foreground">
                    {term.definition}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </StepFrame>
  )
}
function ReadingPassageStep({ content }: { content: ReadingPassageContent }) {
  return (
    <StepFrame>
      <div className="flex items-center justify-between gap-3">
        <p className="m-0 text-sm text-muted-foreground">
          {content.instruction}
        </p>
        <Badge variant="secondary" className="shrink-0">
          약 {content.estimatedReadMinutes}분
        </Badge>
      </div>
      {content.focusQuestion ? (
        <ToneCallout tone="warning" label="읽으면서 생각해보세요">
          {content.focusQuestion}
        </ToneCallout>
      ) : null}
      <article className="rounded-xl border border-border/70 bg-card p-5">
        <h3 className="m-0 border-b border-border/70 pb-3 text-base/6 font-bold">
          {content.title}
        </h3>
        <div className="mt-4">
          <ParagraphMarkdown text={content.text} />
        </div>
        {content.source ? (
          <p className="m-0 border-t border-border/70 pt-3 text-xs text-muted-foreground">
            출처: {content.source}
          </p>
        ) : null}
      </article>
      {content.highlightEnabled ? (
        <p className="m-0 text-center text-xs text-muted-foreground">
          텍스트를 길게 눌러 하이라이트할 수 있어요
        </p>
      ) : null}
    </StepFrame>
  )
}
function ExampleRevealStep({ content }: { content: ExampleRevealContent }) {
  const [revealed, setRevealed] = React.useState(false)
  return (
    <StepFrame>
      <p className="m-0 text-sm text-muted-foreground">{content.instruction}</p>
      {content.bad ? (
        <TonePanel tone="danger" label={content.bad.label}>
          {content.bad.text}
        </TonePanel>
      ) : null}
      {!revealed ? (
        <Button
          type="button"
          variant="outline"
          className="h-14 w-full rounded-xl border-dashed border-primary/50 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
          onClick={() => setRevealed(true)}
        >
          <SparklesIcon data-icon="inline-start" />
          분석 보기
        </Button>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-3 flex flex-col gap-4 duration-300">
          <TonePanel tone="primary" label={content.good.label}>
            {content.good.text}
          </TonePanel>
          <div className="rounded-xl border border-border/70 bg-muted p-4">
            <p className="m-0 mb-2 text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
              왜 다른가요?
            </p>
            <p className="m-0 text-sm/6">
              <InlineMarkdown text={content.analysis} />
            </p>
          </div>
        </div>
      )}
    </StepFrame>
  )
}
function CompareStep({ content }: { content: CompareContent }) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const activeVersion = content.versions[activeIndex] ?? content.versions[0]
  if (!activeVersion) {
    return null
  }
  return (
    <StepFrame>
      <p className="m-0 text-sm text-muted-foreground">{content.instruction}</p>
      <ToggleGroup
        value={[String(activeIndex)]}
        onValueChange={(nextValue) => {
          const nextIndex = Number(nextValue.at(-1))
          if (Number.isInteger(nextIndex)) {
            setActiveIndex(nextIndex)
          }
        }}
        className="grid w-full grid-cols-2 border-b border-border/70"
        variant="default"
        spacing={0}
      >
        {content.versions.map((version, index) => {
          const active = activeIndex === index
          return (
            <ToggleGroupItem
              key={version.label}
              value={String(index)}
              className={cn(
                "h-12 rounded-none border-b-2 border-transparent",
                active &&
                  cn(
                    "border-current bg-transparent",
                    toneClasses[version.tone].text
                  )
              )}
            >
              {version.label}
            </ToggleGroupItem>
          )
        })}
      </ToggleGroup>
      <div
        className={cn(
          "animate-in fade-in slide-in-from-bottom-2 rounded-xl border p-4 text-sm/6 duration-200",
          toneClasses[activeVersion.tone].bg,
          toneClasses[activeVersion.tone].border
        )}
      >
        {activeVersion.text}
      </div>
      <div className="rounded-xl border border-border/70 bg-muted p-4">
        <p className="m-0 mb-2 text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
          분석
        </p>
        <p className="m-0 text-sm/6">{content.analysis}</p>
      </div>
      {content.discussionQuestion ? (
        <ToneCallout tone="info" label="생각해볼 점">
          {content.discussionQuestion}
        </ToneCallout>
      ) : null}
    </StepFrame>
  )
}
function MultipleChoiceStep({
  content,
  onNext,
}: {
  content: MultipleChoiceContent
  onNext: () => void
}) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [confirmed, setConfirmed] = React.useState(false)
  const isCorrect = isSelectedChoiceCorrect(content.options, selectedId)
  const submit = () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    onNext()
  }
  return (
    <StepFrame>
      {content.context ? (
        <div className="rounded-xl border border-border/70 bg-muted p-4 text-sm/6">
          {content.context}
        </div>
      ) : null}
      <h2 className="m-0 text-lg/7 font-bold">{content.question}</h2>
      <div className="flex flex-col gap-3">
        {content.options.map((option) => {
          const status = getChoiceStatus(option, selectedId, confirmed)
          return (
            <ChoiceOptionButton
              key={option.id}
              id={option.id}
              text={option.text}
              status={status}
              disabled={confirmed}
              onClick={() => setSelectedId(option.id)}
            />
          )
        })}
      </div>
      {confirmed ? (
        <FeedbackPanel tone={isCorrect ? "primary" : "danger"}>
          <p className="m-0 font-bold">{isCorrect ? "정답!" : "오답"}</p>
          <p className="m-0 text-sm/6 text-foreground">{content.explanation}</p>
        </FeedbackPanel>
      ) : null}
      <BottomActionBar>
        <PrimaryActionButton disabled={!selectedId} onClick={submit}>
          {confirmed ? "다음" : "확인"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}
function ChoiceOptionButton({
  id,
  text,
  status,
  disabled,
  onClick,
}: {
  id: string
  text: string
  status: ChoiceStatus
  disabled: boolean
  onClick: () => void
}) {
  const tone =
    status === "correct" || status === "selected"
      ? "primary"
      : status === "incorrect"
        ? "danger"
        : "neutral"
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-4 rounded-xl border bg-card px-4 py-4 text-left transition-colors",
        "hover:bg-muted disabled:cursor-default disabled:hover:bg-card",
        status !== "neutral" && toneClasses[tone].border
      )}
      onClick={onClick}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
          status === "neutral" && "bg-muted text-muted-foreground",
          status !== "neutral" &&
            cn(toneClasses[tone].bg, toneClasses[tone].text),
          (status === "correct" || status === "incorrect") &&
            cn(toneClasses[tone].solid, toneClasses[tone].solidText)
        )}
      >
        {status === "correct" ? (
          <CheckIcon className="size-4" aria-hidden="true" />
        ) : status === "incorrect" ? (
          <XIcon className="size-4" aria-hidden="true" />
        ) : (
          id
        )}
      </span>
      <span className="text-sm/6">{text}</span>
    </button>
  )
}
function FillBlankStep({
  content,
  onNext,
}: {
  content: FillBlankContent
  onNext: () => void
}) {
  const [blanks, setBlanks] = React.useState<BlankAssignments>({})
  const [confirmed, setConfirmed] = React.useState(false)
  const templateParts = React.useMemo(
    () => parseFillBlankTemplate(content.template),
    [content.template]
  )
  const blankById = React.useMemo(
    () => new Map(content.blanks.map((blank) => [blank.id, blank])),
    [content.blanks]
  )
  const usedWords = Object.values(blanks)
  const availableWords = content.wordBank.filter(
    (word) => !usedWords.includes(word)
  )
  const allFilled = content.blanks.every((blank) => blanks[blank.id])
  const fillNextBlank = (word: string) => {
    if (confirmed) {
      return
    }
    const nextBlank = content.blanks.find((blank) => !blanks[blank.id])
    if (nextBlank) {
      setBlanks((current) => ({
        ...current,
        [nextBlank.id]: word,
      }))
    }
  }
  const clearBlank = (blankId: string) => {
    if (confirmed) {
      return
    }
    setBlanks((current) => {
      const next = { ...current }
      delete next[blankId]
      return next
    })
  }
  const submit = () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    onNext()
  }
  return (
    <StepFrame>
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-lg/7 font-bold">{content.instruction}</h2>
        <p className="m-0 text-sm text-muted-foreground">
          단어를 탭하여 빈칸에 넣고, 빈칸을 탭하면 취소됩니다.
        </p>
      </div>
      <div className="rounded-xl border border-border/70 bg-muted p-4 text-sm/8">
        {templateParts.map((part) => {
          if (part.type === "text") {
            return <span key={part.key}>{part.content}</span>
          }
          const blank = blankById.get(part.id)
          const value = blanks[part.id]
          const status = getBlankStatus({
            blankId: part.id,
            blankValue: value,
            correctAnswers: blank?.correctAnswers ?? [],
            confirmed,
            caseSensitive: content.caseSensitive,
          })
          return (
            <button
              key={part.id}
              type="button"
              className={cn(
                "mx-1 inline-flex min-w-16 items-center justify-center rounded-lg border px-3 py-0.5 text-sm font-semibold",
                getBlankStatusClass(status)
              )}
              onClick={() => clearBlank(part.id)}
            >
              {value || "_ _ _"}
            </button>
          )
        })}
      </div>
      <div className="flex flex-col gap-3">
        <p className="m-0 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          단어 선택
        </p>
        <div className="flex flex-wrap gap-2">
          {availableWords.map((word) => (
            <Button
              key={word}
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={confirmed}
              onClick={() => fillNextBlank(word)}
            >
              {word}
            </Button>
          ))}
          {usedWords.map((word) => (
            <Badge
              key={`used-${word}`}
              variant="secondary"
              className="h-9 px-4 text-sm line-through opacity-50"
            >
              {word}
            </Badge>
          ))}
        </div>
      </div>
      {confirmed ? (
        <FeedbackPanel tone="info">
          <p className="m-0 font-bold">해설</p>
          <p className="m-0 text-sm/6 text-foreground">{content.explanation}</p>
        </FeedbackPanel>
      ) : null}
      <BottomActionBar>
        <PrimaryActionButton disabled={!allFilled} onClick={submit}>
          {confirmed ? "다음" : "확인"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}
function WordSelectStep({
  content,
  onNext,
}: {
  content: WordSelectContent
  onNext: () => void
}) {
  const [selectedIds, setSelectedIds] = React.useState<readonly string[]>([])
  const [confirmed, setConfirmed] = React.useState(false)
  const parts = React.useMemo(
    () => parseMarkedText(content.markedText),
    [content.markedText]
  )
  const toggleSpan = (spanId: string) => {
    if (confirmed) {
      return
    }
    setSelectedIds((current) =>
      current.includes(spanId)
        ? current.filter((selectedId) => selectedId !== spanId)
        : [...current, spanId]
    )
  }
  const submit = () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    onNext()
  }
  return (
    <StepFrame>
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-lg/7 font-bold">{content.instruction}</h2>
        <p className="m-0 text-sm text-muted-foreground">
          선택됨:{" "}
          <span className="font-bold text-primary">{selectedIds.length}</span>개
        </p>
      </div>
      <div className="rounded-xl border border-border/70 bg-muted p-4 text-sm/7">
        {parts.map((part) => {
          if (part.type === "text") {
            return <span key={part.id}>{part.content}</span>
          }
          const selected = selectedIds.includes(part.id)
          const correctAndSelected = confirmed && part.isCorrect && selected
          const incorrect = confirmed && selected && !part.isCorrect
          const missed = confirmed && !selected && part.isCorrect
          return (
            <button
              key={part.id}
              type="button"
              disabled={confirmed}
              className={cn(
                "rounded px-0.5 text-left transition-colors",
                selected && !confirmed && "bg-primary/25 text-primary",
                correctAndSelected && "bg-primary/25 text-primary",
                missed && "bg-primary/20 text-primary",
                incorrect && "bg-destructive/25 text-destructive"
              )}
              onClick={() => toggleSpan(part.id)}
            >
              {part.content}
            </button>
          )
        })}
      </div>
      {confirmed ? (
        <FeedbackPanel tone="info">
          <p className="m-0 font-bold">해설</p>
          <p className="m-0 text-sm/6 text-foreground">
            {content.globalExplanation}
          </p>
        </FeedbackPanel>
      ) : null}
      <BottomActionBar>
        <PrimaryActionButton disabled={selectedIds.length < 1} onClick={submit}>
          {confirmed ? "다음" : "확인"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}
function ReorderStep({
  content,
  onNext,
}: {
  content: ReorderContent
  onNext: () => void
}) {
  const [items, setItems] = React.useState(() =>
    getDeterministicOrder(content.items)
  )
  const [draggingIndex, setDraggingIndex] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)
  const [confirmed, setConfirmed] = React.useState(false)
  const dropItem = (targetIndex: number) => {
    if (draggingIndex === null || draggingIndex === targetIndex) {
      setDraggingIndex(null)
      setDragOverIndex(null)
      return
    }
    setItems((current) => {
      const next = [...current]
      const [removed] = next.splice(draggingIndex, 1)
      if (removed) {
        next.splice(targetIndex, 0, removed)
      }
      return next
    })
    setDraggingIndex(null)
    setDragOverIndex(null)
  }
  const submit = () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    onNext()
  }
  return (
    <StepFrame>
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-lg/7 font-bold">{content.instruction}</h2>
        <p className="m-0 text-sm text-muted-foreground">
          드래그하여 순서를 바꾸세요.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item, index) => {
          const status = !confirmed
            ? "neutral"
            : item.correctOrder === index + 1
              ? "correct"
              : "incorrect"
          return (
            <div
              key={item.id}
              draggable={!confirmed}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors",
                !confirmed && "cursor-grab active:cursor-grabbing",
                dragOverIndex === index && "bg-muted",
                status === "correct" && "border-primary bg-primary/10",
                status === "incorrect" &&
                  "border-destructive bg-destructive/10",
                draggingIndex === index && "opacity-50"
              )}
              onDragStart={(event) => {
                setDraggingIndex(index)
                event.dataTransfer.effectAllowed = "move"
              }}
              onDragOver={(event) => {
                event.preventDefault()
                setDragOverIndex(index)
              }}
              onDrop={(event) => {
                event.preventDefault()
                dropItem(index)
              }}
              onDragEnd={() => {
                setDraggingIndex(null)
                setDragOverIndex(null)
              }}
            >
              <GripVerticalIcon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="flex-1 text-sm/6">{item.text}</span>
              {confirmed ? (
                <StatusMark
                  status={status === "correct" ? "correct" : "incorrect"}
                />
              ) : null}
            </div>
          )
        })}
      </div>
      {confirmed ? (
        <div className="rounded-xl border border-border/70 bg-muted p-4">
          <p className="m-0 mb-2 text-sm font-bold text-muted-foreground">
            올바른 순서
          </p>
          <p className="m-0 text-sm/6">{content.explanation}</p>
        </div>
      ) : null}
      <BottomActionBar>
        <PrimaryActionButton onClick={submit}>
          {confirmed ? "다음" : "확인"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}
function MatchStep({
  content,
  onNext,
}: {
  content: MatchContent
  onNext: () => void
}) {
  const rightItems = React.useMemo(
    () =>
      content.shuffleRight
        ? getDeterministicOrder(content.pairs)
        : [...content.pairs],
    [content.pairs, content.shuffleRight]
  )
  const [selectedLeftId, setSelectedLeftId] = React.useState<string | null>(
    null
  )
  const [connections, setConnections] = React.useState<MatchConnections>({})
  const [confirmed, setConfirmed] = React.useState(false)
  const allConnected = content.pairs.every((pair) => connections[pair.id])
  const connectRight = (rightText: string) => {
    if (!selectedLeftId || confirmed) {
      return
    }
    setConnections((current) => ({
      ...current,
      [selectedLeftId]: rightText,
    }))
    setSelectedLeftId(null)
  }
  const getConnectionStatus = (pairId: string) => {
    if (!confirmed || !connections[pairId]) {
      return "neutral" as const
    }
    const pair = content.pairs.find((candidate) => candidate.id === pairId)
    return pair?.right === connections[pairId] ? "correct" : "incorrect"
  }
  const submit = () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    onNext()
  }
  return (
    <StepFrame>
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-lg/7 font-bold">{content.instruction}</h2>
        <p className="m-0 text-sm text-muted-foreground">
          {selectedLeftId
            ? "오른쪽 항목을 탭하여 연결하세요"
            : "왼쪽 항목을 먼저 탭하세요"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          {content.pairs.map((pair) => {
            const status = getConnectionStatus(pair.id)
            const selected = selectedLeftId === pair.id
            const connected = Boolean(connections[pair.id])
            return (
              <button
                key={pair.id}
                type="button"
                disabled={confirmed}
                className={cn(
                  "rounded-xl border bg-card p-3 text-left text-sm font-semibold transition-colors",
                  selected && "border-primary bg-primary/10 text-primary",
                  connected && !confirmed && "border-chart-2 text-chart-2",
                  status === "correct" && "border-primary bg-primary/10",
                  status === "incorrect" &&
                    "border-destructive bg-destructive/10"
                )}
                onClick={() =>
                  setSelectedLeftId((current) =>
                    current === pair.id ? null : pair.id
                  )
                }
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{pair.left}</span>
                  {connected && !confirmed ? (
                    <CheckIcon className="size-3.5" aria-hidden="true" />
                  ) : null}
                  {confirmed && status !== "neutral" ? (
                    <StatusMark status={status} />
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
        <div className="flex flex-col gap-2">
          {rightItems.map((pair) => {
            const connected = Object.values(connections).includes(pair.right)
            return (
              <button
                key={pair.id}
                type="button"
                disabled={confirmed || !selectedLeftId}
                className={cn(
                  "rounded-xl border bg-card p-3 text-left text-sm transition-colors",
                  selectedLeftId && "hover:bg-muted",
                  connected && "border-chart-2 bg-chart-2/10 text-chart-2"
                )}
                onClick={() => connectRight(pair.right)}
              >
                {pair.right}
              </button>
            )
          })}
        </div>
      </div>
      {confirmed ? (
        <div className="rounded-xl border border-border/70 bg-muted p-4">
          <p className="m-0 mb-2 text-sm font-bold text-muted-foreground">
            해설
          </p>
          <p className="m-0 text-sm/6">{content.explanation}</p>
        </div>
      ) : null}
      <BottomActionBar>
        <PrimaryActionButton
          disabled={!allConnected && !confirmed}
          onClick={submit}
        >
          {confirmed ? "다음" : "확인"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}
function ClassifyStep({
  content,
  onNext,
}: {
  content: ClassifyContent
  onNext: () => void
}) {
  const [assignments, setAssignments] = React.useState<ClassifyAssignments>({})
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(
    null
  )
  const [confirmed, setConfirmed] = React.useState(false)
  const selectedItem = content.items.find((item) => item.id === selectedItemId)
  const unassignedItems = content.items.filter((item) => !assignments[item.id])
  const allAssigned = content.items.length === Object.keys(assignments).length
  const assignToCategory = (categoryId: string) => {
    if (!selectedItemId || confirmed) {
      return
    }
    setAssignments((current) => ({
      ...current,
      [selectedItemId]: categoryId,
    }))
    setSelectedItemId(null)
  }
  const submit = () => {
    if (!confirmed) {
      setConfirmed(true)
      return
    }
    onNext()
  }
  return (
    <StepFrame>
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-lg/7 font-bold">{content.instruction}</h2>
        <p className="m-0 text-sm text-muted-foreground">
          {selectedItem
            ? `"${selectedItem.text}" 선택됨 - 카테고리를 탭하세요`
            : "카드를 탭한 후 카테고리를 선택하세요"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {content.categories.map((category) => {
          const categoryItems = content.items.filter(
            (item) => assignments[item.id] === category.id
          )
          const target = selectedItemId !== null
          return (
            <button
              key={category.id}
              type="button"
              disabled={!target || confirmed}
              className={cn(
                "min-h-32 rounded-xl border-2 bg-card p-3 text-left transition-colors",
                target && toneClasses[category.tone].border,
                target && toneClasses[category.tone].bg
              )}
              onClick={() => assignToCategory(category.id)}
            >
              <span
                className={cn(
                  "mb-3 block text-center text-xs font-bold tracking-[0.08em] uppercase",
                  toneClasses[category.tone].text
                )}
              >
                {category.label}
              </span>
              <span className="flex min-h-16 flex-col gap-2">
                {categoryItems.map((item) => {
                  const status = getClassifyStatus({
                    correctCategoryId: item.correctCategoryId,
                    assignedCategoryId: assignments[item.id],
                    confirmed,
                  })
                  return (
                    <span
                      key={item.id}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-xs/5",
                        getClassifyItemClass(status)
                      )}
                    >
                      {item.text}
                    </span>
                  )
                })}
              </span>
            </button>
          )
        })}
      </div>
      <div className="flex flex-col gap-3">
        <p className="m-0 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          분류할 카드 {unassignedItems.length}개
        </p>
        <div className="flex flex-wrap gap-2">
          {unassignedItems.map((item) => {
            const selected = selectedItemId === item.id
            return (
              <Button
                key={item.id}
                type="button"
                variant="outline"
                disabled={confirmed}
                className={cn(
                  "h-auto rounded-lg px-3 py-2 text-sm whitespace-normal",
                  selected && "border-primary bg-primary/10 text-primary"
                )}
                onClick={() =>
                  setSelectedItemId((current) =>
                    current === item.id ? null : item.id
                  )
                }
              >
                {item.text}
              </Button>
            )
          })}
        </div>
      </div>
      {confirmed ? (
        <FeedbackPanel tone="info">
          <p className="m-0 font-bold">해설</p>
          <p className="m-0 text-sm/6 text-foreground">
            {content.globalExplanation}
          </p>
        </FeedbackPanel>
      ) : null}
      <BottomActionBar>
        <PrimaryActionButton
          disabled={!allAssigned && !confirmed}
          onClick={submit}
        >
          {confirmed ? "다음" : "확인"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}
function ShortWriteStep({
  stepId,
  content,
  onNext,
  onSaveWrite,
  savedText,
}: {
  stepId: LessonStepId
  content: ShortWriteContent
  onNext: () => void
  onSaveWrite: (stepId: LessonStepId, text: string) => void
  savedText: string
}) {
  const [text, setText] = React.useState(savedText)
  const [submitted, setSubmitted] = React.useState(false)
  const [showReference, setShowReference] = React.useState(false)
  const activeStepIdRef = React.useRef(stepId)
  const canSubmit = text.length >= content.minChars
  React.useEffect(() => {
    if (activeStepIdRef.current !== stepId) {
      activeStepIdRef.current = stepId
      setText(savedText)
      setSubmitted(false)
      setShowReference(false)
    }
  }, [savedText, stepId])
  const submit = () => {
    if (!submitted) {
      setSubmitted(true)
      onSaveWrite(stepId, text)
      if (content.showReferenceAfterSubmit) {
        setShowReference(true)
      }
      return
    }
    onNext()
  }
  return (
    <StepFrame>
      <div className="flex flex-col gap-2">
        <h2 className="m-0 text-lg/7 font-bold">{content.instruction}</h2>
        <p className="m-0 text-sm text-muted-foreground">{content.prompt}</p>
      </div>
      {content.sourceText ? (
        <SourcePanel label="원문">{content.sourceText}</SourcePanel>
      ) : null}
      <WritingBox
        value={text}
        minChars={content.minChars}
        maxChars={content.maxChars}
        rows={5}
        readOnly={submitted}
        onChange={setText}
      />
      {showReference ? (
        <FeedbackPanel tone="primary">
          <p className="m-0 text-xs font-bold tracking-[0.08em] text-primary uppercase">
            참고 답안
          </p>
          <p className="m-0 text-sm/6 text-foreground">
            {content.referenceAnswer}
          </p>
        </FeedbackPanel>
      ) : null}
      <BottomActionBar>
        {!submitted && content.referenceAnswer ? (
          <SecondaryActionButton
            onClick={() => setShowReference((visible) => !visible)}
          >
            예시 보기
          </SecondaryActionButton>
        ) : null}
        <PrimaryActionButton disabled={!canSubmit} onClick={submit}>
          {submitted ? "다음" : "제출하기"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}
function LongWriteStep({
  stepId,
  content,
  onNext,
  onSaveWrite,
  savedText,
}: {
  stepId: LessonStepId
  content: LongWriteContent
  onNext: () => void
  onSaveWrite: (stepId: LessonStepId, text: string) => void
  savedText: string
}) {
  const [text, setText] = React.useState(savedText)
  const [submitted, setSubmitted] = React.useState(false)
  const [showGuide, setShowGuide] = React.useState(false)
  const [draftSaved, setDraftSaved] = React.useState(false)
  const activeStepIdRef = React.useRef(stepId)
  const canSubmit = text.length >= content.minChars
  const progress = Math.min((text.length / content.targetChars) * 100, 100)
  React.useEffect(() => {
    if (activeStepIdRef.current !== stepId) {
      activeStepIdRef.current = stepId
      setText(savedText)
      setSubmitted(false)
      setDraftSaved(false)
      setShowGuide(false)
    }
  }, [savedText, stepId])
  const submit = () => {
    if (!submitted) {
      setSubmitted(true)
      onSaveWrite(stepId, text)
      return
    }
    onNext()
  }
  return (
    <StepFrame>
      <div className="flex flex-col gap-2">
        <p className="m-0 text-xs font-bold tracking-[0.08em] text-chart-3 uppercase">
          {content.instruction}
        </p>
        <h2 className="m-0 text-base/7 font-semibold">{content.topic}</h2>
      </div>
      {content.context ? (
        <div className="rounded-xl border border-border/70 bg-muted p-3 text-sm/6 text-muted-foreground">
          {content.context}
        </div>
      ) : null}
      {content.structureGuide ? (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="ghost"
            className="h-auto w-fit px-0 text-chart-2 hover:bg-transparent hover:text-chart-2"
            onClick={() => setShowGuide((visible) => !visible)}
          >
            {showGuide ? "▼" : "▶"} 구조 가이드
          </Button>
          {showGuide ? (
            <div className="flex flex-col gap-1 rounded-xl border border-chart-2/30 bg-chart-2/10 p-3">
              {content.structureGuide.map((guide) => (
                <p key={guide} className="m-0 text-sm/6 text-chart-2">
                  {guide}
                </p>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      <WritingBox
        value={text}
        minChars={content.minChars}
        maxChars={content.maxChars}
        rows={8}
        readOnly={submitted}
        onChange={(nextText) => {
          setText(nextText)
          setDraftSaved(false)
        }}
        targetChars={content.targetChars}
      />
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      {draftSaved ? (
        <p className="m-0 text-xs text-primary">임시저장됨</p>
      ) : null}
      <BottomActionBar>
        {!submitted && content.draftSaveEnabled ? (
          <SecondaryActionButton
            onClick={() => {
              onSaveWrite(stepId, text)
              setDraftSaved(true)
            }}
          >
            임시저장
          </SecondaryActionButton>
        ) : null}
        <PrimaryActionButton disabled={!canSubmit} onClick={submit}>
          {submitted ? "다음" : "제출하기"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}
function AiFeedbackStep({
  content,
  userWrite,
  onNext,
  onRevise,
}: {
  content: AiFeedbackContent
  userWrite: string
  onNext: () => void
  onRevise: (sourceStepId: LessonStepId) => void
}) {
  const [loading, setLoading] = React.useState(true)
  const feedback = React.useMemo(() => getMockAiFeedback(), [])
  const score = 82
  React.useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 2000)
    return () => window.clearTimeout(timer)
  }, [])
  if (loading) {
    return (
      <StepFrame centered>
        <div className="flex flex-col items-center gap-4 py-16">
          <span className="flex size-12 items-center justify-center rounded-full border-2 border-primary bg-primary/15 text-primary">
            <SparklesIcon className="size-6" aria-hidden="true" />
          </span>
          <p className="m-0 font-semibold">AI가 글을 읽고 있어요...</p>
          <p className="m-0 text-sm text-muted-foreground">
            AI가 읽는 동안 - 좋은 글은 소리 내 읽었을 때 자연스럽습니다.
          </p>
          <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-3/5 animate-[lesson-progress-fill_2s_ease_forwards] rounded-full bg-primary" />
          </div>
        </div>
      </StepFrame>
    )
  }
  return (
    <StepFrame>
      <h2 className="m-0 text-xl/7 font-bold">AI 피드백</h2>
      {content.showScore ? (
        <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-card p-4">
          <div className="relative size-16">
            <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                className="stroke-muted"
                strokeWidth="3"
              />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                className="stroke-primary"
                strokeWidth="3"
                strokeDasharray={`${score} 100`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{score}</span>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="m-0 text-lg font-bold">전체 평가</p>
            <p className="m-0 text-sm text-muted-foreground">
              능동태 전환이 잘 됐어요!
            </p>
          </div>
        </div>
      ) : null}
      <FeedbackList
        label="잘된 점"
        tone="primary"
        marker="✓"
        items={feedback.good}
      />
      <FeedbackList
        label="개선 포인트"
        tone="warning"
        marker="→"
        items={feedback.improve}
      />
      {userWrite ? (
        <SourcePanel label="내가 쓴 글">{userWrite}</SourcePanel>
      ) : null}
      <BottomActionBar>
        {content.allowRevision ? (
          <SecondaryActionButton onClick={() => onRevise(content.sourceStepId)}>
            다시 쓰기
          </SecondaryActionButton>
        ) : null}
        <PrimaryActionButton onClick={onNext}>다음으로</PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}
function RevisionStep({
  content,
  onNext,
}: {
  content: RevisionContent
  onNext: () => void
}) {
  const [text, setText] = React.useState(content.originalText)
  const [submitted, setSubmitted] = React.useState(false)
  const [showHints, setShowHints] = React.useState(false)
  const hasChanged = text !== content.originalText
  const submit = () => {
    if (!submitted) {
      setSubmitted(true)
      return
    }
    onNext()
  }
  return (
    <StepFrame>
      <h2 className="m-0 text-lg/7 font-bold">{content.instruction}</h2>
      <ToneCallout tone="warning" label="퇴고 과제">
        {content.revisionTask}
      </ToneCallout>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-fit px-0 text-chart-2 hover:bg-transparent hover:text-chart-2"
          onClick={() => setShowHints((visible) => !visible)}
        >
          {showHints ? "▼" : "▶"} 힌트 보기
        </Button>
        {showHints ? (
          <div className="flex flex-col gap-2 rounded-xl border border-chart-2/30 bg-chart-2/10 p-3">
            {content.hints.map((hint) => (
              <p key={hint} className="m-0 text-sm/6 text-chart-2">
                {hint}
              </p>
            ))}
          </div>
        ) : null}
      </div>
      <Textarea
        value={text}
        readOnly={submitted}
        rows={6}
        className={cn(
          "min-h-40 border bg-card text-sm/7",
          hasChanged && "border-primary"
        )}
        onChange={(event) => setText(event.target.value)}
      />
      {hasChanged && !submitted ? (
        <p className="m-0 text-xs text-primary">수정 중...</p>
      ) : null}
      {submitted ? (
        <FeedbackPanel tone="primary">
          <p className="m-0 text-xs font-bold tracking-[0.08em] text-primary uppercase">
            모범 퇴고 예시
          </p>
          <p className="m-0 text-sm/6 text-foreground">
            {content.referenceRevision}
          </p>
        </FeedbackPanel>
      ) : null}
      <BottomActionBar>
        {hasChanged && !submitted ? (
          <SecondaryActionButton onClick={() => setText(content.originalText)}>
            초기화
          </SecondaryActionButton>
        ) : null}
        <PrimaryActionButton
          disabled={!hasChanged && !submitted}
          onClick={submit}
        >
          {submitted ? "다음" : "제출하기"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}
function ChecklistStep({
  content,
  onNext,
}: {
  content: ChecklistContent
  onNext: () => void
}) {
  const [checkedIds, setCheckedIds] = React.useState<readonly string[]>([])
  const progress = Math.round((checkedIds.length / content.items.length) * 100)
  const canComplete = getChecklistComplete({
    checkedCount: checkedIds.length,
    totalCount: content.items.length,
    completionMode: content.completionMode,
    minimumChecks: content.minimumChecks,
  })
  const toggleCheck = (itemId: string) => {
    setCheckedIds((current) =>
      current.includes(itemId)
        ? current.filter((checkedId) => checkedId !== itemId)
        : [...current, itemId]
    )
  }
  return (
    <StepFrame>
      <h2 className="m-0 text-lg/7 font-bold">{content.instruction}</h2>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {checkedIds.length} / {content.items.length} 완료
          </span>
          <span className="text-sm font-bold text-primary">{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {content.items.map((item) => {
          const checked = checkedIds.includes(item.id)
          return (
            <button
              key={item.id}
              type="button"
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-colors",
                checked && "border-primary bg-primary/10"
              )}
              onClick={() => toggleCheck(item.id)}
            >
              <Checkbox checked={checked} readOnly aria-hidden="true" />
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-sm/6">{item.text}</span>
                {item.required ? (
                  <span className="text-xs text-chart-3">필수</span>
                ) : null}
                {item.tip && checked ? (
                  <span className="text-xs/5 text-muted-foreground">
                    {item.tip}
                  </span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
      <BottomActionBar>
        <PrimaryActionButton disabled={!canComplete} onClick={onNext}>
          완료
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}
function ReflectionStep({
  content,
  onNext,
}: {
  content: ReflectionContent
  onNext: () => void
}) {
  const [text, setText] = React.useState("")
  const canRecord = text.trim().length > 0
  return (
    <StepFrame>
      <p className="m-0 text-xs font-bold tracking-[0.08em] text-chart-2 uppercase">
        성찰 기록
      </p>
      <h2 className="m-0 text-xl/8 font-bold">{content.question}</h2>
      {content.context ? (
        <p className="m-0 text-sm/6 text-muted-foreground">{content.context}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {content.promptStarters.map((starter) => (
          <Button
            key={starter}
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full border-chart-2/30 bg-chart-2/10 text-chart-2 hover:bg-chart-2/15 hover:text-chart-2"
            onClick={() => setText((current) => current || starter)}
          >
            {starter}
          </Button>
        ))}
      </div>
      <Textarea
        value={text}
        rows={6}
        placeholder="솔직하게 적어보세요. 정답이 없어요."
        className="min-h-40 border bg-card text-sm/7 focus-visible:border-chart-2 focus-visible:ring-chart-2/30"
        onChange={(event) => setText(event.target.value)}
      />
      <div className="flex items-center gap-2">
        <span className="text-xs text-chart-2">📓</span>
        <p className="m-0 text-xs text-muted-foreground">
          이 기록은 내 학습 일지에 저장됩니다.
        </p>
      </div>
      <BottomActionBar>
        {content.isSkippable ? (
          <SecondaryActionButton onClick={onNext}>
            건너뛰기
          </SecondaryActionButton>
        ) : null}
        <PrimaryActionButton disabled={!canRecord} onClick={onNext} tone="info">
          기록하기
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}
function SummaryStep({
  content,
  onNext,
}: {
  content: SummaryContent
  onNext: () => void
}) {
  const [sharing, setSharing] = React.useState(false)
  return (
    <StepFrame>
      <h2 className="m-0 text-xl/7 font-bold">오늘 배운 것</h2>
      <div className="flex flex-col gap-4">
        {content.points.map((point, index) => (
          <div
            key={point.number}
            className="animate-in fade-in slide-in-from-bottom-2 flex gap-4 rounded-xl border border-border/70 bg-card p-4 duration-300"
            style={{ animationDelay: `${index * 0.15}s` }}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-lg font-bold text-primary">
              {point.icon || point.number}
            </span>
            <p className="m-0 mt-0.5 text-sm/6">{point.text}</p>
          </div>
        ))}
      </div>
      {content.nextLesson ? (
        <ToneCallout tone="info" label="다음 레슨">
          <span className="block font-semibold text-foreground">
            {content.nextLesson.title}
          </span>
          {content.nextLesson.description ? (
            <span className="mt-1 block text-xs text-muted-foreground">
              {content.nextLesson.description}
            </span>
          ) : null}
        </ToneCallout>
      ) : null}
      {sharing ? (
        <p className="m-0 text-sm text-primary">공유 문구가 준비됐어요.</p>
      ) : null}
      <BottomActionBar>
        {content.shareableQuote ? (
          <SecondaryActionButton onClick={() => setSharing(true)}>
            공유하기
          </SecondaryActionButton>
        ) : null}
        <PrimaryActionButton onClick={onNext}>
          다음 레슨으로
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}
function TranscribeStep({
  content,
  onNext,
}: {
  content: TranscribeContent
  onNext: () => void
}) {
  const [text, setText] = React.useState("")
  const [submitted, setSubmitted] = React.useState(false)
  const matchRate = getMatchRate({
    sourceText: content.sourceText,
    userText: text,
    caseSensitive: content.caseSensitive,
    punctuationSensitive: content.punctuationSensitive,
  })
  const matchTone =
    matchRate >= 90 ? "primary" : matchRate >= 60 ? "warning" : "danger"
  const submit = () => {
    if (!submitted) {
      setSubmitted(true)
      return
    }
    onNext()
  }
  return (
    <StepFrame>
      <h2 className="m-0 text-lg/7 font-bold">{content.instruction}</h2>
      {content.focusNote ? (
        <ToneCallout tone="warning" label="포인트">
          {content.focusNote}
        </ToneCallout>
      ) : null}
      <SourcePanel
        label="원문"
        footer={content.source ? `출처: ${content.source}` : undefined}
      >
        {content.sourceText}
      </SourcePanel>
      <Textarea
        value={text}
        readOnly={submitted}
        rows={5}
        placeholder="원문을 보면서 그대로 따라 써보세요..."
        className={cn(
          "min-h-32 border bg-card text-sm/7",
          text && "border-primary"
        )}
        onChange={(event) => setText(event.target.value)}
      />
      {content.showMatchRate && text.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">일치율</span>
            <span
              className={cn("text-xs font-bold", toneClasses[matchTone].text)}
            >
              {matchRate}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                toneClasses[matchTone].solid
              )}
              style={{ width: `${matchRate}%` }}
            />
          </div>
        </div>
      ) : null}
      {submitted ? (
        <div className="animate-in fade-in slide-in-from-bottom-3 flex flex-col gap-3 duration-300">
          <TonePanel tone="primary" label="원문">
            {content.sourceText}
          </TonePanel>
          <TonePanel tone="info" label="내가 쓴 글">
            {text}
          </TonePanel>
          <p
            className={cn(
              "m-0 text-center text-sm font-bold",
              toneClasses[matchTone].text
            )}
          >
            최종 일치율: {matchRate}%
          </p>
        </div>
      ) : null}
      <BottomActionBar>
        <PrimaryActionButton disabled={!text} onClick={submit}>
          {submitted ? "다음" : "완료"}
        </PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}
function CompleteStep({
  content,
  lessonTitle,
  onHome,
  onContinue,
}: {
  content: CompleteContent
  lessonTitle: string
  onHome: () => void
  onContinue: () => void
}) {
  const { xp, showConfetti, confettiPieces } = useCompleteCelebration(
    content.xpEarned
  )
  return (
    <StepFrame centered>
      {showConfetti
        ? confettiPieces.map((piece) => (
            <span
              key={piece.id}
              className={cn(
                "fixed top-[-20px] rounded-sm animate-[lesson-confetti_3s_ease-in_forwards]",
                confettiToneClasses[piece.tone]
              )}
              style={{
                left: piece.left,
                width: piece.size,
                height: piece.size,
                animationDelay: piece.delay,
                animationDuration: piece.duration,
              }}
            />
          ))
        : null}
      <div className="flex flex-col items-center gap-4 py-10">
        <div className="text-6xl">🎉</div>
        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-3xl/10 font-bold">레슨 완료!</h1>
          <p className="m-0 text-sm text-muted-foreground">
            {lessonTitle} 마스터!
          </p>
        </div>
        <div className="animate-in zoom-in-95 inline-flex items-center gap-2 rounded-full border-2 border-primary bg-primary/15 px-8 py-4 duration-500">
          <span className="text-4xl font-bold text-primary">+{xp}</span>
          <span className="text-xl font-bold">XP</span>
        </div>
        {content.showStreak ? (
          <div className="animate-[lesson-pulse_2s_infinite] inline-flex items-center gap-2 rounded-full border border-border bg-muted px-5 py-2">
            <span className="text-xl">🔥</span>
            <span className="text-sm font-bold">7일 연속 학습 중</span>
          </div>
        ) : null}
        <div className="w-full rounded-2xl border border-border/70 bg-card p-5 text-left">
          <p className="m-0 mb-4 text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
            이번 레슨 요약
          </p>
          <div className="flex flex-col gap-3">
            {content.lessonStats.correctRate !== undefined ? (
              <SummaryMetric
                label="정답률"
                value={`${content.lessonStats.correctRate}%`}
                progress={content.lessonStats.correctRate}
              />
            ) : null}
            {content.lessonStats.writingCount !== undefined ? (
              <SummaryMetric
                label="글쓰기 완료"
                value={`✦ ${content.lessonStats.writingCount}개`}
              />
            ) : null}
            {content.lessonStats.aiFeedbackCount !== undefined ? (
              <SummaryMetric
                label="AI 피드백"
                value={`✦ ${content.lessonStats.aiFeedbackCount}회`}
              />
            ) : null}
          </div>
        </div>
      </div>
      <BottomActionBar>
        <SecondaryActionButton onClick={onHome}>홈으로</SecondaryActionButton>
        <PrimaryActionButton onClick={onContinue}>계속하기</PrimaryActionButton>
      </BottomActionBar>
    </StepFrame>
  )
}
function ToneCallout({
  tone,
  label,
  icon,
  children,
}: {
  tone: LessonTone
  label?: string
  icon?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4",
        toneClasses[tone].bg,
        toneClasses[tone].border
      )}
    >
      {icon ? <span className="shrink-0 text-xl">{icon}</span> : null}
      <div className="flex min-w-0 flex-col gap-1">
        {label ? (
          <p
            className={cn(
              "m-0 text-xs font-bold tracking-[0.08em] uppercase",
              toneClasses[tone].text
            )}
          >
            {label}
          </p>
        ) : null}
        <div className={cn("text-sm/6", toneClasses[tone].text)}>
          {children}
        </div>
      </div>
    </div>
  )
}
function TonePanel({
  tone,
  label,
  children,
}: {
  tone: LessonTone
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        toneClasses[tone].bg,
        toneClasses[tone].border
      )}
    >
      <p
        className={cn(
          "m-0 mb-2 text-xs font-bold tracking-[0.08em] uppercase",
          toneClasses[tone].text
        )}
      >
        {label}
      </p>
      <p className="m-0 text-sm/6">{children}</p>
    </div>
  )
}
function FeedbackPanel({
  tone,
  children,
}: {
  tone: LessonTone
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "animate-in fade-in slide-in-from-bottom-3 flex flex-col gap-1 rounded-xl border p-4 duration-300",
        toneClasses[tone].bg,
        toneClasses[tone].border,
        toneClasses[tone].text
      )}
    >
      {children}
    </div>
  )
}
function FeedbackList({
  label,
  tone,
  marker,
  items,
}: {
  label: string
  tone: LessonTone
  marker: string
  items: readonly string[]
}) {
  return (
    <div className="flex flex-col gap-3">
      <p
        className={cn(
          "m-0 text-xs font-bold tracking-[0.08em] uppercase",
          toneClasses[tone].text
        )}
      >
        {label}
      </p>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item}
            className={cn(
              "flex gap-3 rounded-xl border p-3",
              toneClasses[tone].bg,
              toneClasses[tone].border
            )}
          >
            <span className={cn("shrink-0 text-sm", toneClasses[tone].text)}>
              {marker}
            </span>
            <p className="m-0 text-sm/6 text-foreground">{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
function SourcePanel({
  label,
  footer,
  children,
}: {
  label: string
  footer?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-muted p-4">
      <p className="m-0 mb-2 text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="m-0 text-sm/6 italic">{children}</p>
      {footer ? (
        <p className="m-0 mt-3 border-t border-border/70 pt-2 text-xs text-muted-foreground">
          {footer}
        </p>
      ) : null}
    </div>
  )
}
function WritingBox({
  value,
  minChars,
  maxChars,
  targetChars,
  rows,
  readOnly,
  onChange,
}: {
  value: string
  minChars: number
  maxChars: number
  targetChars?: number
  rows: number
  readOnly: boolean
  onChange: (text: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Textarea
        value={value}
        readOnly={readOnly}
        rows={rows}
        maxLength={maxChars}
        placeholder="여기에 작성하세요..."
        className={cn(
          "border bg-card text-sm/7",
          value.length > 0 && "border-primary"
        )}
        onChange={(event) => {
          if (!readOnly) {
            onChange(event.target.value)
          }
        }}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {value.length > 0 && value.length < minChars ? (
            <span className="text-chart-3">
              최소 {minChars}자 이상 작성하세요
            </span>
          ) : targetChars ? (
            <span>
              목표: {value.length} / {targetChars}자
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            "text-xs font-semibold",
            value.length >= minChars ? "text-primary" : "text-muted-foreground"
          )}
        >
          {value.length} / {maxChars}
        </span>
      </div>
    </div>
  )
}
function SummaryMetric({
  label,
  value,
  progress,
}: {
  label: string
  value: string
  progress?: number
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 text-sm font-bold">
        {progress !== undefined ? (
          <span className="h-2 w-24 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
            />
          </span>
        ) : null}
        {value}
      </span>
    </div>
  )
}
function InlineMarkdown({
  text,
  strongClassName = "text-primary font-bold",
}: {
  text: string
  strongClassName?: string
}) {
  return (
    <>
      {splitMarkdownEmphasis(text).map((segment) =>
        segment.emphasized ? (
          <strong key={segment.id} className={strongClassName}>
            {segment.text}
          </strong>
        ) : (
          <React.Fragment key={segment.id}>{segment.text}</React.Fragment>
        )
      )}
    </>
  )
}
function ParagraphMarkdown({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-3">
      {splitParagraphs(text).map((paragraph) => (
        <p key={paragraph} className="m-0 text-sm/6">
          <InlineMarkdown text={paragraph} />
        </p>
      ))}
    </div>
  )
}
function StatusMark({ status }: { status: "correct" | "incorrect" }) {
  return (
    <span
      className={cn(
        "shrink-0 text-xs font-bold",
        status === "correct" ? "text-primary" : "text-destructive"
      )}
    >
      {status === "correct" ? "✓" : "✗"}
    </span>
  )
}
function getBlankStatusClass(status: ReturnType<typeof getBlankStatus>) {
  if (status === "correct") {
    return "border-primary bg-primary/10 text-primary"
  }
  if (status === "incorrect") {
    return "border-destructive bg-destructive/10 text-destructive"
  }
  if (status === "filled") {
    return "border-primary bg-primary/10 text-primary"
  }
  return "border-border bg-card text-muted-foreground"
}
function getClassifyItemClass(status: ClassifyStatus) {
  if (status === "correct") {
    return "border-primary bg-primary/10 text-foreground"
  }
  if (status === "incorrect") {
    return "border-destructive bg-destructive/10 text-foreground"
  }
  return "border-border bg-muted text-foreground"
}
function useCompleteCelebration(xpEarned: number) {
  const [xp, setXp] = React.useState(0)
  const [showConfetti, setShowConfetti] = React.useState(false)
  const confettiPieces = React.useMemo(() => createConfettiPieces(24), [])
  React.useEffect(() => {
    setShowConfetti(true)
    let animationFrame = 0
    let start: number | null = null
    const duration = 1200
    const step = (timestamp: number) => {
      start ??= timestamp
      const elapsed = timestamp - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setXp(Math.floor(eased * xpEarned))
      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step)
      }
    }
    animationFrame = window.requestAnimationFrame(step)
    const timer = window.setTimeout(() => setShowConfetti(false), 4000)
    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(timer)
    }
  }, [xpEarned])
  return { xp, showConfetti, confettiPieces }
}
````

## File: apps/web/src/features/lessons/lesson-types.ts
````typescript
export type LessonId = string & {
  readonly __brand: "lesson-id"
}
export type LessonStepId = string & {
  readonly __brand: "lesson-step-id"
}
export type LessonTone =
  | "primary"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "neutral"
export interface Lesson {
  id: LessonId
  title: string
  categoryId: string
  courseId: string
  unitNumber: number
  nextLessonId?: LessonId
  steps: readonly LessonStep[]
}
interface BaseLessonStep<TType extends string, TContent> {
  id: LessonStepId
  type: TType
  order: number
  points: number
  required: boolean
  content: TContent
}
export interface IntroContent {
  title: string
  category: string
  tagTone: LessonTone
  bullets: readonly string[]
  estimatedMinutes: number
  totalSteps: number
  xpAvailable: number
}
export interface ConceptContent {
  subtitle: string
  body: string
  highlight?: {
    icon: string
    text: string
    tone: LessonTone
  }
  keyTerms?: readonly {
    term: string
    definition: string
  }[]
}
export interface ReadingPassageContent {
  instruction: string
  title: string
  source?: string
  text: string
  estimatedReadMinutes: number
  highlightEnabled: boolean
  focusQuestion?: string
}
export interface ExampleRevealContent {
  instruction: string
  bad?: {
    label: string
    text: string
  }
  good: {
    label: string
    text: string
  }
  analysis: string
  revealTrigger: "button"
}
export interface CompareContent {
  instruction: string
  versions: readonly {
    label: string
    text: string
    tone: LessonTone
  }[]
  analysis: string
  discussionQuestion?: string
}
export interface MultipleChoiceContent {
  context?: string
  question: string
  options: readonly ChoiceOption[]
  explanation: string
  allowMultiple: false
  shuffleOptions: boolean
}
export interface ChoiceOption {
  id: string
  text: string
  isCorrect: boolean
}
export interface FillBlankContent {
  instruction: string
  template: string
  blanks: readonly {
    id: string
    correctAnswers: readonly string[]
    hint?: string
  }[]
  inputMode: "word-bank"
  wordBank: readonly string[]
  explanation: string
  caseSensitive: boolean
}
export interface WordSelectContent {
  instruction: string
  markedText: string
  globalExplanation: string
  spanExplanations: Record<string, string>
}
export interface ReorderContent {
  instruction: string
  items: readonly {
    id: string
    text: string
    correctOrder: number
  }[]
  itemType: "sentence"
  explanation: string
  showNumberHint: boolean
}
export interface MatchContent {
  instruction: string
  pairs: readonly {
    id: string
    left: string
    right: string
  }[]
  shuffleRight: boolean
  displayMode: "tap-connect"
  explanation: string
}
export interface ClassifyContent {
  instruction: string
  categories: readonly {
    id: string
    label: string
    tone: LessonTone
  }[]
  items: readonly {
    id: string
    text: string
    correctCategoryId: string
  }[]
  globalExplanation: string
}
export interface ShortWriteContent {
  instruction: string
  prompt: string
  sourceText?: string
  maxChars: number
  minChars: number
  referenceAnswer: string
  aiEvaluationEnabled: boolean
  showReferenceAfterSubmit: boolean
}
export interface LongWriteContent {
  instruction: string
  topic: string
  context?: string
  structureGuide?: readonly string[]
  minChars: number
  targetChars: number
  maxChars: number
  aiEvaluationEnabled: boolean
  evaluationCriteria: string
  draftSaveEnabled: boolean
}
export interface AiFeedbackContent {
  sourceStepId: LessonStepId
  feedbackPrompt: string
  focusAreas: readonly ("clarity" | "expression")[]
  showScore: boolean
  scoreRange: readonly [number, number]
  allowRevision: boolean
  maxRevisions: number
}
export interface RevisionContent {
  instruction: string
  revisionTask: string
  originalText: string
  hints: readonly string[]
  revisionType: "targeted"
  referenceRevision: string
  aiEvaluationEnabled: boolean
  evaluationCriteria: string
}
export interface ChecklistContent {
  instruction: string
  items: readonly {
    id: string
    text: string
    required: boolean
    tip?: string
  }[]
  completionMode: "minimum" | "all" | "any"
  minimumChecks: number
  saveResponses: boolean
}
export interface ReflectionContent {
  question: string
  context?: string
  promptStarters: readonly string[]
  minChars: number
  saveToJournal: boolean
  category: string
  isSkippable: boolean
}
export interface SummaryContent {
  points: readonly {
    number: number
    text: string
    icon?: string
  }[]
  nextLesson?: {
    title: string
    description?: string
  }
  shareableQuote?: string
}
export interface TranscribeContent {
  instruction: string
  sourceText: string
  source?: string
  showMatchRate: boolean
  caseSensitive: boolean
  punctuationSensitive: boolean
  focusNote?: string
}
export interface CompleteContent {
  celebrationStyle: "confetti"
  xpEarned: number
  showStreak: boolean
  lessonStats: {
    correctRate?: number
    writingCount?: number
    aiFeedbackCount?: number
  }
  nextAction: "next-lesson"
}
export type LessonStep =
  | BaseLessonStep<"INTRO", IntroContent>
  | BaseLessonStep<"CONCEPT", ConceptContent>
  | BaseLessonStep<"READING_PASSAGE", ReadingPassageContent>
  | BaseLessonStep<"EXAMPLE_REVEAL", ExampleRevealContent>
  | BaseLessonStep<"COMPARE", CompareContent>
  | BaseLessonStep<"MULTIPLE_CHOICE", MultipleChoiceContent>
  | BaseLessonStep<"FILL_BLANK", FillBlankContent>
  | BaseLessonStep<"WORD_SELECT", WordSelectContent>
  | BaseLessonStep<"REORDER", ReorderContent>
  | BaseLessonStep<"MATCH", MatchContent>
  | BaseLessonStep<"CLASSIFY", ClassifyContent>
  | BaseLessonStep<"SHORT_WRITE", ShortWriteContent>
  | BaseLessonStep<"LONG_WRITE", LongWriteContent>
  | BaseLessonStep<"AI_FEEDBACK", AiFeedbackContent>
  | BaseLessonStep<"REVISION", RevisionContent>
  | BaseLessonStep<"CHECKLIST", ChecklistContent>
  | BaseLessonStep<"REFLECTION", ReflectionContent>
  | BaseLessonStep<"SUMMARY", SummaryContent>
  | BaseLessonStep<"TRANSCRIBE", TranscribeContent>
  | BaseLessonStep<"COMPLETE", CompleteContent>
````

## File: docker-compose.yml
````yaml
services:
  redis:
    image: redis:7-alpine
    container_name: writing-app-redis-local
    command: ["redis-server", "--appendonly", "yes"]
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped
    volumes:
      - redis_data:/data
  redisinsight:
    image: redis/redisinsight:latest
    container_name: writing-app-redisinsight-local
    depends_on:
      redis:
        condition: service_healthy
    ports:
      - "5540:5540"
    restart: unless-stopped
    volumes:
      - redisinsight_data:/data
  rustfs_perms:
    image: alpine
    user: root
    volumes:
      - ./data:/fix_path
    command: chown -R 10001:10001 /fix_path
  rustfs:
    image: rustfs/rustfs:latest
    container_name: rustfs-local
    security_opt:
      - "no-new-privileges:true"
    depends_on:
      rustfs_perms:
        condition: service_completed_successfully
    env_file:
      - .env.docker
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - RUSTFS_VOLUMES=/data
      - RUSTFS_ADDRESS=0.0.0.0:9000
      - RUSTFS_CONSOLE_ADDRESS=0.0.0.0:9001
      - RUSTFS_CONSOLE_ENABLE=true
    volumes:
      - ./data:/data
    restart: unless-stopped
  rustfs_public_assets_init:
    image: minio/mc:latest
    depends_on:
      rustfs:
        condition: service_started
    env_file:
      - .env.docker
    entrypoint: ["/bin/sh", "/init-public-assets-bucket.sh"]
    volumes:
      - ./scripts/init-public-assets-bucket.sh:/init-public-assets-bucket.sh:ro
volumes:
  redis_data:
  redisinsight_data:
````

## File: lefthook.yml
````yaml
# lefthook.yml
pre-commit:
  parallel: true
  commands:
    # format all staged files with the root Prettier config
    format:
      glob: "**/*.{ts,tsx,js,jsx,cjs,mjs,json,md,mdx,yaml,yml,css}"
      run: bun prettier --write --ignore-path .gitignore {staged_files}
      stage_fixed: true
    workspace-lint:
      glob: "{apps,packages}/**/*.{ts,tsx,js,jsx}"
      run: bun run scripts/lint-staged-workspaces.ts {staged_files}
pre-push:
  commands:
    turbo-lint:
      run: bun turbo run lint
````

## File: packages/ui/package.json
````json
{
  "name": "@workspace/ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "sideEffects": [
    "*.css"
  ],
  "exports": {
    ".": "./src/index.ts",
    "./styles": "./src/styles/globals.css",
    "./globals.css": "./src/styles/globals.css",
    "./postcss.config": "./postcss.config.mjs",
    "./lib/*": "./src/lib/*.ts",
    "./hooks/*": "./src/hooks/*.ts",
    "./utils": "./src/utils/index.ts",
    "./utils/*": "./src/utils/*.ts",
    "./components/icons": "./src/components/icons.tsx",
    "./components/ui/theme-provider": "./src/components/ui/theme-provider.tsx",
    "./components/ui/*": "./src/components/ui/*.tsx"
  },
  "scripts": {
    "format": "prettier --write . --ignore-path ../../.gitignore",
    "lint": "eslint .",
    "test": "vitest run --config vitest.config.ts",
    "test:watch": "vitest watch --config vitest.config.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@base-ui/react": "^1.4.0",
    "class-variance-authority": "^0.7.1",
    "cmdk": "^1.1.1",
    "lucide-react": "^1.8.0",
    "next-themes": "^0.4.6",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.5.0",
    "vaul": "^1.1.2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.18",
    "@turbo/gen": "^2.8.1",
    "@types/bun": "^1.3.10",
    "@types/react": "^19.2.10",
    "@types/react-dom": "^19.2.3",
    "@workspace/config": "workspace:*",
    "eslint": "^9.39.2",
    "tailwindcss": "^4.1.18",
    "typescript": "^5.9.3"
  }
}
````

## File: packages/ui/src/components/ui/card.tsx
````typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
const cardVariants = cva(
  "group/card flex flex-col gap-6 overflow-hidden rounded-4xl py-6 text-sm text-card-foreground has-[>img:first-child]:pt-0 data-[size=sm]:gap-4 data-[size=sm]:py-4 *:[img:first-child]:rounded-t-4xl *:[img:last-child]:rounded-b-4xl",
  {
    variants: {
      variant: {
        filled: "bg-secondary",
        outlined: "border border-border bg-background",
      },
    },
    defaultVariants: {
      variant: "filled",
    },
  }
)
function Card({
  className,
  variant = "filled",
  size = "default",
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      data-size={size}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
}
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1.5 rounded-t-4xl px-6 group-data-[size=sm]/card:px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-6 group-data-[size=sm]/card:[.border-b]:pb-4",
        className
      )}
      {...props}
    />
  )
}
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-base font-medium", className)}
      {...props}
    />
  )
}
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 group-data-[size=sm]/card:px-4", className)}
      {...props}
    />
  )
}
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-4xl px-6 group-data-[size=sm]/card:px-4 [.border-t]:pt-6 group-data-[size=sm]/card:[.border-t]:pt-4",
        className
      )}
      {...props}
    />
  )
}
export {
  Card,
  cardVariants,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
````

## File: vitest.workspace.ts
````typescript
import { defineConfig } from "vitest/config"
export default defineConfig({
  test: {
    projects: ["packages/ui/vitest.config.ts"],
  },
})
````

## File: .gitignore
````
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# Dependencies
node_modules
.pnp
.pnp.js

# Local env files
.env
.env.docker
.env.local
.env.development.local
.env.test.local
.env.production.local
apps/api/.env.development
apps/api/.generated/

# Testing
coverage

# Turbo
.turbo

# Vercel
.vercel

# Build Outputs
.next/
out/
build
dist


# Debug
npm-debug.log*

# Misc
.DS_Store
*.pem
docs/.obsidian/

# Agent skills (Antigravity)
.agent

# local database
/data

# secret credentials
/credentials
````

## File: apps/web/README.md
````markdown
# @workspace/web

Empty Next.js frontend workspace for the writing platform.

## Scripts

```bash
bun --filter @workspace/web dev
bun --filter @workspace/web build
bun --filter @workspace/web lint
bun --filter @workspace/web typecheck
```

## Structure

- `src/app/layout.tsx`: required App Router root layout.
- `src/app/page.tsx`: empty root route.
- `src/app/globals.css`: imports shared UI globals from `@workspace/ui`.

## Conventions

- Keep app-only code under `src`.
- Use absolute imports when new app code is added.
- ESLint and TypeScript extend `@workspace/config`.
````

## File: apps/web/tsconfig.json
````json
{
  "extends": "@workspace/config/typescript/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "incremental": true,
    "types": ["bun"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
    "**/*.mts"
  ],
  "exclude": ["node_modules"]
}
````

## File: packages/ui/src/components/icons.tsx
````typescript
export {
  BookOpenIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleIcon,
  GripVerticalIcon,
  HeartIcon,
  HomeIcon,
  LanguagesIcon as LogoIcon,
  LockIcon,
  PlayIcon,
  SearchIcon,
  SparklesIcon,
  UserIcon,
  XIcon,
} from "lucide-react"
export type { LucideIcon } from "lucide-react"
````

## File: packages/ui/src/styles/globals.css
````css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";
@source "../../src";
@custom-variant dark (&:is(.dark *));
@theme inline {
  --font-heading: var(--font-sans);
  --font-sans: var(--font-sans);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --color-foreground: var(--foreground);
  --color-background: var(--background);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}
:root {
  /* Core radius */
  --radius: 0.625rem;
  /* shadcn semantic surfaces */
  --background: oklch(1 0 0); /* #ffffff */
  --foreground: oklch(0.209 0 0); /* #181818 */
  --card: oklch(0.976 0 0); /* #f7f7f7 */
  --card-foreground: oklch(0.209 0 0); /* #181818 */
  --popover: oklch(1 0 0); /* #ffffff */
  --popover-foreground: oklch(0.209 0 0); /* #181818 */
  --primary: oklch(0.77 0.212 148.67); /* #1ed760 */
  --primary-foreground: oklch(0 0 0); /* #000000 */
  --secondary: oklch(0.949 0 0); /* #eeeeee */
  --secondary-foreground: oklch(0.209 0 0); /* #181818 */
  --muted: oklch(0.949 0 0); /* #eeeeee */
  --muted-foreground: oklch(0.42 0 0); /* #4d4d4d */
  --accent: oklch(0.931 0 0); /* #e8e8e8 */
  --accent-foreground: oklch(0.209 0 0); /* #181818 */
  --destructive: oklch(0.708 0.159 15.826); /* #f3727f */
  --destructive-foreground: oklch(0.182 0 0); /* #121212 */
  --border: oklch(0.885 0 0); /* #d9d9d9 */
  --input: oklch(0.949 0 0); /* #eeeeee */
  --ring: oklch(0.77 0.212 148.67); /* #1ed760 */
  /* Charts */
  --chart-1: oklch(0.77 0.212 148.67); /* #1ed760 */
  --chart-2: oklch(0.688 0.15 254.162); /* #539df5 */
  --chart-3: oklch(0.792 0.163 67.425); /* #ffa42b */
  --chart-4: oklch(0.708 0.159 15.826); /* #f3727f */
  --chart-5: oklch(0.586 0 0); /* #7c7c7c */
  /* Sidebar */
  --sidebar: oklch(0.976 0 0); /* #f7f7f7 */
  --sidebar-foreground: oklch(0.42 0 0); /* #4d4d4d */
  --sidebar-primary: oklch(0.77 0.212 148.67); /* #1ed760 */
  --sidebar-primary-foreground: oklch(0 0 0); /* #000000 */
  --sidebar-accent: oklch(0.949 0 0); /* #eeeeee */
  --sidebar-accent-foreground: oklch(0.209 0 0); /* #181818 */
  --sidebar-border: oklch(0.885 0 0); /* #d9d9d9 */
  --sidebar-ring: oklch(0.77 0.212 148.67); /* #1ed760 */
}
.dark {
  /* shadcn semantic surfaces */
  --background: oklch(0.182 0 0); /* #121212 */
  --foreground: oklch(1 0 0); /* #ffffff */
  --card: oklch(0.209 0 0); /* #181818 */
  --card-foreground: oklch(1 0 0); /* #ffffff */
  --popover: oklch(0.239 0 0); /* #1f1f1f */
  --popover-foreground: oklch(1 0 0); /* #ffffff */
  --primary: oklch(0.77 0.212 148.67); /* #1ed760 */
  --primary-foreground: oklch(0 0 0); /* #000000 */
  --secondary: oklch(0.239 0 0); /* #1f1f1f */
  --secondary-foreground: oklch(1 0 0); /* #ffffff */
  --muted: oklch(0.264 0 0); /* #252525 */
  --muted-foreground: oklch(0.767 0 0); /* #b3b3b3 */
  --accent: oklch(0.273 0 0); /* #272727 */
  --accent-foreground: oklch(1 0 0); /* #ffffff */
  --destructive: oklch(0.708 0.159 15.826); /* #f3727f */
  --destructive-foreground: oklch(0.182 0 0); /* #121212 */
  --border: oklch(0.42 0 0); /* #4d4d4d */
  --input: oklch(0.239 0 0); /* #1f1f1f */
  --ring: oklch(0.77 0.212 148.67); /* #1ed760 */
  /* Charts */
  --chart-1: oklch(0.77 0.212 148.67); /* #1ed760 */
  --chart-2: oklch(0.688 0.15 254.162); /* #539df5 */
  --chart-3: oklch(0.792 0.163 67.425); /* #ffa42b */
  --chart-4: oklch(0.708 0.159 15.826); /* #f3727f */
  --chart-5: oklch(0.767 0 0); /* #b3b3b3 */
  /* Sidebar */
  --sidebar: oklch(0.182 0 0); /* #121212 */
  --sidebar-foreground: oklch(0.767 0 0); /* #b3b3b3 */
  --sidebar-primary: oklch(0.77 0.212 148.67); /* #1ed760 */
  --sidebar-primary-foreground: oklch(0 0 0); /* #000000 */
  --sidebar-accent: oklch(0.239 0 0); /* #1f1f1f */
  --sidebar-accent-foreground: oklch(1 0 0); /* #ffffff */
  --sidebar-border: oklch(0.264 0 0); /* #252525 */
  --sidebar-ring: oklch(0.77 0.212 148.67); /* #1ed760 */
}
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}
@layer components {
  .typo-heading1 {
    @apply text-3xl/9 font-bold tracking-[-0.02em];
  }
  .typo-heading2 {
    @apply text-2xl/8 font-bold tracking-[-0.01em];
  }
  .typo-heading3 {
    @apply text-xl/7 font-semibold tracking-[-0.005em];
  }
  .typo-title {
    @apply text-lg/6 font-semibold tracking-normal;
  }
  .typo-body-large {
    @apply text-lg/7 font-normal tracking-normal;
  }
  .typo-body {
    @apply text-base/6 font-normal tracking-normal;
  }
  .typo-body-small {
    @apply text-sm/5 font-normal tracking-normal;
  }
  .typo-label {
    @apply text-sm/5 font-medium tracking-normal;
  }
  .typo-caption {
    @apply text-xs/4 font-normal tracking-normal;
  }
  .typo-code {
    @apply text-base/6 font-mono tracking-normal;
  }
}
````

## File: README.md
````markdown
# Writing App UI Workspace

This repository has been reset to a Storybook and UI package workspace.

## Current structure

- `apps/storybook`: Storybook workbench for `@workspace/ui`
- `packages/ui`: shared UI components, styles, and utilities
- `packages/config`: shared ESLint and TypeScript configuration

## Adding components

To add components to the UI package, run the following command from the repository root:

```bash
bunx shadcn@latest add button -c packages/ui
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button"
```

## Scripts

`bun storybook` runs the Storybook development server.
`bun build-storybook` builds the static Storybook output.
`bun typecheck` typechecks the remaining workspaces.
`bun lint` runs lint for the remaining workspaces.

## use bun

use `@types/bun` instead of `@types/node`

## packs repository for agent

```
npx repomix@latest -i ".agent, .agents, .claude, .tmp, .vscode, docs, **/*.d.ts, **/*.test.ts, apps/storybook, packages/ui, packages/config, **/*.spec.ts"
```
````

## File: package.json
````json
{
  "name": "writing-app",
  "version": "0.0.1",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "turbo build",
    "build-storybook": "bun --filter storybook build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "format": "prettier --write \"*.{ts,tsx,js,jsx,cjs,mjs,json,md,mdx,yaml,yml,css}\" \"apps/**/*.{ts,tsx,js,jsx,cjs,mjs,json,md,mdx,yaml,yml,css}\" \"packages/**/*.{ts,tsx,js,jsx,cjs,mjs,json,md,mdx,yaml,yml,css}\" \"scripts/**/*.{ts,tsx,js,jsx,cjs,mjs,json,md,mdx,yaml,yml,css}\" \"docs/**/*.{ts,tsx,js,jsx,cjs,mjs,json,md,mdx,yaml,yml,css}\" --ignore-path .gitignore --ignore-path apps/docs/.gitignore",
    "format:check": "prettier --check \"*.{ts,tsx,js,jsx,cjs,mjs,json,md,mdx,yaml,yml,css}\" \"apps/**/*.{ts,tsx,js,jsx,cjs,mjs,json,md,mdx,yaml,yml,css}\" \"packages/**/*.{ts,tsx,js,jsx,cjs,mjs,json,md,mdx,yaml,yml,css}\" \"scripts/**/*.{ts,tsx,js,jsx,cjs,mjs,json,md,mdx,yaml,yml,css}\" \"docs/**/*.{ts,tsx,js,jsx,cjs,mjs,json,md,mdx,yaml,yml,css}\" --ignore-path .gitignore --ignore-path apps/docs/.gitignore",
    "storybook": "bun --filter storybook dev",
    "test": "turbo test",
    "test:coverage": "node ./node_modules/vitest/vitest.mjs run --config vitest.workspace.ts --coverage",
    "typecheck": "turbo typecheck",
    "prepare": "lefthook install",
    "repomix": "bunx repomix --style markdown --output codebase.md --remove-empty-lines --ignore 'sonnet-to-react, .agents, apps/docs, apps/storybook, docs, packages/config, scripts'"
  },
  "devDependencies": {
    "@playwright/test": "^1.58.2",
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@vitejs/plugin-react": "^6.0.1",
    "@vitest/coverage-v8": "^4.1.0",
    "@workspace/config": "workspace:*",
    "bun-types": "^1.3.11",
    "jsdom": "^29.0.0",
    "lefthook": "^2.1.3",
    "prettier": "^3.8.1",
    "turbo": "^2.8.8",
    "typescript": "5.9.3",
    "vite-tsconfig-paths": "^6.1.1",
    "vitest": "^4.1.0"
  },
  "engines": {
    "node": "20.x"
  },
  "packageManager": "bun@1.3.10"
}
````

## File: turbo.json
````json
{
  "$schema": "https://turbo.build/schema.json",
  "globalEnv": ["CI", "NODE_ENV"],
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "test": {
      "dependsOn": ["^test"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
````

## File: AGENTS.md
````markdown
# Project Structure Guide

- This repository is monorepo for writing learning platform project.
- This repository is a bun-managed monorepo with the following structure:

## Overview

- apps/web: nextjs fullstack server
- packages/ui: base-ui,reactjs,tailwindcss based shadcn library

## Task Guide

- Always update the documentation (/docs) to the latest version for changes when starting and finishing a task.

### Prerequisites

- bun 1310
- node 20

## Coding Guidelines

- All files use kebab-case
- Avoid unrelated refactoring, large-scale renaming, and formatting-only changes
- Code is readable and maintainable
- Every package must have a narrow and obvious purpose
- Limit changes to the smallest possible diff as much as possible
- Related files keep close to each other
- Prefer self-describing code over explanatory comments
- Prefer declarative and functional,predictable code
- Prefer domain language over technical filler words
- Keep runtime boundaries explicit
- Use Tsdoc to add explanations only for complex code.

### Typescript Principles

- use brand type for domain entities
- Make types carry meaning
- Prefer discriminated unions or explicit result variants over vague success flags
- Avoid:
  - `any`
  - weak `Record<string, unknown>` usage where a real type should exist
  - generic `{ success: boolean, data?: unknown, error?: string }` result shapes
- Do not include the file extension in the import path.
- Always use absolute paths when importing.

### Code Style

- Use Prettier for formatting only
- Keep one Prettier configuration at the repository root
- Use ESLint for linting across the monorepo
- Do not bikeshed formatting in reviews
- Optimize reviews for correctness, naming, coupling, and boundary clarity

When editing code:

- preserve existing repository formatting
- avoid unrelated reformatting in touched files
- keep diffs focused on the requested change

### Forbidden patterns

- Duplicate utility creation for the same purpose
- Misuse of relative path imports between apps
- Add conditionals to bypass test failures
- Leave dead code behind and defer “later cleanup”
- Unrelated file touch

### Validation checklist

- After the change, it must pass build, lint, typecheck, etc. to the extent possible.
- `bun lefthook run pre-commit` can be used to lint,formatting before commit

## Commit Guidelines

- Use Korean for commit messages
- Keep summary under 80 characters
- Commit message format:

```
<short summary of changes>

- [detailed description of changes 1(optional)]
- [detailed description of changes 2(optional)]
-
```

## After the task is finished

- Safely terminate all processes used for the task, such as Node.js and the bash.
````

## File: apps/web/src/app/globals.css
````css
@import "@workspace/ui/globals.css";
@source "../";
@keyframes lesson-confetti {
  0% {
    opacity: 1;
    transform: translateY(-20px) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translateY(100vh) rotate(720deg);
  }
}
@keyframes lesson-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in oklch, var(--primary) 40%, transparent);
  }
  50% {
    box-shadow: 0 0 0 8px color-mix(in oklch, var(--primary) 0%, transparent);
  }
}
@keyframes lesson-progress-fill {
  from {
    width: 60%;
  }
  to {
    width: 100%;
  }
}
````

## File: apps/web/next.config.ts
````typescript
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { NextConfig } from "next"
const appDirectory = dirname(fileURLToPath(import.meta.url))
const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true,
  turbopack: {
    root: join(appDirectory, "../.."),
  },
  transpilePackages: ["@workspace/ui"],
}
export default nextConfig
````

## File: apps/web/package.json
````json
{
  "name": "@workspace/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@workspace/ui": "workspace:*",
    "next": "16.2.5",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/bun": "^1.3.10",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@workspace/config": "workspace:*",
    "babel-plugin-react-compiler": "1.0.0",
    "eslint": "^9",
    "tailwindcss": "^4",
    "typescript": "5.9.3"
  },
  "ignoreScripts": [
    "sharp",
    "unrs-resolver"
  ],
  "trustedDependencies": [
    "sharp",
    "unrs-resolver"
  ]
}
````

## File: apps/web/src/app/layout.tsx
````typescript
import type { Metadata } from "next"
import { Noto_Sans_KR } from "next/font/google"
import { ThemeProvider } from "@workspace/ui/components/ui/theme-provider"
import { Toaster } from "@workspace/ui/components/ui/sonner"
import { AppShell } from "@/components/layout/app-shell"
import "./globals.css"
const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})
export const metadata: Metadata = {
  title: "한글쓰기 — 한국어 글쓰기 학습 플랫폼",
  description:
    "한국어 글쓰기를 체계적으로 배워보세요. 기초부터 고급까지 다양한 코스를 제공합니다.",
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={notoSansKr.className} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
````

## File: apps/web/src/app/page.tsx
````typescript
import { HomePage } from "@/features/home/home-page"
export default function Page() {
  return <HomePage />
}
````
