import { getPageImage, getPageMarkdownUrl, source } from "@/lib/source"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page"
import { notFound } from "next/navigation"
import { getMDXComponents } from "@/components/mdx"
import type { Metadata } from "next"
import type { ComponentProps } from "react"
import { gitConfig } from "@/lib/shared"

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()
  const currentPage = page

  const { body: MDX, toc } = await currentPage.data.load()
  const markdownUrl = getPageMarkdownUrl(currentPage).url
  function RelativeLink({ href, ...props }: ComponentProps<"a">) {
    return (
      <a
        href={href ? source.resolveHref(href, currentPage) : href}
        {...props}
      />
    )
  }

  return (
    <DocsPage toc={toc} full={currentPage.data.full}>
      <DocsTitle>{currentPage.data.title}</DocsTitle>
      <DocsDescription className="mb-0">
        {currentPage.data.description}
      </DocsDescription>
      <div className="flex flex-row items-center gap-2 border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${currentPage.path}`}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: RelativeLink,
          })}
        />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(
  props: PageProps<"/docs/[[...slug]]">
): Promise<Metadata> {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  }
}
