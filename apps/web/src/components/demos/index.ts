import type { ComponentType } from 'react';
import { QuickNotesDemo } from '@/components/demos/QuickNotesDemo';

// Тело каждого демо по его slug (slug задаётся в lib/content.ts, demos).
// Новое демо: компонент в этой папке, запись в demos и строка здесь.
export const demoBodies: Record<string, ComponentType> = {
  'quick-notes': QuickNotesDemo,
};
