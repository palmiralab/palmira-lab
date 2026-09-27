import { useState } from 'react';

type RestartControlProps = {
  confirming: boolean;
  onRequest: () => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function RestartControl({ confirming, onRequest, onConfirm, onCancel }: RestartControlProps) {
  // confirming уходит в false раньше, чем успевает доиграть анимация
  // исчезновения — держим блок подтверждения в DOM до конца fade-out-up,
  // снимаем по onAnimationEnd (не по таймеру — не дублировать длительность
  // анимации отдельным магическим числом в JS).
  const [showConfirm, setShowConfirm] = useState(confirming);

  // Подстройка state под изменившийся проп — по рецепту React-доков
  // (react.dev/learn/you-might-not-need-an-effect, "Adjusting state when
  // a prop changes"): сравнение с предыдущим значением прямо в теле
  // рендера, без useEffect. setState здесь вызывается синхронно во время
  // рендера — React тут же перерендерит компонент с новым state ещё до
  // коммита в DOM, лишнего кадра/эффекта после коммита не будет.
  const [prevConfirming, setPrevConfirming] = useState(confirming);
  if (confirming !== prevConfirming) {
    setPrevConfirming(confirming);
    if (confirming) setShowConfirm(true);
  }

  if (!showConfirm) {
    return (
      <button
        onClick={onRequest}
        className="cursor-pointer text-sm text-slate-500 hover:underline dark:text-slate-400"
      >
        Начать заново
      </button>
    );
  }

  return (
    <div
      onAnimationEnd={() => {
        if (!confirming) setShowConfirm(false);
      }}
      className={
        'flex items-center gap-2 text-sm ' +
        (confirming ? 'animate-[fade-in-up_0.2s_ease-out]' : 'animate-[fade-out-up_0.2s_ease-in]')
      }
    >
      <span className="text-slate-600 dark:text-slate-400">Начать заново? Прогресс потеряется.</span>
      <button
        onClick={onConfirm}
        className="cursor-pointer font-medium text-red-600 hover:underline dark:text-red-400"
      >
        Да, заново
      </button>
      <button onClick={onCancel} className="cursor-pointer text-slate-500 hover:underline dark:text-slate-400">
        Отмена
      </button>
    </div>
  );
}
