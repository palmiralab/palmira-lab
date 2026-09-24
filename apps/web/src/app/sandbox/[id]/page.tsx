import { notFound } from 'next/navigation';
import { getSandboxPage } from '@/lib/sandbox-store';
import { SandboxRenderer } from '@/components/SandboxTemplates';

export default async function SandboxPage(props: PageProps<'/sandbox/[id]'>) {
  const { id } = await props.params;
  const page = getSandboxPage(id);

  if (!page) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 py-16">
      <SandboxRenderer template={page.template} title={page.title} body={page.body} />
    </main>
  );
}
