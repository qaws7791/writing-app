"use client"

import { useState } from "react"
import Image from "next/image"

export function ProfileAvatar({
  image,
  name,
}: {
  readonly image: string | null
  readonly name: string
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null)
  const showImage = image !== null && failedImage !== image

  return (
    <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-4xl bg-background/80 text-4xl text-foreground sm:size-32">
      {showImage ? (
        <Image
          alt={`${name} 프로필`}
          className="size-full object-cover"
          height={128}
          onError={() => setFailedImage(image)}
          src={image}
          unoptimized
          width={128}
        />
      ) : (
        <span aria-label={`${name} 기본 프로필`} role="img">
          ✍️
        </span>
      )}
    </div>
  )
}
