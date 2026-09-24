export function PageHeader({
  kicker,
  title,
  subtitle,
  action,
}: {
  kicker?: string
  title: React.ReactNode
  subtitle: string
  action?: React.ReactNode
}) {
  return (
    <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/35">
          {kicker ?? 'Workspace'}
        </p>
        <h1 className="text-[32px] font-semibold tracking-[-0.055em] sm:text-[40px]">{title}</h1>
        <p className="mt-2 text-[14px] text-black/45">{subtitle}</p>
      </div>
      {action}
    </header>
  )
}
