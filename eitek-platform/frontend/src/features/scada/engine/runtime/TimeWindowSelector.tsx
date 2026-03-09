/**
 * TimeWindowSelector — Dashboard time window configuration panel (similar to ThingsBoard).
 * 
 * Features:
 * - Realtime / History mode tabs
 * - Last X time selector
 * - History date range picker
 * - Aggregation type selector
 * - Grouping interval selector
 * - Timezone display
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRuntimeNavStore } from '../../stores/runtimeNavStore';
import {
  LAST_INTERVAL_OPTIONS,
  GROUPING_INTERVAL_OPTIONS,
  AGGREGATION_OPTIONS,
  formatTimeUnit,
  timeUnitToMs,
  type AggregationType,
} from '../../core/types/timeWindow.types';

// ─── Icons ───────────────────────────────────────────────────────────────────

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 6,
    color: '#fff',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  } as React.CSSProperties,
  triggerHover: {
    background: 'rgba(255,255,255,0.15)',
  } as React.CSSProperties,
  panel: {
    position: 'absolute' as const,
    top: '100%',
    right: 0,
    marginTop: 8,
    width: 340,
    background: '#fff',
    borderRadius: 8,
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    border: '1px solid #e5e7eb',
    zIndex: 9999,
    overflow: 'hidden',
  } as React.CSSProperties,
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #e5e7eb',
  } as React.CSSProperties,
  tab: {
    flex: 1,
    padding: '10px 16px',
    fontSize: 13,
    fontWeight: 500,
    background: '#f9fafb',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    transition: 'all 0.15s ease',
  } as React.CSSProperties,
  tabActive: {
    background: '#3b82f6',
    color: '#fff',
  } as React.CSSProperties,
  content: {
    padding: 16,
  } as React.CSSProperties,
  section: {
    marginBottom: 16,
  } as React.CSSProperties,
  sectionLast: {
    marginBottom: 0,
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 6,
  } as React.CSSProperties,
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  } as React.CSSProperties,
  toggleGroup: {
    display: 'flex',
    border: '1px solid #d1d5db',
    borderRadius: 6,
    overflow: 'hidden',
  } as React.CSSProperties,
  toggleBtn: {
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 500,
    border: 'none',
    background: '#fff',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  } as React.CSSProperties,
  toggleBtnActive: {
    background: '#3b82f6',
    color: '#fff',
  } as React.CSSProperties,
  timezone: {
    marginLeft: 'auto',
    padding: '4px 8px',
    background: '#f3f4f6',
    borderRadius: 4,
    fontSize: 11,
    color: '#6b7280',
    fontWeight: 500,
  } as React.CSSProperties,
  select: {
    flex: 1,
    padding: '8px 12px',
    fontSize: 13,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    background: '#fff',
    color: '#1f2937',
    cursor: 'pointer',
    outline: 'none',
  } as React.CSSProperties,
  divider: {
    height: 1,
    background: '#e5e7eb',
    margin: '16px 0',
  } as React.CSSProperties,
  dateInput: {
    flex: 1,
    padding: '8px 12px',
    fontSize: 13,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    background: '#fff',
    color: '#1f2937',
    outline: 'none',
  } as React.CSSProperties,
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    padding: '12px 16px',
    borderTop: '1px solid #e5e7eb',
    background: '#f9fafb',
  } as React.CSSProperties,
  btn: {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  } as React.CSSProperties,
  btnCancel: {
    background: '#fff',
    border: '1px solid #d1d5db',
    color: '#374151',
  } as React.CSSProperties,
  btnUpdate: {
    background: '#3b82f6',
    border: '1px solid #3b82f6',
    color: '#fff',
  } as React.CSSProperties,
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  } as React.CSSProperties,
};

// ─── Component ───────────────────────────────────────────────────────────────

export const TimeWindowSelector: React.FC = () => {
  const {
    timeWindow,
    timeWindowPanelOpen,
    toggleTimeWindowPanel,
    setTimeWindowMode,
    setRealtimeLast,
    setHistoryRange,
    setAggregation,
    setGroupingInterval,
  } = useRuntimeNavStore();

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Local draft state for editing
  const [draft, setDraft] = useState(timeWindow);
  const [isHovered, setIsHovered] = useState(false);

  // Sync draft when panel opens
  useEffect(() => {
    if (timeWindowPanelOpen) {
      setDraft(timeWindow);
    }
  }, [timeWindowPanelOpen, timeWindow]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        if (timeWindowPanelOpen) toggleTimeWindowPanel();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [timeWindowPanelOpen, toggleTimeWindowPanel]);

  // Format display text for trigger button
  const getDisplayText = useCallback(() => {
    const tw = timeWindow;
    if (tw.mode === 'realtime') {
      if (tw.realtime.type === 'last') {
        return `Realtime - last ${formatTimeUnit(tw.realtime.lastValue, tw.realtime.lastUnit)}`;
      }
      return 'Realtime';
    }
    // History mode
    const start = new Date(tw.history.startTs).toLocaleDateString();
    const end = new Date(tw.history.endTs).toLocaleDateString();
    return `History: ${start} - ${end}`;
  }, [timeWindow]);

  // Apply changes
  const handleUpdate = () => {
    setTimeWindowMode(draft.mode);
    if (draft.mode === 'realtime') {
      setRealtimeLast(draft.realtime.lastValue, draft.realtime.lastUnit);
    } else {
      setHistoryRange(draft.history.startTs, draft.history.endTs);
    }
    setAggregation(draft.aggregation);
    setGroupingInterval(draft.groupingIntervalMs);
    toggleTimeWindowPanel();
  };

  // Handle interval selection (finds matching option)
  const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value, 10);
    const opt = LAST_INTERVAL_OPTIONS[idx];
    if (opt) {
      setDraft((d) => ({
        ...d,
        realtime: { ...d.realtime, type: 'last', lastValue: opt.value, lastUnit: opt.unit },
      }));
    }
  };

  // Find current interval index
  const currentIntervalIdx = LAST_INTERVAL_OPTIONS.findIndex(
    (o) => o.value === draft.realtime.lastValue && o.unit === draft.realtime.lastUnit,
  );

  // Handle grouping interval change
  const handleGroupingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value, 10);
    const opt = GROUPING_INTERVAL_OPTIONS[idx];
    if (opt) {
      setDraft((d) => ({ ...d, groupingIntervalMs: timeUnitToMs(opt.value, opt.unit) }));
    }
  };

  // Find current grouping index
  const currentGroupingIdx = GROUPING_INTERVAL_OPTIONS.findIndex(
    (o) => timeUnitToMs(o.value, o.unit) === draft.groupingIntervalMs,
  );

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        style={{ ...styles.trigger, ...(isHovered ? styles.triggerHover : {}) }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={toggleTimeWindowPanel}
        title="Configure time window"
      >
        <ClockIcon />
        <span>{getDisplayText()}</span>
        <ChevronDownIcon />
      </button>

      {/* Dropdown Panel */}
      {timeWindowPanelOpen && (
        <div ref={panelRef} style={styles.panel}>
          {/* Tabs */}
          <div style={styles.tabs}>
            <button
              style={{ ...styles.tab, ...(draft.mode === 'realtime' ? styles.tabActive : {}) }}
              onClick={() => setDraft((d) => ({ ...d, mode: 'realtime' }))}
            >
              Realtime
            </button>
            <button
              style={{ ...styles.tab, ...(draft.mode === 'history' ? styles.tabActive : {}) }}
              onClick={() => setDraft((d) => ({ ...d, mode: 'history' }))}
            >
              History
            </button>
          </div>

          {/* Content */}
          <div style={styles.content}>
            {draft.mode === 'realtime' ? (
              <>
                {/* Time window row */}
                <div style={styles.section}>
                  <span style={styles.label}>Time window</span>
                  <div style={styles.row}>
                    <div style={styles.toggleGroup}>
                      <button
                        style={{
                          ...styles.toggleBtn,
                          ...(draft.realtime.type === 'last' ? styles.toggleBtnActive : {}),
                        }}
                        onClick={() => setDraft((d) => ({ ...d, realtime: { ...d.realtime, type: 'last' } }))}
                      >
                        Last
                      </button>
                      <button
                        style={{
                          ...styles.toggleBtn,
                          ...(draft.realtime.type === 'relative' ? styles.toggleBtnActive : {}),
                        }}
                        onClick={() => setDraft((d) => ({ ...d, realtime: { ...d.realtime, type: 'relative' } }))}
                      >
                        Relative
                      </button>
                    </div>
                    <span style={styles.timezone}>{draft.timezone}</span>
                  </div>

                  {/* Last X time selector */}
                  {draft.realtime.type === 'last' && (
                    <select
                      style={styles.select}
                      value={currentIntervalIdx >= 0 ? currentIntervalIdx : 0}
                      onChange={handleIntervalChange}
                    >
                      {LAST_INTERVAL_OPTIONS.map((opt, idx) => (
                        <option key={idx} value={idx}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* History date range */}
                <div style={styles.section}>
                  <span style={styles.label}>Date range</span>
                  <div style={styles.row}>
                    <input
                      type="datetime-local"
                      style={styles.dateInput}
                      value={new Date(draft.history.startTs).toISOString().slice(0, 16)}
                      onChange={(e) => {
                        const ts = new Date(e.target.value).getTime();
                        if (!isNaN(ts)) setDraft((d) => ({ ...d, history: { ...d.history, startTs: ts } }));
                      }}
                    />
                  </div>
                  <div style={styles.row}>
                    <input
                      type="datetime-local"
                      style={styles.dateInput}
                      value={new Date(draft.history.endTs).toISOString().slice(0, 16)}
                      onChange={(e) => {
                        const ts = new Date(e.target.value).getTime();
                        if (!isNaN(ts)) setDraft((d) => ({ ...d, history: { ...d.history, endTs: ts } }));
                      }}
                    />
                  </div>
                  <span style={styles.timezone}>{draft.timezone}</span>
                </div>
              </>
            )}

            <div style={styles.divider} />

            {/* Aggregation */}
            <div style={styles.section}>
              <span style={styles.label}>Aggregation</span>
              <select
                style={styles.select}
                value={draft.aggregation}
                onChange={(e) => setDraft((d) => ({ ...d, aggregation: e.target.value as AggregationType }))}
              >
                {AGGREGATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Grouping interval */}
            <div style={{ ...styles.section, ...styles.sectionLast }}>
              <span style={styles.label}>Grouping interval</span>
              <select
                style={styles.select}
                value={currentGroupingIdx >= 0 ? currentGroupingIdx : 0}
                onChange={handleGroupingChange}
              >
                {GROUPING_INTERVAL_OPTIONS.map((opt, idx) => (
                  <option key={idx} value={idx}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <button
              style={{ ...styles.btn, ...styles.btnCancel }}
              onClick={toggleTimeWindowPanel}
            >
              Cancel
            </button>
            <button
              style={{ ...styles.btn, ...styles.btnUpdate }}
              onClick={handleUpdate}
            >
              Update
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeWindowSelector;
