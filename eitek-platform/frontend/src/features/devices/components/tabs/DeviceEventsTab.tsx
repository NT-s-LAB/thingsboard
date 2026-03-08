'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { deviceService } from '../../services/deviceService';
import type { DeviceEvent } from '../../types';

interface DeviceEventsTabProps {
  deviceId: string;
}

const eventTypes = [
  { key: 'LC_EVENT', label: 'Lifecycle' },
  { key: 'STATS', label: 'Statistics' },
  { key: 'ERROR', label: 'Error' },
  { key: 'DEBUG_RULE_NODE', label: 'Debug' },
];

export const DeviceEventsTab: React.FC<DeviceEventsTabProps> = ({ deviceId }) => {
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventType, setEventType] = useState('LC_EVENT');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await deviceService.getDeviceEvents(deviceId, eventType, {
        pageSize: 20,
        page,
      });
      setEvents(result.data || []);
      setTotalPages(result.totalPages || 0);
      setTotalElements(result.totalElements || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [deviceId, eventType, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const formatEventBody = (body: any): string => {
    if (!body) return '-';
    if (typeof body === 'string') return body;
    return JSON.stringify(body, null, 2);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Event Type Selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-2">
          {eventTypes.map((et) => (
            <button
              key={et.key}
              onClick={() => { setEventType(et.key); setPage(0); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                eventType === et.key
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {et.label}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{totalElements} events</span>
          <Button variant="outline" size="sm" onClick={fetchEvents}>Refresh</Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Events */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No {eventTypes.find(e => e.key === eventType)?.label?.toLowerCase()} events found</div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className={`w-2 h-2 rounded-full ${
                    eventType === 'ERROR' ? 'bg-red-500' : 
                    eventType === 'LC_EVENT' ? 'bg-blue-500' : 
                    eventType === 'STATS' ? 'bg-green-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(event.createdTime).toLocaleString()}
                  </span>
                </div>
                {event.serviceId && (
                  <span className="text-xs text-gray-500 font-mono">{event.serviceId}</span>
                )}
              </div>
              <div className="ml-5">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-2 max-h-48 overflow-y-auto">
                  {formatEventBody(event.body)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-sm text-gray-500">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
