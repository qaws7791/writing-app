import {
  LandingNavMotion,
  LandingPointerGlow,
} from "@/features/landing/landing-motion"
import {
  Features,
  FinalCta,
  Footer,
  Hero,
  HowItWorks,
  Marquee,
  Showcase,
  Stats,
} from "@/features/landing/landing-sections"

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <LandingPointerGlow />
      <div className="relative z-10">
        <LandingNavMotion />
        <Hero />
        <Marquee />
        <Features />
        <HowItWorks />
        <Stats />
        <Showcase />
        <FinalCta />
        <Footer />
      </div>
    </div>
  )
}
