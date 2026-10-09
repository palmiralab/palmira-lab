import type { ReactElement } from 'react';
import type { SandboxTemplate } from '@/lib/sandbox-store';

type TemplateProps = {
  title: string;
  body: string;
};

function paragraphs(body: string): string[] {
  return body.split('\n').map((line) => line.trim()).filter(Boolean);
}

// «Заметка»: жёлтый стикер на «липучке», чуть наклонён, шрифт с засечками,
// текст слева, как написанный от руки.
function NoteTemplate({ title, body }: TemplateProps) {
  return (
    <article className="relative mx-auto max-w-xl -rotate-1 rounded-sm border border-amber-200 bg-amber-100 p-8 pt-10 shadow-lg">
      <span
        aria-hidden="true"
        className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-2 bg-amber-300/70"
      />
      <h1 className="font-serif text-2xl font-semibold text-amber-950">{title}</h1>
      <div className="mt-4 space-y-3 font-serif text-lg leading-relaxed text-amber-900">
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

// «Факт»: яркая карточка с градиентом, крупная цифра или фраза по центру,
// заголовок маленькой меткой сверху.
function FactTemplate({ title, body }: TemplateProps) {
  const [fact, ...rest] = paragraphs(body);
  return (
    <article className="mx-auto max-w-xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-10 text-center text-white shadow-xl">
      <p className="mx-auto w-fit rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-100">
        {title}
      </p>
      {fact && <p className="mt-6 text-5xl font-extrabold leading-tight sm:text-6xl">{fact}</p>}
      <div className="mt-6 space-y-2 text-lg text-indigo-100">
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
