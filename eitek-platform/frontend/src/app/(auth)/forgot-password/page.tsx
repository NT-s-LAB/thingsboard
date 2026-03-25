'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/Button';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { authService } from '@/features/auth/services/authService';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.requestPasswordReset(data.email);
      setSentEmail(data.email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Kiểm tra email của bạn</h2>
          <p className="text-gray-500 mb-2">
            Nếu tài khoản với email bên dưới tồn tại, chúng tôi đã gửi link đặt lại mật khẩu:
          </p>
          <p className="font-semibold text-[#1e3a5f] text-lg mb-6">{sentEmail}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 mb-6">
            <p>Vui lòng kiểm tra hộp thư (và thư mục spam).</p>
            <p className="mt-1 text-blue-500">Link có hiệu lực trong 1 giờ.</p>
          </div>
          <a
            href="/login"
            className="inline-flex items-center gap-2 text-[#1e3a5f] hover:text-[#2a4a6f] font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại đăng nhập
          </a>
        </div>
      </div>
    );
  }

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
        <h2 className="text-2xl font-bold text-gray-900">Quên mật khẩu</h2>
        <p className="text-gray-500 mt-2">
          Nhập email để nhận link đặt lại mật khẩu
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              placeholder="Email"
              className={`w-full pl-12 pr-4 py-3.5 bg-white border rounded-lg text-gray-900 placeholder:text-gray-400 
                transition-all duration-200 outline-none
                ${errors.email
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                  : 'border-gray-300 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20'
                }`}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500 pl-1">{errors.email.message}</p>
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
              <span>Đang gửi...</span>
            </>
          ) : (
            <>
              <ArrowRight className="w-4 h-4" />
              <span>Gửi link đặt lại mật khẩu</span>
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
