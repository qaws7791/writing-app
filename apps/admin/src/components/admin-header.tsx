export function AdminHeader({
  description,
  title,
}: {
  readonly description: string
  readonly title: string
}) {
  return (
    <header className="admin-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </header>
  )
}
