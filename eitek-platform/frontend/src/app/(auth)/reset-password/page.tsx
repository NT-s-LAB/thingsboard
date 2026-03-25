'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/Button';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { authService } from '@/features/auth/services/authService';
import { Lock, ArrowRight, ArrowLeft, CheckCircle, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const resetSchema = z.object({
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(6, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type ResetFormData = z.infer<typeof resetSchema>;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  if (!token) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Link không hợp lệ</h2>
          <p className="text-gray-500 mb-6">
            Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.
          </p>
          <a
            href="/forgot-password"
            className="inline-flex items-center gap-2 text-[#1e3a5f] hover:text-[#2a4a6f] font-medium transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Yêu cầu link mới
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Đặt lại mật khẩu thành công!</h2>
          <p className="text-gray-500 mb-6">
            Mật khẩu đã được cập nhật. Bạn có thể đăng nhập với mật khẩu mới.
          </p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2a4a6f] font-medium transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Đăng nhập
          </a>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ResetFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.resetPassword(token, data.password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra. Link có thể đã hết hạn.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full pl-12 pr-12 py-3.5 bg-white border rounded-lg text-gray-900 placeholder:text-gray-400 
     transition-all duration-200 outline-none
     ${hasError
       ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
       : 'border-gray-300 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20'
     }`;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
      {/* Mobile Logo */}
      <div className="lg:hidden text-center mb-8">
        <h1 className="text-4xl font-bold text-[#1e3a5f] tracking-wider">EITEK</h1>
        <p className="text-xs text-gray-500 tracking-[0.2em] uppercase mt-1">
          Electrical &amp; Electronics Technology
        </p>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Đặt lại mật khẩu</h2>
        <p className="text-gray-500 mt-2">Nhập mật khẩu mới cho tài khoản của bạn</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu mới"
              className={inputClass(!!errors.password)}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500 pl-1">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Xác nhận mật khẩu mới"
              className={`w-full pl-12 pr-4 py-3.5 bg-white border rounded-lg text-gray-900 placeholder:text-gray-400 
                transition-all duration-200 outline-none
                ${errors.confirmPassword
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-gray-300 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20'
                }`}
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500 pl-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-[#1e3a5f] hover:bg-[#2a4a6f] text-white font-medium rounded-lg
            transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Đang xử lý...</span>
            </>
          ) : (
            <>
              <ArrowRight className="w-4 h-4" />
              <span>Đặt lại mật khẩu</span>
            </>
          )}
        </Button>

        <div className="text-center pt-2">
          <a
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-[#1e3a5f] hover:text-[#2a4a6f] font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại đăng nhập
          </a>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
