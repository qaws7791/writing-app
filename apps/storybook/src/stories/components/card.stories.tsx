import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  parameters: { layout: "centered" },
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Filled Card</CardTitle>
        <CardDescription>The default Card variant.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
      <CardFooter>
        <p>Card Footer</p>
      </CardFooter>
    </Card>
  ),
}

export const Filled: Story = {
  render: () => (
    <Card className="w-[350px]" variant="filled">
      <CardHeader>
        <CardTitle>Filled Card</CardTitle>
        <CardDescription>Uses a filled surface treatment.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
    </Card>
  ),
}

export const Outlined: Story = {
  render: () => (
    <Card className="w-[350px]" variant="outlined">
      <CardHeader>
        <CardTitle>Outlined Card</CardTitle>
        <CardDescription>Uses a visible boundary.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card Content</p>
      </CardContent>
    </Card>
  ),
}

export const WithForm: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one-click.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Name of your project" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  ),
}

export const WithAction: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">
            Mark all read
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          No new notifications at the moment.
        </p>
      </CardContent>
    </Card>
  ),
}

export const Small: Story = {
  render: () => (
    <Card className="w-[350px]" size="sm" variant="filled">
      <CardHeader>
        <CardTitle>Small Card</CardTitle>
        <CardDescription>A more compact card variant.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Compact content</p>
      </CardContent>
    </Card>
  ),
}
