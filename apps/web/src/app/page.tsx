import { ProposalChat } from '@/components/ProposalChat';
import { Services } from '@/components/Services';
import { Cases } from '@/components/Cases';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ScrollToHash } from '@/components/ScrollToHash';

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-16 px-4 py-10 sm:py-16">
      <ScrollToHash />
      <Header isHome />
      <ProposalChat />
      <Services />
      <Cases />
      <Footer />
    </main>
  );
}
