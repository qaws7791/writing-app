import Link from "next/link"
import {
  CompassIcon,
  Home01Icon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

const links = [
  {
    href: "/",
    icon: Home01Icon,
    label: "Inbox",
  },
  {
    href: "/prompts",
    icon: CompassIcon,
    label: "Prompts",
  },
  {
    href: "/write",
    icon: PencilEdit02Icon,
    label: "Write",
  },
]

export default function GlobalNavigation() {
  return (
    <nav className="flex flex-col items-center bg-[#FAFAFA] px-4">
      <div className="my-auto flex flex-col gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex h-12 w-12 items-center justify-center rounded-[16px] text-[#4A5568] transition-colors hover:bg-neutral-100 hover:text-[#111111]"
            title={link.label}
          >
            <HugeiconsIcon
              icon={link.icon}
              size={24}
              color="currentColor"
              strokeWidth={1.5}
            />
          </Link>
        ))}
      </div>
    </nav>
  )
}
