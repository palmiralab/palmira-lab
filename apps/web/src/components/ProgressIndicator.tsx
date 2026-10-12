// «2-4» — гибкий лимит: модель сама решает, сколько вопросов задать в этом
// диапазоне, точное число вперёд не известно.
export function ProgressIndicator({ questionsAsked }: { questionsAsked: number }) {
  if (questionsAsked === 0) return null;

  return (
    <p className="text-sm text-slate-500 dark:text-slate-400">
      Уточнение {questionsAsked} из 3-4
    </p>
  );
}
