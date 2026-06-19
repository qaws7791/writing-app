"use client"

import { useState } from "react"

import Link from "next/link"

import { globalNavClassName } from "@/components/layout/global-nav-class-name"
import { globalNavAccountItems } from "@/components/layout/global-nav-routes"

export function GlobalNavAccountMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="w-9 h-9 bg-primary rounded-full flex justify-center items-center font-black btn-squish ring-2 ring-surface hover:ring-surface-hover"
        onClick={() => setIsOpen((current) => !current)}
        style={{ fontSize: "0.9375rem" }}
        type="button"
      >
        ✍️
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-12 bg-cream border-2 border-surface rounded-4xl p-4 w-48 z-50">
          {globalNavAccountItems.map((item) => (
            <Link
              className={globalNavClassName(
                "block w-full text-left font-bold py-3 px-4 rounded-3xl hover:bg-surface",
                item.tone === "danger" && "text-coral-dark"
              )}
              href={item.href}
              key={item.label}
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}
