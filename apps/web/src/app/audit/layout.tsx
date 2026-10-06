import { SiteShell } from '@/components/SiteShell';

export default function AuditLayout({ children }: LayoutProps<'/audit'>) {
  return <SiteShell>{children}</SiteShell>;
}
