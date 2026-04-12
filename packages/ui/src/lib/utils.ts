import { twMerge } from "tailwind-merge"

/** Merges Tailwind CSS class names, resolving conflicts. */
export const cn = (...inputs: Parameters<typeof twMerge>) => twMerge(...inputs)
