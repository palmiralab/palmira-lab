import { describe, expect, it } from 'vitest';
import {
  VOICE_GUIDANCE,
  buildProposalSystemPrompt,
  buildTextJsonProposalSystemPrompt,
} from './prompts';

describe('голос ассистента', () => {
  it('оба промпта содержат правило единого рода', () => {
    expect(buildProposalSystemPrompt(0)).toContain(VOICE_GUIDANCE);
    expect(buildTextJsonProposalSystemPrompt(0)).toContain(VOICE_GUIDANCE);
  });

  it('правило требует мужской род и запрещает переход на женский', () => {
    expect(VOICE_GUIDANCE).toContain('в мужском роде');
    expect(VOICE_GUIDANCE).toContain('никогда не переходи на женский род');
  });

  it('промпты не называют ассистента в женском роде', () => {
    for (const prompt of [buildProposalSystemPrompt(2), buildTextJsonProposalSystemPrompt(2)]) {
      expect(prompt).not.toMatch(/\bты (уже )?(задала|поняла|подготовила)\b/);
    }
  });
});

describe('ручной разбор (manual_review)', () => {
  const prompts = (questionsAsked: number) => [
    buildProposalSystemPrompt(questionsAsked),
    buildTextJsonProposalSystemPrompt(questionsAsked),
  ];

  it('после лимита вопросов КП не выдаётся «в любом случае»', () => {
    for (const prompt of prompts(3)) {
      expect(prompt).not.toContain('в любом случае');
    }
  });

  it('несодержательный диалог после лимита ведёт в manual_review', () => {
    for (const prompt of prompts(3)) {
      expect(prompt).toContain('так и не стало понятно');
      expect(prompt).toContain('Не придумывай задачу за клиента');
    }
  });

  it('задачи вне компетенции относятся к out_of_scope, а не к manual_review', () => {
    for (const prompt of prompts(0)) {
      expect(prompt).toMatch(/- out_of_scope — [^-]*смарт-контракты/);
      expect(prompt).not.toMatch(/- manual_review — [^-]*смарт-контракты/);
    }
  });
});
