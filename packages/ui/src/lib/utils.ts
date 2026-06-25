import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-display-lg",
        "text-display-md",
        "text-heading-xl",
        "text-heading-lg",
        "text-heading-md",
        "text-heading-sm",
        "text-title-lg",
        "text-title-md",
        "text-body-lg",
        "text-body-md",
        "text-body-sm",
        "text-label-md",
        "text-label-sm",
        "text-caption",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return customTwMerge(clsx(inputs))
}
