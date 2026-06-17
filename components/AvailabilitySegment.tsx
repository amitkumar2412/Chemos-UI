'use client';

import type { AvailabilityType } from '@/lib/types';

interface AvailabilitySegmentProps {
  value: AvailabilityType;
  onChange: (val: AvailabilityType) => void;
}

export default function AvailabilitySegment({
  value,
  onChange,
}: AvailabilitySegmentProps) {
  return (
    <div className="seg">
      <button
        type="button"
        className={value === 'Ready' ? 'active' : ''}
        onClick={() => onChange('Ready')}
      >
        ● Ready
      </button>
      <button
        type="button"
        className={value === 'Incoming' ? 'active incoming' : ''}
        onClick={() => onChange('Incoming')}
      >
        ◐ Incoming
      </button>
    </div>
  );
}
