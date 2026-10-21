import Link from 'next/link';
import { LeadPreviewForm } from '@/components/LeadPreviewForm';
import { primaryButtonClass } from '@/lib/ui-classes';

// Тело демо «Как придёт заявка»: объяснение, форма с окном Telegram и пояснение,
// чем это полезно бизнесу. Заголовок и вводный абзац берутся из данных (lib/content.ts).
export function LeadPreviewDemo() {
  return (
    <>
      <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Как будет выглядеть заявка
        </h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-slate-600 dark:text-slate-400">
          <li>Вы вводите данные вымышленного «клиента» и выбираете услугу.</li>
          <li>
            Мы показываем сообщение в том же формате, в каком оно приходит владельцу бизнеса в
            настоящем уведомлении.
          </li>
          <li>Ничего не отправляется и не сохраняется: это макет.</li>
        </ol>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          В настоящей системе заявка из формы на сайте сохраняется в базе, а уведомление уходит
          в Telegram сразу. Сбой отправки уведомления не теряет заявку.
        </p>
      </section>

      <LeadPreviewForm />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Чем это полезно бизнесу
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Заявка приходит сразу, в мессенджер, которым вы и так пользуетесь, и не теряется в
          почте или формах: вы реагируете, пока клиент ещё не ушёл к другим.
        </p>
        <p className="text-slate-600 dark:text-slate-400">
          В вашем проекте форма, текст сообщения, канал (Telegram или другой) и адресат (вы или
          менеджер) подбираются под ваш процесс.
        </p>
        <Link
          href="/services/telegram-bot"
          className={`${primaryButtonClass} mt-2 self-start text-center`}
        >
          Настроить приём заявок
        </Link>
      </section>
    </>
  );
}
