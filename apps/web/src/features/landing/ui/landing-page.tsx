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
    <div className="min-h-screen bg-bg-canvas text-fg-default">
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
