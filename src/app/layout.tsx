import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NextAuthProvider } from '@/components/auth/NextAuthProvider';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Gestão Web ERP',
  description: 'Sistema de gestão empresarial completo',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased`}>
        <NextAuthProvider>{children}</NextAuthProvider>
      </body>
    </html>
  );
}