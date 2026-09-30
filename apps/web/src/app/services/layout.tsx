import { SiteShell } from '@/components/SiteShell';

export default function ServicesLayout({ children }: LayoutProps<'/services'>) {
  return <SiteShell>{children}</SiteShell>;
}
