'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';

const siteSchema = z.object({
  name: z.string().min(1, 'Tên site không được để trống').max(100, 'Tên tối đa 100 ký tự'),
  description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional().or(z.literal('')),
  projectId: z.string().min(1, 'Vui lòng chọn dự án'),
  address: z.string().max(255, 'Địa chỉ tối đa 255 ký tự').optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

type SiteFormData = z.infer<typeof siteSchema>;

interface ProjectOption {
  id: string;
  name: string;
}

interface SiteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SiteFormData) => Promise<void>;
  initialData?: {
    name: string;
    description?: string | undefined;
    projectId: string;
    address?: string | undefined;
    isActive?: boolean | undefined;
  } | undefined;
  title: string;
  isLoading?: boolean | undefined;
  isEditMode?: boolean | undefined;
  projects: ProjectOption[];
}

export const SiteFormModal: React.FC<SiteFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
  isLoading = false,
  isEditMode = false,
  projects,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      projectId: initialData?.projectId || '',
      address: initialData?.address || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData?.name || '',
        description: initialData?.description || '',
        projectId: initialData?.projectId || '',
        address: initialData?.address || '',
        isActive: initialData?.isActive ?? true,
      });
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: SiteFormData) => {
    await onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="px-6 py-4 space-y-4">
            {/* Project Selection */}
            <div className="space-y-1">
              <label htmlFor="projectId" className="text-sm font-medium text-gray-700">
                Dự án <span className="text-red-500">*</span>
              </label>
              {projects.length === 0 ? (
                <p className="text-sm text-yellow-600 py-2">
                  Chưa có dự án nào. Vui lòng tạo dự án trước.
                </p>
              ) : (
                <select
                  id="projectId"
                  {...register('projectId')}
                  disabled={isEditMode}
                  className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">Chọn dự án</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.projectId && (
                <p className="text-sm text-red-600">{errors.projectId.message}</p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Tên site <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                placeholder="Nhập tên site..."
                {...register('name')}
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label htmlFor="address" className="text-sm font-medium text-gray-700">
                Địa chỉ
              </label>
              <Input
                id="address"
                placeholder="Nhập địa chỉ..."
                {...register('address')}
              />
              {errors.address && (
                <p className="text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Mô tả
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Mô tả site..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Active toggle */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isActive"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                {...register('isActive')}
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Kích hoạt site
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading || projects.length === 0}>
              {isSubmitting || isLoading ? 'Đang xử lý...' : initialData ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
