import type { Metadata } from 'next';
import './globals.css';
import './functional.css';

export const metadata: Metadata = {
  title: 'Finanças',
  description: 'Seu centro de comando financeiro',
  applicationName: 'Finanças',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      {/* Extensions may add attributes to body before React loads. Keep this exception local to body. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
