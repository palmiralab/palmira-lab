import { ProposalChat } from '@/components/ProposalChat';
import { Services } from '@/components/Services';
import { Cases } from '@/components/Cases';

export default function Home() {
  return (
    <main>
      <h1>Palmira Lab</h1>
      <ProposalChat />
      <Services />
      <Cases />
    </main>
  );
}
