import type { ReactNode, SVGProps } from "react"

export {
  Archive as ArchiveIcon,
  ArrowRight as ArrowRightIcon,
  BarChart3 as BarChartIcon,
  Bot as BotIcon,
  CheckCircle2 as CheckCircleIcon,
  FileText as FileTextIcon,
  FolderOpen as FolderOpenIcon,
  GraduationCap as GraduationCapIcon,
  Layers as LayersIcon,
  LayoutDashboard as LayoutDashboardIcon,
  LogIn as LogInIcon,
  MessageSquarePlus as MessageSquarePlusIcon,
  Plus as PlusIcon,
  Puzzle as PuzzleIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  ShieldCheck as ShieldCheckIcon,
  Sparkles as SparklesIcon,
  Trash2 as TrashIcon,
  UserPlus as UserPlusIcon,
  Users as UsersIcon,
} from "lucide-react"

type IconProps = Omit<SVGProps<SVGSVGElement>, "height" | "width"> & {
  readonly size?: number
}

export function BookOpenIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <SvgIcon className={className} iconName="book-open" size={size} {...props}>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </SvgIcon>
  )
}

export function CheckIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <SvgIcon className={className} iconName="check" size={size} {...props}>
      <path d="M20 6 9 17l-5-5" />
    </SvgIcon>
  )
}

export function ChevronDownIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <SvgIcon
      className={className}
      iconName="chevron-down"
      size={size}
      {...props}
    >
      <path d="m6 9 6 6 6-6" />
    </SvgIcon>
  )
}

export function ChevronLeftIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <SvgIcon
      className={className}
      iconName="chevron-left"
      size={size}
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </SvgIcon>
  )
}

export function ChevronRightIcon({
  className,
  size = 24,
  ...props
}: IconProps) {
  return (
    <SvgIcon
      className={className}
      iconName="chevron-right"
      size={size}
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </SvgIcon>
  )
}

export function FlameIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <SvgIcon className={className} iconName="flame" size={size} {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </SvgIcon>
  )
}

export function LockIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <SvgIcon className={className} iconName="lock" size={size} {...props}>
      <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </SvgIcon>
  )
}

export function PlayIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <SvgIcon className={className} iconName="play" size={size} {...props}>
      <polygon points="6 3 20 12 6 21 6 3" />
    </SvgIcon>
  )
}

export function HomeIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <SvgIcon className={className} iconName="house" size={size} {...props}>
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </SvgIcon>
  )
}

export function UserIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <SvgIcon className={className} iconName="user" size={size} {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </SvgIcon>
  )
}

export function XIcon({ className, size = 24, ...props }: IconProps) {
  return (
    <SvgIcon className={className} iconName="x" size={size} {...props}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </SvgIcon>
  )
}

function SvgIcon({
  children,
  className,
  iconName,
  size,
  ...props
}: IconProps & {
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
