type KeyboardRow = {
  readonly action: string
  readonly keyName: string
}

function KeyboardTable({ rows }: { readonly rows: readonly KeyboardRow[] }) {
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr>
          <th className="border-b border-border/50 py-2 pr-4 text-label-sm font-black text-muted-foreground">
            키
          </th>
          <th className="border-b border-border/50 py-2 text-label-sm font-black text-muted-foreground">
            동작
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.keyName}>
            <td className="border-b border-border/50 py-2 pr-4">
              <kbd className="rounded-md border border-border bg-surface px-2 py-1 text-caption font-black">
                {row.keyName}
              </kbd>
            </td>
            <td className="border-b border-border/50 py-2 text-body-sm font-semibold">
              {row.action}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export { KeyboardTable }
