'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/Button';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { useGlobalStore } from '@/shared/stores/globalStore';
import { authService } from '@/features/auth/services/authService';
import { Eye, EyeOff, User, Lock, Mail, ArrowRight, CheckCircle } from 'lucide-react';

const registerSchema = z.object({
  firstName: z.string().min(1, 'Vui lòng nhập họ'),
  lastName: z.string().min(1, 'Vui lòng nhập tên'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(6, 'Vui lòng xác nhận mật khẩu'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { addNotification } = useGlobalStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      await authService.register({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
      });

      setRegisteredEmail(data.email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại');
      addNotification({
        type: 'error',
        title: 'Đăng ký thất bại',
        message: err.message || 'Vui lòng thử lại',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full pl-12 pr-4 py-3.5 bg-white border rounded-lg text-gray-900 placeholder:text-gray-400 
     transition-all duration-200 outline-none
     ${hasError
       ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
       : 'border-gray-300 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20'
     }`;

  // Success state — show "check your email" message
  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Đăng ký thành công!</h2>
          <p className="text-gray-500 mb-2">
            Chúng tôi đã gửi email kích hoạt đến:
          </p>
          <p className="font-semibold text-[#1e3a5f] text-lg mb-6">{registeredEmail}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 mb-6">
            <p>Vui lòng kiểm tra hộp thư (và thư mục spam) để kích hoạt tài khoản.</p>
            <p className="mt-1 text-blue-500">Link kích hoạt có hiệu lực trong 24 giờ.</p>
          </div>
          <a
            href="/login"
            className="inline-flex items-center gap-2 text-[#1e3a5f] hover:text-[#2a4a6f] font-medium transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Đi đến trang đăng nhập
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
        <h2 className="text-2xl font-bold text-gray-900">Đăng ký tài khoản</h2>
        <p className="text-gray-500 mt-2">Tạo tài khoản để sử dụng EITEK Platform</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Họ"
                className={inputClass(!!errors.firstName)}
                {...register('firstName')}
              />
            </div>
            {errors.firstName && (
              <p className="text-sm text-red-500 pl-1">{errors.firstName.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Tên"
                className={inputClass(!!errors.lastName)}
                {...register('lastName')}
              />
            </div>
            {errors.lastName && (
              <p className="text-sm text-red-500 pl-1">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              placeholder="Email"
              className={inputClass(!!errors.email)}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500 pl-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              className={`${inputClass(!!errors.password)} !pr-12`}
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

        {/* Confirm Password */}
        <div className="space-y-1">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Xác nhận mật khẩu"
              className={inputClass(!!errors.confirmPassword)}
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500 pl-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-[#1e3a5f] hover:bg-[#2a4a6f] text-white font-medium rounded-lg
            transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Đang đăng ký...</span>
            </>
          ) : (
            <>
              <ArrowRight className="w-4 h-4" />
              <span>Đăng ký</span>
            </>
          )}
        </Button>

        {/* Login Link */}
        <div className="text-center pt-2">
          <p className="text-sm text-gray-500">
            Đã có tài khoản?{' '}
            <a href="/login" className="text-[#1e3a5f] hover:text-[#2a4a6f] font-medium transition-colors">
              Đăng nhập
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
