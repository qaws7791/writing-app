import {
  FinalCtaSection,
  Footer,
  HeroSection,
  LandingNav,
  LearningMethodSection,
  ProductPreviewSection,
} from "@/features/landing/ui/landing-sections"

export function LandingPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <LandingNav />
      <main>
        <HeroSection />
        <LearningMethodSection />
        <ProductPreviewSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  )
}
