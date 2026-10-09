// Пункт меню активен на своей странице и на всех вложенных: /cases и /cases/deploy
// подсвечивают «Кейсы». Совпадение по границе сегмента, чтобы /audit не считался
// частью /auditor.
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
