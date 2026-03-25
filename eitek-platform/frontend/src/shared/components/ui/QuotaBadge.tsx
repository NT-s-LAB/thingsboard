'use client';

import React from 'react';

interface QuotaBadgeProps {
  current: number;
  max: number | null;
  label?: string;
}

/**
 * Compact badge showing current/max usage. Turns red when at limit.
 */
export const QuotaBadge: React.FC<QuotaBadgeProps> = ({ current, max, label }) => {
  const atLimit = max !== null && current >= max;
  const nearLimit = max !== null && current >= max * 0.8;

  const bgColor = atLimit ? '#FEE2E2' : nearLimit ? '#FEF3C7' : '#F0FDF4';
  const textColor = atLimit ? '#DC2626' : nearLimit ? '#D97706' : '#16A34A';
  const borderColor = atLimit ? '#FECACA' : nearLimit ? '#FDE68A' : '#BBF7D0';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 600,
        borderRadius: 9999,
        background: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
        whiteSpace: 'nowrap',
      }}
    >
      {label && <span style={{ fontWeight: 400, opacity: 0.8 }}>{label}</span>}
      {current} / {max === null ? '∞' : max}
    </span>
  );
};
