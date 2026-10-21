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
