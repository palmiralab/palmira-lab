import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function ServicesLayout({ children }: LayoutProps<'/services'>) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-16 px-4 py-10 sm:py-16">
      <Header />
      <main className="flex flex-col gap-12">{children}</main>
      <Footer />
    </div>
  );
}
