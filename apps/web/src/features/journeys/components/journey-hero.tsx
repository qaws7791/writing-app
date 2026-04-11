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
      <div className="mx-4 aspect-4/3 overflow-hidden rounded-[2rem] bg-surface-container-high">
        <img
          src={thumbnailUrl}
          alt={title}
          className="size-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-4 px-5 pt-6">
        <h1 className="text-headline-large-em text-on-surface">{title}</h1>
        <p className="text-body-large text-on-surface-low opacity-80">
          {description}
        </p>
      </div>
    </>
  )
}
