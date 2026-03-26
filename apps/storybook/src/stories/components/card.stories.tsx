import type { Meta, StoryObj } from "@storybook/react-vite"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { shadcnParameters } from "../lib/shadcn-story"

const meta = {
  title: "Components/Card",
  component: Card,
  parameters: shadcnParameters("card"),
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof meta>

export const Showcase: Story = {
  render: () => (
    <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Weekly writing review</CardTitle>
          <CardDescription>
            Keep the editorial queue focused on pieces that need attention now.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">7 items</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-muted-foreground">
          <p>2 essays are ready for copy edits.</p>
          <p>3 articles are waiting on imagery.</p>
          <p>2 newsletters need a final subject line.</p>
        </CardContent>
        <CardFooter className="gap-2">
          <Button>Open board</Button>
          <Button variant="outline">Assign editor</Button>
        </CardFooter>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Reading note</CardTitle>
          <CardDescription>
            Compact composition for supporting content.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground">
          Contrast stays strong while spacing remains light and editorial.
        </CardContent>
      </Card>
    </div>
  ),
}
