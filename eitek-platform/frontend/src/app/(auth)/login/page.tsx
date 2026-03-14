'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/Button';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useGlobalStore } from '@/shared/stores/globalStore';
import { Eye, EyeOff, User, Lock, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();
  const { addNotification } = useGlobalStore();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      addNotification({
        type: 'success',
        title: 'Đăng nhập thành công',
        message: 'Chào mừng bạn đến với EITEK Platform',
      });
      router.push('/');
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Đăng nhập thất bại',
        message: error.message || 'Vui lòng kiểm tra lại thông tin đăng nhập',
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10">
      {/* Mobile Logo */}
      <div className="lg:hidden text-center mb-8">
        <h1 className="text-4xl font-bold text-[#1e3a5f] tracking-wider">EITEK</h1>
        <p className="text-xs text-gray-500 tracking-[0.2em] uppercase mt-1">
          Electrical & Electronics Technology
        </p>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Đăng nhập
        </h2>
        <p className="text-gray-500 mt-2">
          Chào mừng trở lại! Vui lòng nhập thông tin của bạn.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-1">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <User className="w-5 h-5" />
            </div>
            <input
              id="email"
              type="email"
              placeholder="Tên người dùng (Email)"
              className={`w-full pl-12 pr-4 py-3.5 bg-white border rounded-lg text-gray-900 placeholder:text-gray-400 
                transition-all duration-200 outline-none
                ${errors.email 
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                  : 'border-gray-300 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20'
                }
              `}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500 pl-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              className={`w-full pl-12 pr-12 py-3.5 bg-white border rounded-lg text-gray-900 placeholder:text-gray-400 
                transition-all duration-200 outline-none
                ${errors.password 
                  ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                  : 'border-gray-300 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20'
                }
              `}
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

        {/* Forgot Password */}
        <div className="text-right">
          <a href="/forgot-password" className="text-sm text-[#1e3a5f] hover:text-[#2a4a6f] font-medium transition-colors">
            Forgot Password?
          </a>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-gray-200 hover:bg-[#1e3a5f] hover:text-white
            text-gray-600 font-medium rounded-lg
            transition-all duration-200
            flex items-center justify-center gap-2 group"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              <span>Đang đăng nhập...</span>
            </>
          ) : (
            <>
              <ArrowRight className="w-4 h-4" />
              <span>Đăng nhập</span>
            </>
          )}
        </Button>
      </form>
    </div>
  );
}