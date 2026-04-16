import type { VariantProps } from "@workspace/ui/utils/tv"

import { tv } from "@workspace/ui/utils/tv"

export const sidebarVariants = tv({
  slots: {
    base: "flex h-[100dvh] w-[260px] flex-col transition-all",
    header: "flex shrink-0 items-center px-6 py-8",
    body: "flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-2 scrollbar-hide",
    footer: "flex shrink-0 flex-col gap-1 px-4 py-4 mt-auto",
  },
})

export type SidebarVariants = VariantProps<typeof sidebarVariants>
