export function JourneyHero({
  thumbnailUrl,
  title,
  description,
}: {
  thumbnailUrl: string
  title: string
  description: string
}) {
  return (
    <>
      <div className="mx-4 aspect-4/3 overflow-hidden rounded-[2rem] bg-surface-tertiary">
        <img
          src={thumbnailUrl}
          alt={title}
          className="size-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-4 px-5 pt-6">
        <h1 className="text-3xl leading-tight font-semibold text-foreground">
          {title}
        </h1>
        <p className="text-base leading-7 text-muted opacity-80">
          {description}
        </p>
      </div>
    </>
  )
}
