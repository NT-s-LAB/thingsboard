'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { siteService } from '../services/siteService';
import type { Site } from '../types/site';

const areaSchema = z.object({
  name: z.string().min(1, 'Tên khu vực không được để trống').max(100, 'Tên tối đa 100 ký tự'),
  description: z.string().max(500, 'Mô tả tối đa 500 ký tự').optional().or(z.literal('')),
  siteId: z.string().min(1, 'Vui lòng chọn site'),
  isActive: z.boolean().optional(),
});

type AreaFormData = z.infer<typeof areaSchema>;

interface AreaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AreaFormData) => Promise<void>;
  initialData?: {
    name: string;
    description?: string | undefined;
    siteId: string;
    isActive?: boolean | undefined;
  } | undefined;
  title: string;
  isLoading?: boolean | undefined;
  isEditMode?: boolean | undefined;
}

export const AreaFormModal: React.FC<AreaFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
  isLoading = false,
  isEditMode = false,
}) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AreaFormData>({
    resolver: zodResolver(areaSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      siteId: initialData?.siteId || '',
      isActive: initialData?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        name: initialData?.name || '',
        description: initialData?.description || '',
        siteId: initialData?.siteId || '',
        isActive: initialData?.isActive ?? true,
      });
      loadSites();
    }
  }, [isOpen, initialData, reset]);

  const loadSites = async () => {
    setLoadingSites(true);
    try {
      const siteList = await siteService.getAllSites();
      setSites(siteList);
    } catch (error) {
      console.error('Failed to load sites:', error);
      setSites([]);
    } finally {
      setLoadingSites(false);
    }
  };

  if (!isOpen) return null;

  const handleFormSubmit = async (data: AreaFormData) => {
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
            {/* Site Selection */}
            <div className="space-y-1">
              <label htmlFor="siteId" className="text-sm font-medium text-gray-700">
                Site <span className="text-red-500">*</span>
              </label>
              {loadingSites ? (
                <div className="flex items-center space-x-2 text-sm text-gray-500 py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang tải danh sách site...</span>
                </div>
              ) : sites.length === 0 ? (
                <p className="text-sm text-yellow-600 py-2">
                  Chưa có site nào. Vui lòng tạo site trước.
                </p>
              ) : (
                <select
                  id="siteId"
                  {...register('siteId')}
                  disabled={isEditMode}
                  className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                >
                  <option value="">Chọn site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                      {site.project ? ` (${site.project.name})` : ''}
                    </option>
                  ))}
                </select>
              )}
              {errors.siteId && (
                <p className="text-sm text-red-600">{errors.siteId.message}</p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Tên khu vực <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                placeholder="Nhập tên khu vực..."
                {...register('name')}
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
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
                placeholder="Mô tả khu vực..."
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
                Kích hoạt khu vực
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting || isLoading}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading || sites.length === 0}>
              {isSubmitting || isLoading ? 'Đang xử lý...' : initialData ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
