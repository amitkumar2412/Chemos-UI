import { EmailSystemProvider } from './_lib/store';

export default function EmailSystemLayout({ children }: { children: React.ReactNode }) {
  return <EmailSystemProvider>{children}</EmailSystemProvider>;
}
