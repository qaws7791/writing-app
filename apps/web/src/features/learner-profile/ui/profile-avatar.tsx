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
    <div className="mb-6 flex size-32 items-center justify-center overflow-hidden rounded-[3rem] bg-action-selected-bg text-display-lg text-action-selected-fg">
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
