import type { ReactNode, SVGProps } from "react"

export {
  ArrowRight as ArrowRightIcon,
  CheckCircle2 as CheckCircleIcon,
  GraduationCap as GraduationCapIcon,
  Layers as LayersIcon,
  LogIn as LogInIcon,
  Puzzle as PuzzleIcon,
  Sparkles as SparklesIcon,
} from "lucide-react"

type KwepIconProps = Omit<SVGProps<SVGSVGElement>, "height" | "width"> & {
  readonly size?: number
}

export function BookOpenIcon({
  className,
  size = 24,
  ...props
}: KwepIconProps) {
  return (
    <KwepSvg className={className} iconName="book-open" size={size} {...props}>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </KwepSvg>
  )
}

export function ChevronRightIcon({
  className,
  size = 24,
  ...props
}: KwepIconProps) {
  return (
    <KwepSvg
      className={className}
      iconName="chevron-right"
      size={size}
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </KwepSvg>
  )
}

export function FlameIcon({ className, size = 24, ...props }: KwepIconProps) {
  return (
    <KwepSvg className={className} iconName="flame" size={size} {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </KwepSvg>
  )
}

export function HomeIcon({ className, size = 24, ...props }: KwepIconProps) {
  return (
    <KwepSvg className={className} iconName="house" size={size} {...props}>
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </KwepSvg>
  )
}

export function UserIcon({ className, size = 24, ...props }: KwepIconProps) {
  return (
    <KwepSvg className={className} iconName="user" size={size} {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </KwepSvg>
  )
}

function KwepSvg({
  children,
  className,
  iconName,
  size,
  ...props
}: KwepIconProps & {
  readonly children: ReactNode
  readonly iconName: string
  readonly size: number
}) {
  const mergedClassName = `lucide lucide-${iconName}${className ? ` ${className}` : ""}`

  return (
    <svg
      className={mergedClassName}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  )
}
