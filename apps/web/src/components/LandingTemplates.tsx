import Link from 'next/link';
import type { LandingDesign, LandingPageData } from '@/lib/sandbox-store';

// Визитка из демо «Визитка по описанию». Две версии с одной структурой
// (название, описание, контакты) и разным оформлением. Контакты выводятся
// обычным текстом, не ссылками: данные вымышленные, а ссылки из пользовательского
// ввода лишний риск.
type LandingProps = { data: LandingPageData };

function contacts(data: LandingPageData): { label: string; value: string }[] {
  return [
    { label: 'Телефон', value: data.phone },
    { label: 'Почта', value: data.email },
    { label: 'Адрес', value: data.address },
  ].filter((item) => item.value);
}

function LightLanding({ data }: LandingProps) {
  const items = contacts(data);
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight">{data.name}</h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">{data.description}</p>
        {items.length > 0 && (
          <dl className="mt-10 space-y-3 border-t border-slate-200 pt-6">
            {items.map((item) => (
              <div key={item.label} className="flex gap-4">
                <dt className="w-24 shrink-0 text-sm text-slate-500">{item.label}</dt>
                <dd className="text-slate-800">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <DemoFooter className="mt-16 text-slate-400" linkClassName="text-emerald-700" />
      </div>
    </main>
  );
}

function BoldLanding({ data }: LandingProps) {
  const items = contacts(data);
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="h-1 w-16 rounded bg-gradient-to-r from-emerald-400 to-cyan-400" />
        <h1 className="mt-6 text-5xl font-extrabold leading-tight tracking-tight">{data.name}</h1>
        <p className="mt-5 text-xl leading-relaxed text-slate-300">{data.description}</p>
        {items.length > 0 && (
          <dl className="mt-10 grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <dt className="text-xs uppercase tracking-widest text-emerald-400">{item.label}</dt>
                <dd className="mt-1 text-slate-100">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <DemoFooter className="mt-16 text-slate-500" linkClassName="text-emerald-400" />
      </div>
    </main>
  );
}

function DemoFooter({ className, linkClassName }: { className: string; linkClassName: string }) {
  return (
    <p className={`text-sm ${className}`}>
      Демонстрационная страница PalmiraLab, исчезнет через 5 минут.{' '}
      <Link href="/demo/business-card" className={`underline ${linkClassName}`}>
        Собрать свою
      </Link>
    </p>
  );
}

const designs: Record<LandingDesign, (props: LandingProps) => React.ReactElement> = {
  light: LightLanding,
  bold: BoldLanding,
};

export function LandingRenderer({ data }: LandingProps) {
  const Component = designs[data.design];
  return <Component data={data} />;
}
