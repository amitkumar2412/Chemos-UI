'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface EnrollQrStepProps {
  otpauthUri: string;
  secretBase32: string;
  loading: boolean;
  error: string;
  onSubmit: (code: string) => void;
}

export default function EnrollQrStep({ otpauthUri, secretBase32, loading, error, onSubmit }: EnrollQrStepProps) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(otpauthUri, { width: 200, margin: 1 }).then((url) => {
      if (!cancelled) setQrDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [otpauthUri]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(code);
  };

  return (
    <>
      <div className="login-heading">
        <h1 className="login-title">Set up two-factor authentication</h1>
        <p className="login-sub">Scan this QR code with your authenticator app</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt="Scan with your authenticator app"
            width={180}
            height={180}
            style={{ borderRadius: '8px', background: '#fff', padding: '8px' }}
          />
        ) : (
          <div style={{ width: 196, height: 196, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray)', fontSize: '12px' }}>
            Generating QR code…
          </div>
        )}
      </div>

      <div style={{ marginBottom: '18px' }}>
        <p className="fl" style={{ marginBottom: '6px' }}>Can&apos;t scan? Enter this code manually</p>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            letterSpacing: '0.5px',
            background: 'var(--navy-light)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '9px 12px',
            color: 'var(--white)',
            userSelect: 'all',
            wordBreak: 'break-all',
          }}
        >
          {secretBase32}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="login-form" noValidate>
        <div className="fg">
          <label className="fl" htmlFor="enroll-code">
            Enter the 6-digit code <span className="req">*</span>
          </label>
          <input
            id="enroll-code"
            className="fi"
            type="text"
            inputMode="numeric"
            placeholder="123456"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
            autoFocus
          />
        </div>

        {error && <div className="result err">{error}</div>}

        <button type="submit" className="btn btn-red login-submit" disabled={loading || code.length !== 6}>
          {loading ? (
            <>
              <span className="login-spinner" />
              Verifying…
            </>
          ) : (
            'Enable 2FA'
          )}
        </button>
      </form>
    </>
  );
}
