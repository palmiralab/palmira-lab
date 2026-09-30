'use client';

import { useEffect } from 'react';

// После гидратации страница сбрасывает прокрутку в начало, и переход по якорю
// (например, /#cases с другой страницы) теряется. Повторяем прокрутку к якорю
// уже после этого сброса.
export function ScrollToHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;

    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView();
    }, 100);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
