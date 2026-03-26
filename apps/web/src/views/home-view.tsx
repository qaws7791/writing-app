"use client"

import { useHomeQuery } from "@/features/home/hooks/use-home-query"
import { ResumeWritingCard } from "@/features/home/components/resume-writing-card"
import { TodayPromptsSection } from "@/features/home/components/today-prompts-section"
import { HomeWritingsTab } from "@/features/home/components/home-writings-tab"
import { HomeSavedPromptsTab } from "@/features/home/components/home-saved-prompts-tab"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

export default function HomeView() {
  const { data: home, isLoading, isError } = useHomeQuery()

  const resumeWriting = home?.resumeWriting ?? null
  const todayPrompts = home?.todayPrompts ?? []
  const recentWritings = home?.recentWritings ?? []
  const savedPrompts = home?.savedPrompts ?? []

  return (
    <div className="min-h-svh flex-1 bg-background px-6 py-16 lg:px-24">
      <div className="mx-auto max-w-5xl">
        <section className="mb-12 flex items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl leading-snug font-medium tracking-tight text-foreground md:text-4xl">
              오늘도,
              <br />
              그냥 써봐요
            </h1>
          </div>
        </section>

        {resumeWriting && <ResumeWritingCard writing={resumeWriting} />}

        <TodayPromptsSection
          prompts={todayPrompts}
          isLoading={isLoading}
          isError={isError}
        />

        <section>
          <Tabs defaultValue="writings">
            <TabsList className="mb-6 gap-0">
              <TabsTrigger value="writings">내가 쓰는 글</TabsTrigger>
              <TabsTrigger value="saved">저장한 글감</TabsTrigger>
            </TabsList>

            <TabsContent value="writings">
              <HomeWritingsTab
                writings={recentWritings}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="saved">
              <HomeSavedPromptsTab
                prompts={savedPrompts}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  )
}
