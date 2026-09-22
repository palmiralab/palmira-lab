import type { Proposal } from './provider';

const PROPOSAL_DISCLAIMER = `Это ориентировочная оценка, составленная на основе предоставленных вводных данных. Для расчёта точной стоимости и сроков нам потребуется уточнить детали проекта.

Документ носит исключительно ознакомительный характер и не является публичной офертой (ст. 437 ГК РФ). Финальная смета и условия сотрудничества формируются индивидуально и закрепляются в договоре после утверждения технического задания.`;

export function mergeProposal(draft: Partial<Proposal>): Proposal {
  return {
    id: crypto.randomUUID(),
    status: 'draft',
    serviceType: draft.serviceType ?? 'manual_review',
    packageType: draft.packageType,
    title: draft.title ?? '',
    problemSummary: draft.problemSummary ?? '',
    scope: draft.scope ?? [],
    assumptions: draft.assumptions ?? [],
    exclusions: draft.exclusions ?? [],
    nextStep: draft.nextStep ?? '',
    // Намеренно пусто (§6.2) — цену/сроки не показываем до накопления
    // реальных данных по похожим задачам. Не подставлять дефолт вместо
    // этого — пустота тут осмысленная, не пропуск.
    estimatedTimelineText: undefined,
    priceRangeMin: undefined,
    priceRangeMax: undefined,
    // Всегда фиксированный текст из кода — модели не доверяем (§7.2:
    // запрет на обещание цены/сроков/гарантий), даже если бы она сама
    // вернула что-то похожее на disclaimer.
    disclaimer: PROPOSAL_DISCLAIMER,
  };
}
