import type { ReactNode } from 'react';
import type { Proposal } from '@/lib/ai-provider/provider';
import { ContactForm } from '@/components/ContactForm';

// GigaChat иногда сам добавляет "- " в начало пунктов массива — при рендере
// в <li> это задвоило бы буллет ("• - текст"), убираем.
function stripBullet(text: string): string {
  return text.replace(/^[-•]\s*/, '');
}

type ProposalCardProps = {
  proposal: Proposal;
  contactName: string;
  contactValue: string;
  contactStatus: 'idle' | 'sending' | 'sent' | 'error';
  onContactNameChange: (value: string) => void;
  onContactValueChange: (value: string) => void;
  onContactSubmit: () => void;
  restartControl?: ReactNode;
};

export function ProposalCard({
  proposal,
  contactName,
  contactValue,
  contactStatus,
  onContactNameChange,
  onContactValueChange,
  onContactSubmit,
  restartControl,
}: ProposalCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{proposal.title}</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">{proposal.problemSummary}</p>
      </div>

      <div>
        <h3 className="font-medium text-slate-900 dark:text-slate-100">Состав работ</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
          {proposal.scope.map((item, i) => (
            <li key={i}>{stripBullet(item)}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-medium text-slate-900 dark:text-slate-100">Допущения</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
          {proposal.assumptions.map((item, i) => (
            <li key={i}>{stripBullet(item)}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-medium text-slate-900 dark:text-slate-100">Что не входит</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-300">
          {proposal.exclusions.map((item, i) => (
            <li key={i}>{stripBullet(item)}</li>
          ))}
        </ul>
      </div>

      <p className="text-slate-800 dark:text-slate-200">
        <strong>Стоимость:</strong>{' '}
        {proposal.priceRangeMin != null && proposal.priceRangeMax != null
          ? `${proposal.priceRangeMin}–${proposal.priceRangeMax} ₽`
          : 'обсудим после уточнения деталей'}
      </p>
      <p className="text-slate-800 dark:text-slate-200">
        <strong>Сроки:</strong>{' '}
        {proposal.estimatedTimelineText ?? 'обсудим после уточнения деталей'}
      </p>

      <p className="text-slate-800 dark:text-slate-200">
        <strong>Следующий шаг:</strong> {proposal.nextStep}
      </p>

      <p className="text-sm text-slate-500">
        <small>{proposal.disclaimer}</small>
      </p>

      <ContactForm
        contactName={contactName}
        contactValue={contactValue}
        contactStatus={contactStatus}
        onContactNameChange={onContactNameChange}
        onContactValueChange={onContactValueChange}
        onContactSubmit={onContactSubmit}
        successText="Спасибо! Мы свяжемся с вами, чтобы уточнить детали."
        restartControl={restartControl}
      />
    </div>
  );
}
