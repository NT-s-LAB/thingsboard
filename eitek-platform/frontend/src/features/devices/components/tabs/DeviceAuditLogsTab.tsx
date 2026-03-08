'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { deviceService } from '../../services/deviceService';
import type { DeviceAuditLog } from '../../types';

interface DeviceAuditLogsTabProps {
  deviceId: string;
}

const actionStatusColors: Record<string, string> = {
  'SUCCESS': 'bg-green-100 text-green-800',
  'FAILURE': 'bg-red-100 text-red-800',
};

export const DeviceAuditLogsTab: React.FC<DeviceAuditLogsTabProps> = ({ deviceId }) => {
  const [logs, setLogs] = useState<DeviceAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await deviceService.getDeviceAuditLogs(deviceId, {
        pageSize: 20,
        page,
      });
      setLogs(result.data || []);
      setTotalPages(result.totalPages || 0);
      setTotalElements(result.totalElements || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [deviceId, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const toggleExpand = (logId: string) => {
    setExpandedLog(prev => prev === logId ? null : logId);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{totalElements} audit logs</span>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs}>Refresh</Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Audit Logs Table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading audit logs...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No audit logs found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <React.Fragment key={log.id.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(log.createdTime).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{log.actionType}</td>
                    <td className="px-4 py-3 text-gray-700">{log.userName}</td>
                    <td className="px-4 py-3 text-gray-600">{log.entityName}</td>
                    <td className="px-4 py-3">
                      <Badge className={actionStatusColors[log.actionStatus] || 'bg-gray-100 text-gray-800'}>
                        {log.actionStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(log.actionData || log.actionFailureDetails) && (
                        <button
                          onClick={() => toggleExpand(log.id.id)}
                          className="text-xs text-primary-600 hover:text-primary-800"
                        >
                          {expandedLog === log.id.id ? 'Hide' : 'View'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedLog === log.id.id && (
                    <tr>
                      <td colSpan={6} className="px-4 py-3 bg-gray-50">
                        {log.actionData && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-500">Action Data:</span>
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap mt-1">
                              {JSON.stringify(log.actionData, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.actionFailureDetails && (
                          <div>
                            <span className="text-xs font-medium text-red-500">Failure Details:</span>
                            <pre className="text-xs text-red-600 whitespace-pre-wrap mt-1">
                              {log.actionFailureDetails}
                            </pre>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
