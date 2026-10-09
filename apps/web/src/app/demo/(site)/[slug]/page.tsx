import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { demos, findDemo } from '@/lib/content';
import { QuickNotesForm } from '@/components/QuickNotesForm';

export function generateStaticParams() {
  return demos.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata(props: PageProps<'/demo/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const item = findDemo(slug);
  if (!item) return {};
  return { title: `${item.title} — PalmiraLab`, description: item.description };
}

export default async function DemoPage(props: PageProps<'/demo/[slug]'>) {
  const { slug } = await props.params;
  const item = findDemo(slug);

  if (!item) {
    notFound();
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <Link href="/demo" className="text-sm text-slate-600 hover:underline dark:text-slate-400">
          ← Все демо
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Быстрая заметка в вашем дизайне за минуту
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Напишите заголовок и пару строк, выберите оформление, и получите готовую страницу со
          своей ссылкой. Её можно сразу отправить кому угодно: в мессенджер, в письмо или в чат.
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Что здесь происходит
        </h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-slate-600 dark:text-slate-400">
          <li>Вы вводите заголовок и текст и выбираете оформление: заметка, объявление или факт.</li>
          <li>Сервер собирает из них отдельную страницу по выбранному шаблону.</li>
          <li>Вы получаете ссылку. Страница открывается у любого, у кого есть эта ссылка.</li>
          <li>Через 5 минут страница удаляется: мы ничего не храним насовсем.</li>
        </ol>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Это демонстрация. Пожалуйста, не вводите персональные данные и ничего конфиденциального:
          ссылку может открыть любой, у кого она есть.
        </p>
      </section>

      <QuickNotesForm />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Зачем это вашему делу
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Это уменьшенная версия того, что мы делаем для клиентов: быстрые заметки, объявления и
          новости в вашем фирменном дизайне, которыми можно мгновенно делиться в интернете.
          Написали текст, получили красивую страницу и ссылку. Без ожидания разработчика и без
          ручной вёрстки.
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          В работе дизайн, типы страниц и срок жизни ссылки подбираются под вас, по согласованию:
          от разовых заметок до постоянных страниц.
        </p>
      </section>
    </>
  );
}
