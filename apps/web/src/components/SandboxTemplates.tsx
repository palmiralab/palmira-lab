import type { ReactElement } from 'react';
import type { SandboxTemplate } from '@/lib/sandbox-store';

type TemplateProps = {
  title: string;
  body: string;
};

function paragraphs(body: string): string[] {
  return body.split('\n').map((line) => line.trim()).filter(Boolean);
}

function NoteTemplate({ title, body }: TemplateProps) {
  return (
    <article className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <div className="mt-4 space-y-3 text-slate-700">
        {paragraphs(body).map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </article>
  );
}

function AnnouncementTemplate({ title, body }: TemplateProps) {
  return (
    <article className="mx-auto max-w-xl rounded-lg border-2 border-emerald-500 bg-emerald-50 p-10 text-center">
      <h1 className="text-3xl font-bold uppercase tracking-wide text-emerald-900">{title}</h1>
      <div className="mt-4 space-y-3 text-lg text-emerald-800">
        {paragraphs(body).map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </article>
  );
}

function FactTemplate({ title, body }: TemplateProps) {
  const [fact, ...rest] = paragraphs(body);
  return (
    <article className="mx-auto max-w-xl rounded-lg bg-slate-900 p-10 text-center text-white">
      <p className="text-sm uppercase tracking-widest text-slate-400">{title}</p>
      {fact && <p className="mt-4 text-4xl font-bold">{fact}</p>}
      <div className="mt-4 space-y-2 text-slate-300">
        {rest.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    </article>
  );
}

const templateComponents: Record<SandboxTemplate, (props: TemplateProps) => ReactElement> = {
  note: NoteTemplate,
  announcement: AnnouncementTemplate,
  fact: FactTemplate,
};

export function SandboxRenderer({ template, title, body }: TemplateProps & { template: SandboxTemplate }) {
  const Component = templateComponents[template];
  return <Component title={title} body={body} />;
}
