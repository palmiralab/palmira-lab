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

// «Светлая»: тёплый светлый фон, заголовок с засечками, мягкие карточки
// контактов с цветными точками.
function LightLanding({ data }: LandingProps) {
  const items = contacts(data);
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-emerald-50 text-slate-900">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-700">Добро пожаловать</p>
        <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight">{data.name}</h1>
        <div className="mt-5 h-1 w-20 rounded bg-emerald-500" />
        <p className="mt-6 text-lg leading-relaxed text-slate-600">{data.description}</p>
        {items.length > 0 && (
          <dl className="mt-10 space-y-3">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm"
              >
                <span aria-hidden="true" className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                <div>
                  <dt className="text-xs uppercase tracking-widest text-slate-500">{item.label}</dt>
                  <dd className="mt-0.5 text-slate-800">{item.value}</dd>
                </div>
              </div>
            ))}
          </dl>
        )}
        <DemoFooter className="mt-16 text-slate-400" linkClassName="text-emerald-700" />
      </div>
    </main>
  );
}

// «Яркая»: цветной градиентный фон, крупный белый заголовок, белая карточка
// с контактами.
function BrightLanding({ data }: LandingProps) {
  const items = contacts(data);
  return (
    <main className="min-h-screen bg-gradient-to-br from-fuchsia-600 via-rose-500 to-orange-400 text-white">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <h1 className="text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl">{data.name}</h1>
        <p className="mt-5 text-xl leading-relaxed text-white/90">{data.description}</p>
        {items.length > 0 && (
          <dl className="mt-10 space-y-4 rounded-3xl bg-white p-6 text-slate-900 shadow-2xl">
            {items.map((item) => (
              <div key={item.label}>
                <dt className="text-xs font-semibold uppercase tracking-widest text-fuchsia-600">{item.label}</dt>
                <dd className="mt-0.5 text-lg">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <DemoFooter className="mt-16 text-white/70" linkClassName="text-white" />
      </div>
    </main>
  );
}

// «Тёмная»: тёмный фон, зелёно-бирюзовая полоска, контакты карточками.
function DarkLanding({ data }: LandingProps) {
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
  bright: BrightLanding,
  dark: DarkLanding,
};

export function LandingRenderer({ data }: LandingProps) {
  const Component = designs[data.design];
  return <Component data={data} />;
}
