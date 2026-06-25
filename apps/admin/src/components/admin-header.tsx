import { PageHeader } from "@workspace/ui/components/ui/page-header"

export function AdminHeader({
  description,
  title,
}: {
  readonly description: string
  readonly title: string
}) {
  return <PageHeader description={description} title={title} />
}
