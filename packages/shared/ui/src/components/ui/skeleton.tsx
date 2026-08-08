import { cn } from "#ui/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-skeleton rounded-xl bg-foreground/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
