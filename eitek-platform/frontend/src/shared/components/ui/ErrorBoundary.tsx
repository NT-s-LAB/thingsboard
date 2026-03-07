'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: string) => void;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorInfo?: string;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError,
  errorInfo 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {error.message || 'An unexpected error occurred'}
            </p>
            
            {process.env.NODE_ENV === 'development' && errorInfo && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs text-gray-500 bg-gray-100 p-3 rounded overflow-auto">
                  {error.stack}
                  {errorInfo}
                </pre>
              </details>
            )}

            <div className="mt-6">
              <Button
                onClick={resetError}
                className="w-full flex justify-center items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    const stack = errorInfo.componentStack ?? '';
    
    this.setState({
      error,
      errorInfo: stack
    });

    if (this.props.onError) {
      this.props.onError(error, stack);
    }
  }

  resetError = () => {
    this.setState({ hasError: false } as ErrorBoundaryState);
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      const fallbackProps: ErrorFallbackProps = {
          error: this.state.error,
          resetError: this.resetError,
        };
        if (this.state.errorInfo) {
          fallbackProps.errorInfo = this.state.errorInfo;
        }

      return (
        <FallbackComponent
          {...fallbackProps}
        />
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to handle errors
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
};

// Component for displaying inline errors
interface InlineErrorProps {
  error?: string | Error | null;
  className?: string;
  showIcon?: boolean;
}

export const InlineError: React.FC<InlineErrorProps> = ({ 
  error, 
  className = '', 
  showIcon = true 
}) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className={`flex items-center text-red-600 text-sm ${className}`}>
      {showIcon && <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />}
      <span>{errorMessage}</span>
    </div>
  );
};

// Component for displaying error states in cards/sections
interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Error',
  message,
  error,
  onRetry,
  retryLabel = 'Try Again',
  className = ''
}) => {
  const errorMessage = message || error?.message || 'An error occurred';

  return (
    <div className={`text-center py-8 ${className}`}>
      <AlertCircle className="mx-auto h-8 w-8 text-red-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{errorMessage}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
};

// Global error handler utility
export const setupGlobalErrorHandler = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    
    // You can integrate with error reporting service here
    // Example: Sentry.captureException(event.reason);
    
    // Prevent the error from being logged to console
    event.preventDefault();
  });

  // Handle other unhandled errors
  window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
    
    // You can integrate with error reporting service here
    // Example: Sentry.captureException(event.error);
  });
};