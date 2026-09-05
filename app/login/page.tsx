'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/lib/redux/hooks';
import { login } from '@/lib/redux/authSlice';
import { authService, type AuthResult } from '@/lib/services/auth';
import { ApiError } from '@/lib/apiClient';
import EnrollQrStep from '@/components/auth/EnrollQrStep';
import BackupCodesStep from '@/components/auth/BackupCodesStep';
import VerifyCodeStep from '@/components/auth/VerifyCodeStep';

type Step = 'credentials' | 'enroll' | 'backup-codes' | 'verify';

interface PreAuth {
  token: string;
  username: string;
}

const SESSION_EXPIRED_MESSAGE = 'Your session expired. Please log in again.';

function codeErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return err.message;
    if (err.status === 401) return 'Invalid code. Please try again.';
  }
  return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
}

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [step, setStep] = useState<Step>('credentials');
  const [preAuth, setPreAuth] = useState<PreAuth | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialsError, setCredentialsError] = useState('');

  const [enrollData, setEnrollData] = useState<{ secretBase32: string; otpauthUri: string } | null>(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState('');

  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [pendingAuth, setPendingAuth] = useState<AuthResult | null>(null);

  const backToCredentialsExpired = () => {
    setStep('credentials');
    setPreAuth(null);
    setCredentialsError(SESSION_EXPIRED_MESSAGE);
  };

  const finishLogin = (result: AuthResult) => {
    dispatch(login({ username: result.username, role: result.role, token: result.token }));
    router.replace('/');
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialsError('');
    setCredentialsLoading(true);
    try {
      const data = await authService.login({ username, password });
      setPreAuth({ token: data.preAuthToken, username: data.username });

      if (data.status === 'ENROLLMENT_REQUIRED') {
        const enrollInit = await authService.enrollInit(data.preAuthToken);
        setEnrollData(enrollInit);
        setStep('enroll');
      } else {
        setStep('verify');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
      setCredentialsError(msg);
    } finally {
      setCredentialsLoading(false);
    }
  };

  const handleEnrollConfirm = async (code: string) => {
    if (!preAuth) return;
    setCodeError('');
    setCodeLoading(true);
    try {
      const data = await authService.enrollConfirm(preAuth.token, code);
      setPendingAuth(data);
      setBackupCodes(data.backupCodes);
      setStep('backup-codes');
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        // Already enrolled - fall back to the normal verify path.
        setStep('verify');
      } else if (err instanceof ApiError && err.status === 401) {
        backToCredentialsExpired();
      } else {
        setCodeError(codeErrorMessage(err));
      }
    } finally {
      setCodeLoading(false);
    }
  };

  const handleVerify = async (code: string) => {
    if (!preAuth) return;
    setCodeError('');
    setCodeLoading(true);
    try {
      const data = await authService.verifyLogin(preAuth.token, code);
      finishLogin(data);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        backToCredentialsExpired();
      } else {
        setCodeError(codeErrorMessage(err));
      }
    } finally {
      setCodeLoading(false);
    }
  };

  const handleBackupCodesContinue = () => {
    if (pendingAuth) finishLogin(pendingAuth);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <div className="logo">C</div>
          <div>
            <div className="brand">
              <span>Chem</span>OS™
            </div>
            <div className="brand-sub">Enterprise Intelligence Platform</div>
          </div>
        </div>

        {step === 'credentials' && (
          <>
            <div className="login-heading">
              <h1 className="login-title">Welcome back</h1>
              <p className="login-sub">Sign in to access your workspace</p>
            </div>

            <form onSubmit={handleCredentialsSubmit} className="login-form" noValidate>
              <div className="fg">
                <label className="fl" htmlFor="login-username">
                  Username <span className="req">*</span>
                </label>
                <input
                  id="login-username"
                  className="fi"
                  type="text"
                  placeholder="your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="fg">
                <label className="fl" htmlFor="login-password">
                  Password <span className="req">*</span>
                </label>
                <div className="login-pw-wrap">
                  <input
                    id="login-password"
                    className="fi"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-pw-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {credentialsError && <div className="result err">{credentialsError}</div>}

              <button
                type="submit"
                className="btn btn-red login-submit"
                disabled={credentialsLoading || !username || !password}
              >
                {credentialsLoading ? (
                  <>
                    <span className="login-spinner" />
                    Signing in…
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </>
        )}

        {step === 'enroll' && enrollData && (
          <EnrollQrStep
            otpauthUri={enrollData.otpauthUri}
            secretBase32={enrollData.secretBase32}
            loading={codeLoading}
            error={codeError}
            onSubmit={handleEnrollConfirm}
          />
        )}

        {step === 'backup-codes' && (
          <BackupCodesStep backupCodes={backupCodes} onContinue={handleBackupCodesContinue} />
        )}

        {step === 'verify' && (
          <VerifyCodeStep loading={codeLoading} error={codeError} onSubmit={handleVerify} />
        )}

        <p className="login-footer">
          ChemOS™ &nbsp;·&nbsp; Enterprise Intelligence Platform
        </p>
      </div>
    </div>
  );
}
