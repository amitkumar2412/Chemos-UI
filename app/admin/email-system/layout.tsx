import EmailSystemTabs from './_components/EmailSystemTabs';
import MailboxPill from './_components/MailboxPill';
import { MailboxProvider } from './_lib/mailbox';

export default function EmailSystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <MailboxProvider>
      <div style={{ padding: '32px', maxWidth: '1200px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '8px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '6px' }}>Email System</h1>
            <p style={{ color: 'var(--gray)', fontSize: '14px' }}>
              Run targeted chemical offer campaigns — pick a chemical and price, choose customers and templates, and send.
            </p>
          </div>
          <MailboxPill />
        </div>
        <EmailSystemTabs />
        {children}
      </div>
    </MailboxProvider>
  );
}
