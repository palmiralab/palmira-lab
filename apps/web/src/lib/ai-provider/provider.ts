export type ServiceType =
  | 'telegram_automation'
  | 'website_landing'
  | 'content_automation'
  | 'ai_consultation'
  | 'manual_review';

export type ProposalPackage = 'start' | 'optimal' | 'extended';

export type Proposal = {
  id: string;
  serviceType: ServiceType;
  packageType?: ProposalPackage;
  title: string;
  problemSummary: string;
  scope: string[];
  assumptions: string[];
  exclusions: string[];
  nextStep: string;
  estimatedTimelineText?: string;
  priceRangeMin?: number;
  priceRangeMax?: number;
  disclaimer: string;
  status: 'draft' | 'shown' | 'contact_collected' | 'sent' | 'accepted' | 'rejected';
};

export interface ProposalGenerationProvider {
  classifyAndDraft(input: {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    answers: Record<string, string>;
  }): Promise<Partial<Proposal>>;
}
