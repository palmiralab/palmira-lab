import { SiteShell } from '@/components/SiteShell';

// Папка (site) — route group: в URL её нет (адрес остаётся /demo), но layout
// действует только на форму, а не на соседнюю /demo/[id].
export default function SandboxFormLayout({ children }: LayoutProps<'/demo'>) {
  return <SiteShell>{children}</SiteShell>;
}
