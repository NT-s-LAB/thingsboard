'use client';

import React, { useState } from 'react';
import { ImagePickerDialog } from '@/shared/components/ImagePickerDialog';
import { Field } from '../PropertyPanel';

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  onChange: (url: string | undefined) => void;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  ImageUploadField (property panel field)                                   */
/* ────────────────────────────────────────────────────────────────────────── */
export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ label, value, onChange }) => {
  const [showPicker, setShowPicker] = useState(false);

  const handlePick = (url: string) => {
    onChange(url);
    setShowPicker(false);
  };

  return (
    <Field label={label}>
      <div className="space-y-1.5">
        {value && (
          <div className="relative group w-full">
            <img
              src={value}
              alt={label}
              className="w-full h-16 object-contain border border-gray-200 rounded bg-gray-50"
            />
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] leading-none opacity-0 group-hover:opacity-100 transition-opacity"
              title="Remove"
            >
              ✕
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="w-full text-xs px-2 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 font-medium"
        >
          📂 Select from Library
        </button>
      </div>

      {/* Full-screen image picker dialog */}
      <ImagePickerDialog open={showPicker} onClose={() => setShowPicker(false)} onPick={handlePick} />
    </Field>
  );
};
