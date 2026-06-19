"use client"

import { useRouter } from "next/navigation"

import { useLandingChromeMotion } from "@/features/landing/landing-motion"
import {
  Features,
  FinalCta,
  Footer,
  Hero,
  HowItWorks,
  LandingNav,
  Marquee,
  Showcase,
  Stats,
} from "@/features/landing/landing-sections"

export function LandingPage() {
  const router = useRouter()
  const { glowPosition, navScrolled } = useLandingChromeMotion()

  const goRoot = () => {
    router.push("/")
  }

  const startLearning = () => {
    router.push("/app")
  }

  const browseCourses = () => {
    router.push("/app/courses")
  }

  return (
    <div className="relative bg-cream text-charcoal min-h-screen overflow-x-hidden">
      <div
        aria-hidden
        className="fixed z-0 rounded-full bg-primary pointer-events-none hidden md:block"
        style={{
          filter: "blur(8px)",
          height: 220,
          opacity: 0.14,
          transform: `translate(${glowPosition.x}px, ${glowPosition.y}px)`,
          width: 220,
        }}
      />
      <div className="relative z-10">
        <LandingNav
          goRoot={goRoot}
          navScrolled={navScrolled}
          startLearning={startLearning}
        />
        <Hero browseCourses={browseCourses} startLearning={startLearning} />
        <Marquee />
        <Features />
        <HowItWorks />
        <Stats />
        <Showcase />
        <FinalCta startLearning={startLearning} />
        <Footer />
      </div>
    </div>
  )
}
