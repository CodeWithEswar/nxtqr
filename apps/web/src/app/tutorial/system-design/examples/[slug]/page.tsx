import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@nxtqr/ui";
import { CheckCircleIcon, ChevronRightIcon, ShieldIcon } from "@nxtqr/icons";
import {
  ArchitectureDiagramView,
  getAllExamples,
  getExampleBySlug,
  OpenInVisualizerButton,
  tutorialRegistry,
  TutorialShell,
} from "@/features/system-design-tutorials";
import { TutorialComponentIcon } from "@/features/system-design-tutorials/components/tutorial-component-icon";

interface ExamplePageProps {
  params: Promise<{ slug: string }>;
}

const sectionTitle = "text-lg font-semibold tracking-tight sm:text-xl";
const fieldLabel = "font-mono text-[11px] font-medium text-text-muted";

export async function generateStaticParams() {
  return getAllExamples().map(({ slug }) => ({ slug }));
}

export default async function ExampleDetailPage({ params }: ExamplePageProps) {
  const { slug } = await params;
  const example = getExampleBySlug(slug);
  if (!example) notFound();

  const tocItems = [
    { id: "diagram", label: "Architecture canvas" },
    ...(example.flowSteps.length ? [{ id: "request-flow", label: "Trace a request" }] : []),
    { id: "requirements", label: "System requirements" },
    { id: "decisions", label: "Engineering decisions" },
    { id: "tradeoffs", label: "Architectural trade-offs" },
    { id: "components", label: "Infrastructure components" },
  ];

  const scale = [
    { label: "Throughput", value: example.scale.requestsPerSec },
    { label: "Storage growth", value: example.scale.storagePerDay },
    { label: "Target latency", value: example.scale.latencyTarget },
    { label: "Availability SLA", value: example.scale.availabilityTarget },
  ].filter(({ value }) => value);

  const requirements = [
    { title: "Functional", items: example.requirements.functional, Icon: CheckCircleIcon },
    { title: "Non-functional", items: example.requirements.nonFunctional, Icon: ShieldIcon },
  ];

  return (
    <TutorialShell
      breadcrumbs={[
        { label: "Tutorial", href: "/tutorial/system-design" },
        { label: "Architectures", href: "/tutorial/system-design/examples" },
        { label: example.title.split(" (")[0] },
      ]}
      tocItems={tocItems}
    >
      <article className="min-w-0 space-y-8 pb-8 [container-type:inline-size] sm:space-y-10 sm:pb-12">
        <header className="space-y-5 border-b border-border-default pb-5 sm:pb-6">
          <div className="grid min-w-0 items-end gap-4 [@container(min-width:42rem)]:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <span className={fieldLabel}>{example.category}</span>
                <Badge variant="secondary" className="font-mono">
                  {example.difficulty}
                </Badge>
              </div>
              <h1 className="text-balance break-words text-2xl font-semibold tracking-tight [@container(min-width:32rem)]:text-3xl">
                {example.title}
              </h1>
              <p className="max-w-prose break-words text-sm leading-relaxed text-text-secondary">
                {example.subtitle}
              </p>
            </div>
            <OpenInVisualizerButton
              document={example.graphDocument}
              templateSlug={example.slug}
              size="sm"
            />
          </div>

          {scale.length > 0 && (
            <Card className="min-w-0 border-border-default bg-surface-01">
              <dl className="grid gap-x-4 gap-y-3 px-3 py-2.5 [@container(min-width:16rem)]:grid-cols-2 [@container(min-width:36rem)]:grid-cols-4 sm:px-4">
                {scale.map(({ label, value }) => (
                  <div key={label} className="min-w-0">
                    <dt className={fieldLabel}>{label}</dt>
                    <dd className="mt-0.5 break-words font-mono text-xs font-medium text-foreground">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          )}
        </header>

        <section id="diagram" aria-labelledby="diagram-title" className="scroll-mt-4 space-y-3">
          <div className="space-y-1">
            <h2 id="diagram-title" className={sectionTitle}>
              Architecture canvas
            </h2>
            <p className="text-sm leading-relaxed text-text-muted">
              Pan and zoom to inspect the diagram, or select a request step to trace its path.
            </p>
          </div>
          <ArchitectureDiagramView example={example} />
        </section>

        <section id="requirements" className="scroll-mt-4 space-y-3">
          <h2 className={sectionTitle}>System design requirements</h2>
          <div className="grid gap-3 [@container(min-width:36rem)]:grid-cols-2">
            {requirements.map(({ title, items, Icon }) => (
              <Card key={title} className="min-w-0 border-border-default bg-surface-01">
                <CardHeader className="p-3 sm:p-4">
                  <CardTitle className="flex items-center gap-2 leading-snug">
                    <Icon size={16} className="shrink-0 text-text-muted" />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
                  <ul className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-text-secondary marker:text-text-muted">
                    {items.map((requirement, index) => (
                      <li key={index} className="break-words">
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="decisions" className="scroll-mt-4 space-y-3">
          <h2 className={sectionTitle}>Key engineering decisions</h2>
          {example.keyDecisions.map((decision, index) => (
            <Card key={index} className="min-w-0 border-border-default bg-surface-01">
              <CardHeader className="space-y-2 p-3 sm:p-4">
                <CardTitle className="break-words font-semibold leading-snug">
                  {decision.topic}
                </CardTitle>
                <dl className="space-y-1">
                  <dt className={fieldLabel}>Chosen design</dt>
                  <dd className="break-words text-sm font-medium leading-snug text-foreground">
                    {decision.decision}
                  </dd>
                </dl>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
                <dl className="grid gap-2 [@container(min-width:36rem)]:grid-cols-2">
                  <div className="min-w-0 space-y-1 rounded-md border border-border-subtle bg-surface-02 p-2.5">
                    <dt className={fieldLabel}>Why it was chosen</dt>
                    <dd className="break-words text-sm leading-relaxed text-text-secondary">
                      {decision.why}
                    </dd>
                  </div>
                  <div className="min-w-0 space-y-1 rounded-md border border-border-subtle bg-surface-02 p-2.5">
                    <dt className={fieldLabel}>Rejected alternative</dt>
                    <dd className="break-words text-sm leading-relaxed text-text-secondary">
                      {decision.alternativeRejected}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </section>

        <section id="tradeoffs" className="scroll-mt-4 space-y-3">
          <h2 className={sectionTitle}>Architectural trade-offs</h2>
          <Card className="border-border-default bg-surface-01">
            <CardContent className="p-3 sm:p-4">
              <ul className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-text-secondary marker:text-text-muted">
                {example.tradeoffs.map((item, index) => (
                  <li key={index} className="break-words">
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section id="components" className="scroll-mt-4 space-y-3">
          <h2 className={sectionTitle}>Featured infrastructure components</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-2">
            {example.featuredComponentIds.map((id) => {
              const component = tutorialRegistry.getComponentTutorial(id);
              if (!component) return null;

              return (
                <Button
                  key={component.id}
                  asChild
                  variant="outline"
                  className="group h-auto min-h-12 min-w-0 justify-start gap-2.5 whitespace-normal p-2 text-left"
                >
                  <Link href={`/tutorial/system-design/components/${component.id}`}>
                    <span className="grid size-8 shrink-0 place-items-center rounded-md border border-border-subtle bg-surface-02">
                      <TutorialComponentIcon slug={component.iconSlug} size={20} />
                    </span>
                    <span className="min-w-0 flex-1 space-y-0.5 break-words">
                      <span className="block font-semibold">{component.name}</span>
                      <span className="block text-[11px] font-normal text-text-muted">
                        {component.categoryName}
                      </span>
                    </span>
                    <ChevronRightIcon
                      size={14}
                      className="shrink-0 text-text-muted group-hover:text-foreground"
                    />
                  </Link>
                </Button>
              );
            })}
          </div>
        </section>
      </article>
    </TutorialShell>
  );
}
