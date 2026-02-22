import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "КлинДиагноз — Диагностика по протоколам РК",
  description:
    "Система поддержки клинических решений на основе официальных протоколов МЗ РК",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><text y='28' font-size='28'>🏥</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
