import { notFound } from 'next/navigation';
import { getSandboxPage, type SandboxPage } from '@/lib/sandbox-store';
import { SandboxRenderer } from '@/components/SandboxTemplates';
import { LandingRenderer } from '@/components/LandingTemplates';

// Какому демо принадлежит какой вид страницы: заметка открывается только по
// /demo/quick-notes/<id>, визитка только по /demo/business-card/<id>.
const SLUG_BY_KIND: Record<SandboxPage['kind'], string> = {
  note: 'quick-notes',
  landing: 'business-card',
};

export default async function DemoResultPage(props: PageProps<'/demo/[slug]/[id]'>) {
  const { slug, id } = await props.params;
  const page = getSandboxPage(id);

  if (!page || SLUG_BY_KIND[page.kind] !== slug) {
    notFound();
  }

  if (page.kind === 'landing') {
    return <LandingRenderer data={page} />;
  }

  return (
    <main className="min-h-screen bg-slate-50 py-16">
      <SandboxRenderer template={page.template} title={page.title} body={page.body} />
    </main>
  );
}
