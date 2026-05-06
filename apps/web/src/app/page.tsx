import type { LucideIcon } from "lucide-react"
import {
  BadgeCheck,
  Bell,
  Bot,
  Boxes,
  ChevronDown,
  ChevronRight,
  CircleEllipsis,
  Code2,
  Copy,
  FileAudio,
  FileText,
  Folder,
  FolderOpen,
  Headphones,
  HomeIcon,
  ImageIcon,
  Languages,
  MessageCircleQuestion,
  Mic2,
  Moon,
  Music2,
  PanelLeft,
  Play,
  Plus,
  Send,
  Sparkles,
  Volume2,
  WandSparkles,
  Zap,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/ui/badge"
import { Button } from "@workspace/ui/components/ui/button"
import { cn } from "@workspace/ui/lib/utils"

type NavigationItem = {
  icon: LucideIcon
  label: string
  active?: boolean
  action?: boolean
}

type ProductItem = {
  accent: string
  description: string
  icon: LucideIcon
  label: string
  media: "document" | "cover" | "timeline" | "disc" | "wave" | "dub"
}

type LibraryVoice = {
  accent: string
  description: string
  name: string
}

type VoiceAction = {
  accent: string
  description: string
  icon: LucideIcon
  title: string
  visual: "design" | "clone" | "collections"
}

const primaryNavigation: NavigationItem[] = [
  { icon: HomeIcon, label: "Home", active: true },
  { icon: Boxes, label: "Voices", action: true },
  { icon: FileAudio, label: "Studio" },
  { icon: Bot, label: "Flows" },
  { icon: Folder, label: "Files" },
]

const pinnedNavigation: NavigationItem[] = [
  { icon: Volume2, label: "Text to Speech" },
  { icon: Sparkles, label: "Sound Effects" },
  { icon: ImageIcon, label: "Image & Video" },
  { icon: Headphones, label: "Voice Isolator" },
  { icon: Mic2, label: "Voice Changer" },
  { icon: Music2, label: "Music" },
  { icon: FileText, label: "Speech to Text" },
]

const products: ProductItem[] = [
  {
    accent: "bg-indigo-500",
    description: "Polished narration from a simple script.",
    icon: Volume2,
    label: "Instant speech",
    media: "document",
  },
  {
    accent: "bg-red-500",
    description: "Long-form reading with a natural pace.",
    icon: Headphones,
    label: "Audiobook",
    media: "cover",
  },
  {
    accent: "bg-emerald-500",
    description: "Create clips with generated voices.",
    icon: ImageIcon,
    label: "Image & Video",
    media: "timeline",
  },
  {
    accent: "bg-violet-500",
    description: "Build conversational agents.",
    icon: Bot,
    label: "ElevenAgents",
    media: "disc",
  },
  {
    accent: "bg-orange-500",
    description: "Compose tracks and vocals.",
    icon: Music2,
    label: "Music",
    media: "wave",
  },
  {
    accent: "bg-green-500",
    description: "Translate and revoice video.",
    icon: Languages,
    label: "Dubbed video",
    media: "dub",
  },
]

const libraryVoices: LibraryVoice[] = [
  {
    accent: "from-emerald-200 to-teal-600",
    description:
      "Harry Kim - conversational - Steady, soft, and natural - ideal for podcasts,...",
    name: "Harry Kim - Conversational",
  },
  {
    accent: "from-red-300 to-rose-600",
    description: "Young Korean female voice. Great for Narrations.",
    name: "Chloe Cha - Tender, Clam and Clear",
  },
  {
    accent: "from-sky-200 to-blue-600",
    description:
      "KKC Modern - A crisp, youthful, and clear Korean male voice suitable for...",
    name: "Dan - Calm, Measured and Clear",
  },
  {
    accent: "from-blue-200 to-sky-500",
    description: "Kim - Middle-aged male voice. Suitable for Narration.",
    name: "Kim - Neutral, Steady and Calm",
  },
  {
    accent: "from-amber-200 to-red-400",
    description: "Male, baritone voice, friendly and professional.",
    name: "Sangcheol",
  },
]

const voiceActions: VoiceAction[] = [
  {
    accent: "bg-red-500",
    description: "Design an entirely new voice from a text prompt",
    icon: WandSparkles,
    title: "Voice Design",
    visual: "design",
  },
  {
    accent: "bg-emerald-500",
    description: "Create a realistic digital clone of your voice",
    icon: Copy,
    title: "Clone your Voice",
    visual: "clone",
  },
  {
    accent: "bg-indigo-500",
    description: "Curated AI voices for every use case",
    icon: Boxes,
    title: "Voice Collections",
    visual: "collections",
  },
]

const waveBars = [
  { key: "quiet-start", heightClass: "h-1" },
  { key: "lift", heightClass: "h-2.5" },
  { key: "dip", heightClass: "h-1.5" },
  { key: "rise", heightClass: "h-3" },
  { key: "middle", heightClass: "h-2" },
  { key: "peak", heightClass: "h-4" },
  { key: "crest", heightClass: "h-5" },
  { key: "fall", heightClass: "h-2.5" },
  { key: "soft", heightClass: "h-1.5" },
  { key: "echo", heightClass: "h-3" },
  { key: "quiet-end", heightClass: "h-1" },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-muted/35 lg:flex">
          <Sidebar />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <MobileNavigation />

          <div className="flex-1 px-5 py-6 sm:px-8 lg:px-10">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-9">
              <HeroHeader />
              <ProductGrid />

              <section className="grid gap-10 xl:grid-cols-2">
                <LibrarySection />
                <VoiceCreationSection />
              </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function Sidebar() {
  return (
    <div className="flex min-h-screen flex-col px-3 py-4">
      <div className="flex h-9 items-center px-2 text-lg font-semibold tracking-tight">
        ||ElevenLabs
      </div>

      <button
        type="button"
        className="mt-4 flex h-10 items-center justify-between rounded-lg border border-border bg-background px-2 text-sm shadow-xs"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <Sparkles className="size-3.5" aria-hidden="true" />
          </span>
          <span className="truncate font-medium">ElevenCreative</span>
        </span>
        <ChevronDown
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      </button>

      <nav className="mt-3 flex flex-col gap-1" aria-label="Primary">
        {primaryNavigation.map((item) => (
          <NavigationButton key={item.label} item={item} />
        ))}
      </nav>

      <div className="mt-6 px-2 text-sm font-medium text-muted-foreground">
        Pinned
      </div>
      <nav className="mt-2 flex flex-col gap-1" aria-label="Pinned">
        {pinnedNavigation.map((item) => (
          <NavigationButton key={item.label} item={item} />
        ))}
        <button
          type="button"
          className="flex h-8 items-center justify-between rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <span className="flex min-w-0 items-center gap-2">
            <CircleEllipsis className="size-4" aria-hidden="true" />
            <span className="truncate">More tools</span>
          </span>
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <button
          type="button"
          className="flex flex-col gap-2 rounded-xl border border-border bg-background p-4 text-left shadow-sm"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Send className="size-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold">Invite team members</span>
          <span className="text-xs leading-5 text-muted-foreground">
            Bring your team in to collaborate and share your creations.
          </span>
        </button>

        <button
          type="button"
          className="flex h-8 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Code2 className="size-4" aria-hidden="true" />
          Developers
        </button>

        <Button type="button" variant="outline" size="sm" className="w-full">
          <Zap data-icon="inline-start" />
          Upgrade
        </Button>
      </div>
    </div>
  )
}

function NavigationButton({ item }: { item: NavigationItem }) {
  const Icon = item.icon

  return (
    <button
      type="button"
      className={cn(
        "flex h-8 items-center justify-between rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        item.active && "bg-muted text-foreground"
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{item.label}</span>
      </span>
      {item.action ? (
        <span className="flex size-5 items-center justify-center rounded-md border border-border bg-background">
          <Plus className="size-3" aria-hidden="true" />
        </span>
      ) : null}
    </button>
  )
}

function TopBar() {
  return (
    <header className="flex h-12 items-center justify-between gap-3 border-b border-border px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <PanelLeft
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="truncate text-sm font-medium">Home</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex"
        >
          Feedback
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="hidden sm:inline-flex"
        >
          Docs
        </Button>
        <Button type="button" variant="outline" size="sm">
          <MessageCircleQuestion data-icon="inline-start" />
          Ask
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Files"
        >
          <FolderOpen />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Notifications"
        >
          <Bell />
        </Button>
        <span className="flex size-9 items-center justify-center rounded-full border border-border bg-gradient-to-br from-blue-100 via-amber-100 to-slate-200 text-xs font-semibold">
          MC
        </span>
      </div>
    </header>
  )
}

function MobileNavigation() {
  return (
    <div className="border-b border-border px-4 py-3 lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">
            ||ElevenLabs
          </span>
        </div>
        <Button type="button" variant="outline" size="sm">
          <Zap data-icon="inline-start" />
          Upgrade
        </Button>
      </div>
      <nav
        className="mt-3 flex gap-2 overflow-x-auto"
        aria-label="Mobile tools"
      >
        {primaryNavigation.concat(pinnedNavigation.slice(0, 4)).map((item) => {
          const Icon = item.icon

          return (
            <button
              key={item.label}
              type="button"
              className={cn(
                "flex h-9 shrink-0 items-center gap-2 rounded-full border border-border bg-background px-3 text-sm font-medium text-muted-foreground",
                item.active && "bg-foreground text-background"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {item.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function HeroHeader() {
  return (
    <section className="flex flex-col gap-7">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit rounded-full pl-1"
      >
        <Badge className="rounded-full bg-foreground px-2.5 text-background hover:bg-foreground">
          New
        </Badge>
        Introducing Flows Collaboration
        <ChevronRight data-icon="inline-end" />
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-medium text-muted-foreground">
            몽쉘&apos;s Workspace
          </p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Good morning, 몽쉘
          </h1>
        </div>
        <Moon className="mt-2 size-5 shrink-0" aria-hidden="true" />
      </div>
    </section>
  )
}

function ProductGrid() {
  return (
    <section
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6"
      aria-label="Creation tools"
    >
      {products.map((product) => (
        <button
          key={product.label}
          type="button"
          className="group flex min-w-0 flex-col gap-3 rounded-lg text-left"
        >
          <span className="flex aspect-square items-center justify-center rounded-2xl bg-muted transition-colors group-hover:bg-muted/70">
            <ProductIllustration product={product} />
          </span>
          <span className="flex min-w-0 flex-col gap-1 px-1 text-center">
            <span className="truncate text-sm font-medium text-foreground">
              {product.label}
            </span>
            <span className="sr-only">{product.description}</span>
          </span>
        </button>
      ))}
    </section>
  )
}

function ProductIllustration({ product }: { product: ProductItem }) {
  const Icon = product.icon

  return (
    <span className="relative flex size-24 items-center justify-center">
      <span
        className={cn(
          "absolute z-10 flex size-8 items-center justify-center rounded-full text-white shadow-sm",
          product.accent
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <ProductMedia product={product} />
    </span>
  )
}

function ProductMedia({ product }: { product: ProductItem }) {
  if (product.media === "document") {
    return (
      <span className="absolute right-1 top-4 flex size-14 flex-col gap-1.5 rounded-lg border border-border bg-background p-3 shadow-sm">
        <span className="h-1.5 rounded-full bg-indigo-200" />
        <span className="h-1.5 rounded-full bg-indigo-100" />
        <span className="h-1.5 w-8 rounded-full bg-indigo-100" />
        <span className="h-1.5 w-4 self-end rounded-full bg-indigo-500" />
      </span>
    )
  }

  if (product.media === "cover") {
    return (
      <>
        <span className="absolute right-1 top-3 flex size-14 flex-col gap-1 rounded-lg border border-border bg-background p-2 shadow-sm">
          <span className="h-1 rounded-full bg-red-200" />
          <span className="h-1 rounded-full bg-red-100" />
          <span className="h-1 rounded-full bg-red-200" />
        </span>
        <span className="absolute bottom-4 right-0 size-10 rotate-12 rounded-md bg-gradient-to-br from-red-200 to-red-600 shadow-sm" />
      </>
    )
  }

  if (product.media === "timeline") {
    return (
      <>
        <span className="absolute right-1 top-4 flex size-14 flex-col gap-2 rounded-lg border border-border bg-background p-3 shadow-sm">
          <span className="h-1.5 w-4 rounded-full bg-emerald-200" />
          <span className="h-1.5 w-7 rounded-full bg-emerald-100" />
          <span className="h-1.5 rounded-full bg-emerald-100" />
        </span>
        <span className="absolute right-0 top-9 flex size-7 items-center justify-center rounded-full bg-indigo-500 text-white">
          <Play className="size-3.5 fill-current" aria-hidden="true" />
        </span>
      </>
    )
  }

  if (product.media === "disc") {
    return (
      <span className="absolute right-3 top-4 size-16 rounded-full bg-conic-from-0 from-yellow-200 via-amber-500 to-yellow-100 shadow-sm">
        <span className="absolute inset-5 rounded-full bg-muted" />
        <span className="absolute bottom-3 left-0 h-3 w-10 rounded bg-violet-500" />
      </span>
    )
  }

  if (product.media === "wave") {
    return (
      <span className="absolute inset-x-3 top-9 flex items-end justify-center gap-1">
        {waveBars.map((bar) => (
          <span
            key={`${product.label}-${bar.key}`}
            className={cn("w-1 rounded-full bg-orange-300", bar.heightClass)}
          />
        ))}
        <span className="absolute left-12 -top-5 h-9 border-l-2 border-foreground" />
        <span className="absolute left-11 -top-6 size-3 rounded-full bg-foreground" />
      </span>
    )
  }

  return (
    <>
      <span className="absolute right-1 top-3 size-14 rotate-6 rounded-md bg-gradient-to-br from-stone-200 via-amber-100 to-stone-500 shadow-sm" />
      <span className="absolute bottom-4 left-7 flex h-4 w-12 items-center gap-0.5 rounded bg-emerald-500 px-1">
        <span className="h-1.5 flex-1 rounded-full bg-background" />
        <span className="h-2 flex-1 rounded-full bg-background" />
        <span className="h-1 flex-1 rounded-full bg-background" />
      </span>
    </>
  )
}

function LibrarySection() {
  return (
    <section className="flex min-w-0 flex-col gap-5">
      <h2 className="text-xl font-semibold tracking-tight">
        Latest from the library
      </h2>
      <div className="flex flex-col gap-3">
        {libraryVoices.map((voice) => (
          <button
            key={voice.name}
            type="button"
            className="group flex min-w-0 items-center gap-3 rounded-lg text-left"
          >
            <span
              className={cn(
                "relative flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white",
                voice.accent
              )}
            >
              <BadgeCheck className="absolute -right-1 -top-1 size-4 fill-yellow-300 text-yellow-500" />
              <Volume2 className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold group-hover:underline">
                {voice.name}
              </span>
              <span className="block truncate text-sm text-muted-foreground">
                {voice.description}
              </span>
            </span>
          </button>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" className="w-fit">
        Explore Library
      </Button>
    </section>
  )
}

function VoiceCreationSection() {
  return (
    <section className="flex min-w-0 flex-col gap-5">
      <h2 className="text-xl font-semibold tracking-tight">
        Create or clone a voice
      </h2>
      <div className="flex flex-col gap-5">
        {voiceActions.map((action) => (
          <button
            key={action.title}
            type="button"
            className="group grid min-w-0 grid-cols-1 gap-4 rounded-lg text-left sm:grid-cols-3 sm:items-center"
          >
            <span className="flex h-24 items-center justify-center rounded-2xl bg-muted sm:col-span-1">
              <VoiceActionVisual action={action} />
            </span>
            <span className="min-w-0 sm:col-span-2">
              <span className="block text-sm font-semibold group-hover:underline">
                {action.title}
              </span>
              <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                {action.description}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

function VoiceActionVisual({ action }: { action: VoiceAction }) {
  const Icon = action.icon

  if (action.visual === "clone") {
    return (
      <span className="relative flex size-16 items-center justify-center">
        <span className="absolute left-2 flex size-9 -rotate-12 items-center justify-center rounded-lg bg-emerald-400 text-white">
          <Copy className="size-4" aria-hidden="true" />
        </span>
        <span className="absolute right-2 flex size-9 rotate-12 items-center justify-center rounded-lg bg-emerald-500 text-white">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
      </span>
    )
  }

  if (action.visual === "collections") {
    return (
      <span className="relative flex size-16 items-center justify-center">
        <span className="absolute left-2 size-9 -rotate-6 rounded-lg bg-gradient-to-br from-slate-200 to-slate-600" />
        <span className="absolute right-2 flex size-9 rotate-9 items-center justify-center rounded-lg bg-indigo-500 text-white">
          <Boxes className="size-4" aria-hidden="true" />
        </span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        "flex size-9 items-center justify-center rounded-lg text-white shadow-sm",
        action.accent
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
    </span>
  )
}
