import { cva } from "class-variance-authority"

export const fieldControlVariants = cva(
  "w-full min-w-0 border border-field-border bg-transparent outline-none transition-[color,box-shadow,border-color] placeholder:text-muted-foreground hover:border-field-border-hover focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
)

export const fieldControlGroupVariants = cva(
  "group/input-group relative flex w-full min-w-0 items-center rounded-lg border border-field-border bg-transparent outline-none transition-[color,box-shadow,border-color] hover:border-field-border-hover in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-disabled:opacity-50 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]]:ring-3 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40"
)
