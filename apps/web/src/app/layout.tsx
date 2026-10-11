import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description = "ИИ-агенты, сайты и автоматизация — опишите задачу, получите КП за секунды.";

export const metadata: Metadata = {
  // Адрес нужен, чтобы ссылки на картинку превью (og:image) были абсолютными:
  // мессенджеры не понимают относительные. Пока тестовый домен; главный домен
  // выберем позже (там же каноническая ссылка).
  metadataBase: new URL("https://palmira-lab.online"),
  title: "Palmira Lab",
  description,
  // Превью ссылки в мессенджерах (Telegram и др.); картинка лежит рядом:
  // opengraph-image.png (Next подставит og:image сам).
  openGraph: {
    type: "website",
    siteName: "Palmira Lab",
    locale: "ru_RU",
    title: "Palmira Lab — ИИ-агенты, сайты и автоматизация",
    description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Palmira Lab — ИИ-агенты, сайты и автоматизация",
    description,
  },
};

// Ставит класс .dark до первой отрисовки — иначе страница на долю секунды
// мигнёт светлой темой, прежде чем React применит сохранённый выбор. По
// умолчанию (выбора ещё не было) тема светлая, системная тема не учитывается
// (решение для MVP). Вернуть системную: matchMedia('(prefers-color-scheme: dark)').
const themeInitScript = `
  try {
    var stored = localStorage.getItem('theme');
    var dark = stored === 'dark';
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
