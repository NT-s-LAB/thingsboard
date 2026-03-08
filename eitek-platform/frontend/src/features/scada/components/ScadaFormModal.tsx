'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/Dialog';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';

const scadaSchema = z.object({
  name: z.string().min(1, 'Tên SCADA không được để trống').max(100, 'Tối đa 100 ký tự'),
  description: z.string().max(500, 'Tối đa 500 ký tự').optional(),
  canvasWidth: z.number().min(320, 'Tối thiểu 320px').max(7680, 'Tối đa 7680px'),
  canvasHeight: z.number().min(240, 'Tối thiểu 240px').max(4320, 'Tối đa 4320px'),
});

type ScadaFormData = z.infer<typeof scadaSchema>;

interface ScadaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description?: string | undefined;
    canvasSize?: { width: number; height: number } | undefined;
  }) => Promise<void>;
  initialData?: {
    name: string;
    description?: string | undefined;
    canvasWidth?: number | undefined;
    canvasHeight?: number | undefined;
  } | undefined;
  title?: string | undefined;
  isLoading?: boolean | undefined;
}

export const ScadaFormModal: React.FC<ScadaFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = 'Tạo SCADA Dashboard',
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScadaFormData>({
    resolver: zodResolver(scadaSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      canvasWidth: initialData?.canvasWidth || 1920,
      canvasHeight: initialData?.canvasHeight || 1080,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData?.name || '',
        description: initialData?.description || '',
        canvasWidth: initialData?.canvasWidth || 1920,
        canvasHeight: initialData?.canvasHeight || 1080,
      });
    }
  }, [isOpen, initialData, reset]);

  const onFormSubmit = async (data: ScadaFormData) => {
    await onSubmit({
      name: data.name,
      description: data.description,
      canvasSize: { width: data.canvasWidth, height: data.canvasHeight },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên SCADA <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('name')}
              placeholder="VD: Dashboard Dây chuyền sản xuất"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Mô tả ngắn gọn về dashboard này..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Canvas Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kích thước Canvas
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Chiều rộng (px)</label>
                <Input
                  type="number"
                  {...register('canvasWidth', { valueAsNumber: true })}
                  className={errors.canvasWidth ? 'border-red-500' : ''}
                />
                {errors.canvasWidth && (
                  <p className="text-red-500 text-xs mt-1">{errors.canvasWidth.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Chiều cao (px)</label>
                <Input
                  type="number"
                  {...register('canvasHeight', { valueAsNumber: true })}
                  className={errors.canvasHeight ? 'border-red-500' : ''}
                />
                {errors.canvasHeight && (
                  <p className="text-red-500 text-xs mt-1">{errors.canvasHeight.message}</p>
                )}
              </div>
            </div>
            {/* Preset buttons */}
            <div className="flex gap-2 mt-2">
              {[
                { label: 'Full HD', w: 1920, h: 1080 },
                { label: '2K', w: 2560, h: 1440 },
                { label: '4K', w: 3840, h: 2160 },
                { label: 'Tablet', w: 1024, h: 768 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    reset((prev) => ({
                      ...prev,
                      canvasWidth: preset.w,
                      canvasHeight: preset.h,
                    }));
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border text-gray-600 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Đang lưu...
                </>
              ) : initialData?.name ? (
                'Cập nhật'
              ) : (
                'Tạo mới'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
