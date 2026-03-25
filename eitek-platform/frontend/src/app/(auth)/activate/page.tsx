'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { authService } from '@/features/auth/services/authService';
import { CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

function ActivateForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Link kích hoạt không hợp lệ.');
      return;
    }

    authService.activateAccount(token)
      .then((result) => {
        setStatus('success');
        setMessage(result.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || 'Link kích hoạt không hợp lệ hoặc đã hết hạn.');
      });
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
        <div className="text-center">
          <div className="mx-auto mb-6">
            <LoadingSpinner size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Đang kích hoạt tài khoản...</h2>
          <p className="text-gray-500">Vui lòng đợi trong giây lát.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Kích hoạt thất bại</h2>
          <p className="text-gray-500 mb-6">{message}</p>
          <div className="flex flex-col items-center gap-3">
            <a
              href="/register"
              className="inline-flex items-center gap-2 text-[#1e3a5f] hover:text-[#2a4a6f] font-medium transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              Đăng ký lại
            </a>
            <a
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Quay lại đăng nhập
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Kích hoạt thành công!</h2>
        <p className="text-gray-500 mb-6">{message}</p>
        <a
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2a4a6f] font-medium transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          Đăng nhập ngay
        </a>
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <ActivateForm />
    </Suspense>
  );
}
