import { SiteShell } from '@/components/SiteShell';

// Папка (site) — route group: в URL её нет (адрес остаётся /sandbox), но layout
// действует только на форму, а не на соседнюю /sandbox/[id].
export default function SandboxFormLayout({ children }: LayoutProps<'/sandbox'>) {
  return <SiteShell>{children}</SiteShell>;
}
