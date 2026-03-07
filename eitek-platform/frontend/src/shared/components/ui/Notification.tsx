import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface NotificationProps {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
  onClose?: (id: string) => void;
  actions?: {
    label: string;
    onClick: () => void;
  }[];
  autoClose?: boolean;
  duration?: number;
}

const iconMap = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

const colorMap = {
  success: 'bg-green-50 border-green-200 text-green-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
};

const iconColorMap = {
  success: 'text-green-600',
  info: 'text-blue-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
};

export function Notification({ 
  id, 
  type, 
  title, 
  message, 
  onClose, 
  actions = [], 
  autoClose = true,
  duration = 5000 
}: NotificationProps) {
  const Icon = iconMap[type];

  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [id, autoClose, duration, onClose]);

  return (
    <div className={cn(
      'rounded-lg border p-4 shadow-sm animate-slide-in-from-right',
      colorMap[type]
    )}>
      <div className="flex">
        <Icon className={cn('h-5 w-5 mt-0.5 mr-3', iconColorMap[type])} />
        <div className="flex-1">
          <h4 className="font-medium">{title}</h4>
          {message && (
            <p className="mt-1 text-sm opacity-90">{message}</p>
          )}
          {actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="text-sm font-medium underline hover:no-underline"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={() => onClose(id)}
            className="ml-3 opacity-70 hover:opacity-100"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Notification Container
interface NotificationContainerProps {
  notifications: NotificationProps[];
  onDismiss: (id: string) => void;
}

export function NotificationContainer({ notifications, onDismiss }: NotificationContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 w-80">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          {...notification}
          onClose={onDismiss}
        />
      ))}
    </div>
  );
}