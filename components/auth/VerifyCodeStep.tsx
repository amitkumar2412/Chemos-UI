'use client';

import { useState } from 'react';

interface VerifyCodeStepProps {
  loading: boolean;
  error: string;
  onSubmit: (code: string) => void;
}

export default function VerifyCodeStep({ loading, error, onSubmit }: VerifyCodeStepProps) {
  const [code, setCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(code);
  };

  return (
    <>
      <div className="login-heading">
        <h1 className="login-title">Two-factor authentication</h1>
        <p className="login-sub">Enter the code from your authenticator app</p>
      </div>

      <form onSubmit={handleSubmit} className="login-form" noValidate>
        <div className="fg">
          <label className="fl" htmlFor="verify-code">
            Code <span className="req">*</span>
          </label>
          <input
            id="verify-code"
            className="fi"
            type="text"
            inputMode={useBackupCode ? 'text' : 'numeric'}
            placeholder={useBackupCode ? 'XXXX-XXXX' : '123456'}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoFocus
          />
        </div>

        {error && <div className="result err">{error}</div>}

        <button type="submit" className="btn btn-red login-submit" disabled={loading || !code}>
          {loading ? (
            <>
              <span className="login-spinner" />
              Verifying…
            </>
          ) : (
            'Verify'
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setUseBackupCode((v) => !v);
          setCode('');
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--teal)',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          marginTop: '14px',
          padding: 0,
        }}
      >
        {useBackupCode ? 'Use your authenticator app instead' : 'Use a backup code instead'}
      </button>
    </>
  );
}
