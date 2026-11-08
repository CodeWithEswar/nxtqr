import { notFound } from "next/navigation";
import Link from "next/link";
import { type Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import {
  Badge,
  Button,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@nxtqr/ui";
import { ChevronLeftIcon, ChevronRightIcon } from "@nxtqr/icons";
import { DocsShell } from "@/features/documentation/components/docs-shell";
import { mdxComponents } from "@/features/documentation/mdx/components";
import { getDocBySlug } from "@/features/documentation/mdx/loader";
import { DOCS_REGISTRY, getAdjacentDocs } from "@/features/documentation/registry/docs-registry";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateStaticParams() {
  return DOCS_REGISTRY.map((entry) => ({
    slug: entry.slug.split("/"),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolved = await params;
  const doc = await getDocBySlug(resolved.slug);
  if (!doc) return {};

  return {
    title: `${doc.meta.title} · NXTQR Design System`,
    description: doc.meta.description,
  };
}

export default async function DocPage({ params }: PageProps) {
  const resolved = await params;
  const doc = await getDocBySlug(resolved.slug);

  if (!doc) {
    notFound();
  }

  const { prev, next } = getAdjacentDocs(doc.entry.slug);

  // Custom props-table wrapper to inject current entry's props
  const pageComponents = {
    ...mdxComponents,
    PropsTable: () => <mdxComponents.PropsTable props={doc.entry.props} />,
  };

  return (
    <DocsShell headings={doc.headings}>
      <article className="space-y-8">
        {/* Semantic Breadcrumb Hierarchy */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="font-mono text-muted-foreground uppercase tracking-wider text-[11px]">
                {doc.entry.category}
              </span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{doc.meta.title}</BreadcrumbPage>
            </BreadcrumbItem>
            {doc.entry.status === "draft" && (
              <Badge
                variant="outline"
                className="ml-2 font-mono text-[9px] py-0 text-yellow-400 border-yellow-500/30"
              >
                Draft / In Progress
              </Badge>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <header className="space-y-3 border-b border-border pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">
            {doc.meta.title}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{doc.meta.description}</p>
        </header>

        {/* MDX Remote Content */}
        <div className="prose-container space-y-6">
          <MDXRemote
            source={doc.content}
            components={pageComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              },
            }}
          />
        </div>

        {/* Pagination: Prev / Next Nav */}
        <nav className="flex items-center justify-between border-t border-border pt-8 mt-12">
          {prev ? (
            <Link href={`/docs/${prev.slug}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-2 h-9 px-3">
                <ChevronLeftIcon className="h-4 w-4" />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] text-muted-foreground font-mono">Previous</span>
                  <span className="text-xs font-semibold text-foreground">{prev.title}</span>
                </div>
              </Button>
            </Link>
          ) : (
            <div />
          )}

          {next ? (
            <Link href={`/docs/${next.slug}`}>
              <Button variant="outline" size="sm" className="flex items-center gap-2 h-9 px-3">
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-muted-foreground font-mono">Next</span>
                  <span className="text-xs font-semibold text-foreground">{next.title}</span>
                </div>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      </article>
    </DocsShell>
  );
}
