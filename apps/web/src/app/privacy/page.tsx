import Link from 'next/link';
import type { Metadata } from 'next';
import { EmailButton } from '@/components/EmailButton';

export const metadata: Metadata = {
  title: 'Политика обработки персональных данных — PalmiraLab',
  description: 'Какие данные мы собираем через формы и чат, зачем, как долго храним и как их удалить.',
};

const linkClass = 'text-emerald-700 underline dark:text-emerald-400';
const textClass = 'text-slate-700 dark:text-slate-300';
const listClass = 'list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300';
const headingClass = 'text-xl font-semibold text-slate-900 dark:text-slate-100';

export default function PrivacyPage() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <Link href="/" className="text-sm text-slate-600 hover:underline dark:text-slate-400">
          ← На главную
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Политика обработки персональных данных
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Здесь коротко и по делу: какие данные мы получаем через сайт, зачем, как долго храним и
          как их удалить. Редакция: октябрь 2026.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className={headingClass}>Кто обрабатывает данные</h2>
        <p className={textClass}>
          Оператор данных: студия Palmira Lab. Связаться с нами по вопросам данных можно в{' '}
          <a href="https://t.me/jromkin" target="_blank" rel="noopener noreferrer" className={linkClass}>
            Telegram
          </a>{' '}
          или по{' '}
          <EmailButton className={'cursor-pointer ' + linkClass}>почте</EmailButton> (по нажатию
          адрес копируется).
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={headingClass}>Какие данные мы получаем</h2>
        <ul className={listClass}>
          <li>Имя и контакт для связи (телефон, email или Telegram), которые вы указываете в форме.</li>
          <li>
            Тексты ваших сообщений в чате: описание задачи и ответы на уточняющие вопросы. Они
            попадают в заявку, чтобы мы видели, что именно вам нужно.
          </li>
          <li>Тип услуги, который определил чат.</li>
          <li>
            Ответы анкеты бесплатного ИИ-аудита, если вы её заполнили: чем занимается ваш бизнес и
            кто ваши клиенты, какой процесс отнимает больше всего времени, сколько времени он
            занимает, в чём делается сейчас, что вы уже пробовали, есть ли у вас технический
            специалист и какой результат аудита вы хотите. Если анкета открыта из чата, к ней
            прикладывается ваше описание задачи из чата.
          </li>
          <li>
            Предложение (КП), которое собрал для вас чат: название, описание задачи, состав работ,
            допущения и ограничения, а также оценку срока и стоимости, если она есть. Оно
            прикладывается к заявке, чтобы мы видели то же, что и вы.
          </li>
          <li>Дату и время обращения.</li>
        </ul>
        <p className={textClass}>
          Мы не просим и не собираем паспортные, платёжные и иные чувствительные данные. Не пишите
          их в чат и в форму.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={headingClass}>Зачем и на каком основании</h2>
        <p className={textClass}>
          Чтобы связаться с вами, подготовить предложение или разбор вашей задачи и вести учёт
          обращений. Основание: ваше согласие, которое вы даёте, отправляя контакт в форме. Данные
          нужны только для этих целей, рекламной рассылки мы не ведём.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={headingClass}>Кому данные доступны</h2>
        <p className={textClass}>Мы не продаём и не передаём данные третьим лицам, кроме сервисов, без которых сайт не работает:</p>
        <ul className={listClass}>
          <li>
            Сервис ИИ GigaChat (ПАО Сбербанк): обрабатывает тексты ваших сообщений в чате, чтобы
            задать уточняющий вопрос или собрать предложение. Имя, контакт и ответы анкеты аудита
            ему не передаются.
          </li>
          <li>
            Telegram: туда приходит уведомление о новой заявке (имя, контакт, текст запроса, краткое
            содержание предложения и ответы анкеты аудита), его видим только мы.
          </li>
          <li>Хостинг-провайдер, на сервере которого работают сайт и база данных.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={headingClass}>Где и как долго храним</h2>
        <p className={textClass}>
          Заявки хранятся в базе данных на нашем сервере. Срок хранения: до 12 месяцев с момента
          обращения, затем данные удаляются. Если вы попросите удалить их раньше, мы это сделаем.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={headingClass}>Демо-страницы</h2>
        <p className={textClass}>
          Текст, который вы вводите в демо «Быстрые заметки» и «Визитка», хранится в оперативной
          памяти сервера 5 минут, чтобы показать вам собранную страницу, и затем удаляется. В базу
          данных он не попадает и третьим лицам не передаётся. Не вводите в демо личные данные.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={headingClass}>Ваши права</h2>
        <p className={textClass}>
          Вы можете узнать, какие данные о вас у нас есть, попросить исправить или удалить их и
          отозвать согласие на обработку. Напишите нам по контактам выше: укажите имя и контакт,
          которые вы оставляли. Мы ответим в срок, установленный законом.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={headingClass}>Файлы cookie и аналитика</h2>
        <p className={textClass}>
          Сайт не использует рекламные cookie и системы аналитики. Выбранная тема оформления
          хранится в вашем браузере (технические данные), нам она не передаётся.
        </p>
      </section>
    </>
  );
}
