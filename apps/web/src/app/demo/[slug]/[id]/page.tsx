import { notFound } from 'next/navigation';
import { findDemo } from '@/lib/content';
import { getSandboxPage } from '@/lib/sandbox-store';
import { SandboxRenderer } from '@/components/SandboxTemplates';

export default async function SandboxPage(props: PageProps<'/demo/[slug]/[id]'>) {
  const { slug, id } = await props.params;
  const page = findDemo(slug) ? getSandboxPage(id) : undefined;

  if (!page || page.kind !== 'note') {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 py-16">
      <SandboxRenderer template={page.template} title={page.title} body={page.body} />
    </main>
  );
}
