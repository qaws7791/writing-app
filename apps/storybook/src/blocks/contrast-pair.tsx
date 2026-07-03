type ContrastPairProps = {
  readonly background: string
  readonly foreground: string
  readonly label: string
  readonly role: string
}

function ContrastPair({
  background,
  foreground,
  label,
  role,
}: ContrastPairProps) {
  return (
    <div
      className="grid gap-2 rounded-panel border border-border/50 p-5"
      style={{ background, color: foreground }}
    >
      <span className="text-label-sm font-black">{role}</span>
      <strong className="text-title-md">{label}</strong>
      <p className="text-body-sm font-semibold">
        전경과 배경을 함께 쓰는 semantic pair다.
      </p>
    </div>
  )
}

export { ContrastPair }
