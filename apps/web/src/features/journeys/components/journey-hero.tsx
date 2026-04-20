import Image from "next/image"

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
      <div className="relative mx-4 aspect-4/3 overflow-hidden rounded-[2rem] bg-accent">
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 768px"
          className="size-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-4 px-5 pt-6">
        <h1 className="text-3xl leading-tight font-semibold text-foreground">
          {title}
        </h1>
        <p className="text-base leading-7 text-muted-foreground opacity-80">
          {description}
        </p>
      </div>
    </>
  )
}
