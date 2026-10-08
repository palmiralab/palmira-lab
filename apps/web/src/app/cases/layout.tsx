import { SiteShell } from '@/components/SiteShell';

export default function CasesLayout({ children }: LayoutProps<'/cases'>) {
  return <SiteShell>{children}</SiteShell>;
}
