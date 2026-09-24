import { ProposalChat } from '@/components/ProposalChat';
import { Services } from '@/components/Services';
import { Cases } from '@/components/Cases';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-16 px-4 py-10 sm:py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl">
          Palmira<span className="text-emerald-600 dark:text-emerald-400">Lab</span>
        </h1>
        <ThemeToggle />
      </div>
      <ProposalChat />
      <Services />
      <Cases />
    </main>
  );
}
