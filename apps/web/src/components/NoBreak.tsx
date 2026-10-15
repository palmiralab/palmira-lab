import { Fragment } from 'react';

// «ИИ-аудит» не переносится по дефису («ИИ-» на одной строке, «аудит» на другой):
// на узком экране это читается как два разных слова.
const PATTERN = /(ИИ-аудит\p{L}*)/u;

export function NoBreak({ children }: { children: string }) {
  return (
    <>
      {children.split(PATTERN).map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="whitespace-nowrap">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
