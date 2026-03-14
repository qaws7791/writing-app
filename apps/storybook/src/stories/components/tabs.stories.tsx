import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  parameters: shadcnParameters("tabs"),
} satisfies Meta<typeof Tabs>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-8">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="drafts">Drafts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <div className="rounded-lg border p-6">
          <TabsContent value="overview">
            A calm default variant for primary workspace navigation.
          </TabsContent>
          <TabsContent value="drafts">
            Drafts waiting for attention, grouped by editorial stage.
          </TabsContent>
          <TabsContent value="analytics">
            Reader behavior and completion metrics for published pieces.
          </TabsContent>
        </div>
      </Tabs>

      <Tabs defaultValue="account" orientation="vertical">
        <TabsList variant="line">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        <div className="rounded-lg border p-6">
          <TabsContent value="account">
            Manage author profile details.
          </TabsContent>
          <TabsContent value="notifications">
            Control digest emails and review alerts.
          </TabsContent>
          <TabsContent value="appearance">
            Tune density and contrast for your writing environment.
          </TabsContent>
        </div>
      </Tabs>
    </div>
  ),
}
