type TokenSwatchProps = {
  readonly background: string
  readonly foreground?: string
  readonly label: string
  readonly token: string
}

function TokenSwatch({
  background,
  foreground = "var(--semantic-color-fg-default)",
  label,
  token,
}: TokenSwatchProps) {
  return (
    <div
      className="grid min-h-36 content-between rounded-card border border-border/50 p-5"
      style={{ background, color: foreground }}
    >
      <span className="text-label-sm font-black">{token}</span>
      <strong className="text-title-lg">{label}</strong>
    </div>
  )
}

export { TokenSwatch }
