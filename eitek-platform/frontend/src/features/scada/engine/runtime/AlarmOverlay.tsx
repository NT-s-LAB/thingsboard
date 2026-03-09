/**
 * Alarm Overlay — Badge rendered on top of a widget when it has an active alarm.
 */

import React from 'react';
import type { AlarmSeverity } from '../../core/types';

interface AlarmOverlayProps {
  severity: AlarmSeverity;
  count?: number;
}

export const AlarmOverlay: React.FC<AlarmOverlayProps> = ({ severity, count }) => {
  const severityClass = severity.toLowerCase();
  return (
    <div className={`scada-alarm-badge scada-alarm-badge--${severityClass}`}>
      {count && count > 1 ? count : '!'}
    </div>
  );
};
