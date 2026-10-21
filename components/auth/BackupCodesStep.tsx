'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface BackupCodesStepProps {
  backupCodes: string[];
  onContinue: () => void;
}

export default function BackupCodesStep({ backupCodes, onContinue }: BackupCodesStepProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(backupCodes.join('\n'));
      toast.success('Backup codes copied to clipboard');
    } catch {
      toast.error('Could not copy — please select and copy manually');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([backupCodes.join('\n') + '\n'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chemos-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="login-heading">
        <h1 className="login-title">Save your backup codes</h1>
        <p className="login-sub">
          Use one of these if you ever lose access to your authenticator app. Each code works once, and this is the
          only time they&apos;ll be shown.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'var(--navy-light)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '14px',
          marginBottom: '16px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '13px',
          color: 'var(--white)',
        }}
      >
        {backupCodes.map((code) => (
          <div key={code} style={{ padding: '2px 0' }}>
            {code}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
        <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={handleCopy}>
          Copy codes
        </button>
        <button type="button" className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={handleDownload}>
          Download .txt
        </button>
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          fontSize: '12px',
          color: 'var(--gray)',
          marginBottom: '18px',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
          style={{ marginTop: '2px' }}
        />
        I&apos;ve saved these backup codes somewhere safe
      </label>

      <button
        type="button"
        className="btn btn-red login-submit"
        disabled={!acknowledged}
        onClick={onContinue}
      >
        Continue
      </button>
    </>
  );
}
