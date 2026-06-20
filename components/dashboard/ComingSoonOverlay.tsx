'use client';

import { ReactNode } from 'react';

interface ComingSoonOverlayProps {
  children: ReactNode;
  module?: string;
  progress?: number;
}

export default function ComingSoonOverlay({
  children,
  module = 'This Module',
  progress = 65,
}: ComingSoonOverlayProps) {
  return (
    <div style={{ position: 'relative', minHeight: '500px' }}>

      {/* Blurred background content */}
      <div
        style={{
          filter: 'blur(6px)',
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: 0.45,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>

      {/* Overlay card */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20,
        }}
      >
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            padding: '52px 44px',
            textAlign: 'center',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
          }}
        >
          {/* Icon */}
          <div style={{ fontSize: '56px', marginBottom: '20px', lineHeight: 1 }}>
            🚧
          </div>

          {/* Badge */}
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(245,158,11,0.12)',
              color: '#f59e0b',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '100px',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '4px 14px',
              marginBottom: '20px',
            }}
          >
            Under Development
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--text)',
              marginBottom: '10px',
              letterSpacing: '-0.4px',
            }}
          >
            {module} is Coming Soon
          </h2>

          {/* Description */}
          <p
            style={{
              fontSize: '14px',
              color: 'var(--gray)',
              lineHeight: '1.65',
              marginBottom: '32px',
            }}
          >
            Our team is actively building this module with full enterprise-grade
            features. It will be available in the next release.
          </p>

          {/* Progress bar */}
          <div style={{ marginBottom: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--gray)', fontWeight: '500' }}>
                Development Progress
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--blue)',
                }}
              >
                {progress}%
              </span>
            </div>
            <div
              style={{
                background: 'var(--border)',
                borderRadius: '100px',
                height: '7px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                  height: '100%',
                  width: `${progress}%`,
                  borderRadius: '100px',
                  transition: 'width 0.8s ease',
                }}
              />
            </div>
          </div>

          {/* Footer note */}
          <p style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '20px', opacity: 0.7 }}>
            ChemOS™ Enterprise · Contact your administrator for ETA
          </p>
        </div>
      </div>
    </div>
  );
}
