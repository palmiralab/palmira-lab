// Простой знак-колба для логотипа. Рисуем вручную, чтобы не тащить иконочную
// библиотеку ради одной иконки; цвет берётся из currentColor (text-* в родителе).
export function LabIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M9 3h6" />
      <path d="M10 3v6.5L5 19a1.5 1.5 0 0 0 1.3 2h11.4A1.5 1.5 0 0 0 19 19l-5-9.5V3" />
      <path d="M8 15h8" />
    </svg>
  );
}
