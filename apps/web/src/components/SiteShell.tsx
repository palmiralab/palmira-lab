import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ScrollToTop } from '@/components/ScrollToTop';

// Общая рамка внутренних страниц: шапка, основная часть, футер.
// Главная (своя вёрстка) и /sandbox/[id] (страница-результат демо) её не используют.
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-16 px-4 py-10 sm:py-16">
      <Header />
      <main className="flex flex-col gap-12">{children}</main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
