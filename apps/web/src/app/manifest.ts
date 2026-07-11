import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#fdfbf7",
    description: "매일 한 조각씩 쌓는 글쓰기 학습 플랫폼",
    display: "standalone",
    lang: "ko",
    name: "글결",
    short_name: "글결",
    start_url: "/",
    theme_color: "#fdfbf7",
  }
}
