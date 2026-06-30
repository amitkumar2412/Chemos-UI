import type { Metadata } from 'next';
import './globals.css';
import '../app/dashboard/dashboard.css';
import AppShell from '@/components/AppShell';
import { ReduxProvider } from '@/components/ReduxProvider';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'ChemOS',
  description: 'Record and track chemical sales, purchases, and business intelligence in real time.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of unstyled theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('chemos_theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ReduxProvider>
          <AppShell>{children}</AppShell>
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </ReduxProvider>
      </body>
    </html>
  );
}
