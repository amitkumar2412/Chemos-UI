'use client';

import { useState, useEffect } from 'react';

interface UserModalProps {
  isOpen: boolean;
  currentUser: string;
  onSave: (name: string) => void;
}

export default function UserModal({ isOpen, currentUser, onSave }: UserModalProps) {
  const [value, setValue] = useState(currentUser);

  // Sync value when the modal opens
  useEffect(() => {
    if (isOpen) setValue(currentUser);
  }, [isOpen, currentUser]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 80) return;
    onSave(trimmed);
  };

  return (
    <div className={`modal-bg${isOpen ? ' show' : ''}`}>
      <div className="modal">
        <h2>Who&apos;s punching in?</h2>
        <p>
          Enter your name once. It&apos;s saved locally on this device and attached to
          every sale you submit, so the dashboard can attribute it correctly.
        </p>
        <input
          className="fi"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Shrish"
          autoFocus={isOpen}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
          }}
        />
        <button
          className="btn btn-red"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleSave}
        >
          ✓ Continue
        </button>
      </div>
    </div>
  );
}
