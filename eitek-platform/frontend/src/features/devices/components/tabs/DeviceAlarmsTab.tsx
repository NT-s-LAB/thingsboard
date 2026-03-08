'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { deviceService } from '../../services/deviceService';
import type { TbAlarmData } from '../../types';

interface DeviceAlarmsTabProps {
  deviceId: string;
}

const severityColors: Record<string, string> = {
  'CRITICAL': 'bg-red-100 text-red-800',
  'MAJOR': 'bg-orange-100 text-orange-800',
  'MINOR': 'bg-yellow-100 text-yellow-800',
  'WARNING': 'bg-blue-100 text-blue-800',
  'INDETERMINATE': 'bg-gray-100 text-gray-800',
};

const statusFilters = ['ANY', 'ACTIVE_UNACK', 'ACTIVE_ACK', 'CLEARED_UNACK', 'CLEARED_ACK'];

export const DeviceAlarmsTab: React.FC<DeviceAlarmsTabProps> = ({ deviceId }) => {
  const [alarms, setAlarms] = useState<TbAlarmData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ANY');

  const fetchAlarms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { pageSize: 20, page };
      if (statusFilter !== 'ANY') {
        params.searchStatus = statusFilter;
      }
      const result = await deviceService.getDeviceAlarms(deviceId, params);
      setAlarms(result.data || []);
      setTotalPages(result.totalPages || 0);
      setTotalElements(result.totalElements || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alarms');
    } finally {
      setLoading(false);
    }
  }, [deviceId, page, statusFilter]);

  useEffect(() => {
    fetchAlarms();
  }, [fetchAlarms]);

  const handleAck = async (alarmId: string) => {
    try {
      await deviceService.ackDeviceAlarm(deviceId, alarmId);
      await fetchAlarms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge alarm');
    }
  };

  const handleClear = async (alarmId: string) => {
    try {
      await deviceService.clearDeviceAlarm(deviceId, alarmId);
      await fetchAlarms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear alarm');
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-2">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(0); }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === status
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status === 'ANY' ? 'All' : status.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{totalElements} alarms</span>
          <Button variant="outline" size="sm" onClick={fetchAlarms}>Refresh</Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Alarms Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading alarms...</div>
      ) : alarms.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No alarms found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {alarms.map((alarm) => (
                <tr key={alarm.id.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(alarm.createdTime).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{alarm.type}</td>
                  <td className="px-4 py-3">
                    <Badge className={severityColors[alarm.severity] || 'bg-gray-100 text-gray-800'}>
                      {alarm.severity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${alarm.cleared ? 'text-green-600' : alarm.acknowledged ? 'text-blue-600' : 'text-red-600'}`}>
                      {alarm.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={alarm.details ? JSON.stringify(alarm.details) : ''}>
                    {alarm.details ? JSON.stringify(alarm.details) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2">
                      {!alarm.acknowledged && (
                        <button
                          onClick={() => handleAck(alarm.id.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Acknowledge
                        </button>
                      )}
                      {!alarm.cleared && (
                        <button
                          onClick={() => handleClear(alarm.id.id)}
                          className="text-xs text-green-600 hover:text-green-800"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
