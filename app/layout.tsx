import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'QueryDeck - Database Connection Manager',
  description:
    'Connect to your MySQL or PostgreSQL databases securely and manage your database connections in one place.',
  keywords: [
    'database',
    'mysql',
    'postgresql',
    'connection manager',
    'query deck',
  ],
  authors: [{ name: 'QueryDeck Team' }],
  creator: 'QueryDeck',
  applicationName: 'QueryDeck',
  generator: 'Next.js',
  metadataBase: new URL('https://querydeck.app'),
  openGraph: {
    title: 'QueryDeck - Database Connection Manager',
    description:
      'Connect to your MySQL or PostgreSQL databases securely and manage your database connections in one place.',
    type: 'website',
    locale: 'en_US',
    siteName: 'QueryDeck',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QueryDeck - Database Connection Manager',
    description:
      'Connect to your MySQL or PostgreSQL databases securely and manage your database connections in one place.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
