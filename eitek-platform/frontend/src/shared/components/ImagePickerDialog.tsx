'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  imageLibraryService,
  type ImageCategoryItem,
  type ImageItem,
} from '@/features/scada/services/imageLibraryService';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

/* ── Folder Tree Node ── */
const FolderNode: React.FC<{
  cat: ImageCategoryItem;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}> = ({ cat, depth, selectedId, onSelect }) => {
  const [open, setOpen] = useState(depth < 1);
  const hasKids = (cat.children?.length ?? 0) > 0;
  const active = selectedId === cat.id;
  return (
    <div>
      <div
        className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 text-sm transition-colors ${
          active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
        }`}
        style={{ paddingLeft: 12 + depth * 18 }}
        onClick={() => { onSelect(cat.id); if (hasKids) setOpen(!open); }}
      >
        <span className="w-4 text-center text-[10px] text-gray-400 flex-shrink-0">
          {hasKids ? (open ? '▼' : '▶') : ''}
        </span>
        <span className="flex-shrink-0">{open && hasKids ? '📂' : '📁'}</span>
        <span className="flex-1 truncate">{cat.name}</span>
        {(cat._count?.files ?? 0) > 0 && (
          <span className="text-[10px] text-gray-400">{cat._count!.files}</span>
        )}
      </div>
      {open && cat.children?.map((c) => (
        <FolderNode key={c.id} cat={c} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
};

/* ── Image Picker Dialog (full-screen modal) ── */
export const ImagePickerDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onPick: (url: string) => void;
}> = ({ open, onClose, onPick }) => {
  const [categories, setCategories] = useState<ImageCategoryItem[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    imageLibraryService.getCategories().then(setCategories).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const params: Record<string, string> = {};
    if (selectedCat) params.categoryId = selectedCat;
    if (search) params.search = search;
    imageLibraryService.getImages(params)
      .then((res) => { if (!cancelled) setImages(res.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, selectedCat, search]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        await imageLibraryService.uploadImage(files[i]!, selectedCat ?? undefined);
      }
      const params: Record<string, string> = {};
      if (selectedCat) params.categoryId = selectedCat;
      if (search) params.search = search;
      const res = await imageLibraryService.getImages(params);
      setImages(res.data);
      imageLibraryService.getCategories().then(setCategories).catch(() => {});
    } catch { /* noop */ }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const imgUrl = (img: ImageItem) =>
    img.url?.startsWith('http') ? img.url : `${API_BASE}${img.url}`;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: '80vw', maxWidth: 960, height: '75vh', maxHeight: 680 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50/80">
          <div className="flex items-center gap-2">
            <span className="text-lg">🖼️</span>
            <h2 className="text-base font-semibold text-gray-900">Select Image from Library</h2>
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {uploading ? 'Uploading…' : '📤 Upload'}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar – Folder tree */}
          <div className="w-52 border-r border-gray-200 flex flex-col bg-white">
            <div className="px-3 py-2 border-b border-gray-100">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Folders</span>
            </div>
            <div className="flex-1 overflow-y-auto py-1">
              <div
                className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 text-sm transition-colors ${
                  selectedCat === null ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSelectedCat(null)}
              >
                <span className="w-4" />
                <span>📋</span>
                <span>All Images</span>
              </div>
              {categories.map((cat) => (
                <FolderNode key={cat.id} cat={cat} depth={0} selectedId={selectedCat} onSelect={setSelectedCat} />
              ))}
            </div>
          </div>

          {/* Main – Search + Grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Search bar */}
            <div className="px-4 py-2.5 border-b border-gray-100 bg-white">
              <input
                type="text"
                placeholder="Search images..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>

            {/* Image grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading…</div>
              ) : images.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <span className="text-4xl mb-3">🖼️</span>
                  <p className="text-sm font-medium">No images found</p>
                  <p className="text-xs mt-1">{search ? 'Try a different search' : 'Upload some images to get started'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {images.map((img) => {
                    const url = imgUrl(img);
                    return (
                      <div
                        key={img.id}
                        className="group relative border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
                        onClick={() => onPick(url)}
                        title={img.originalName}
                      >
                        <div className="aspect-square bg-gray-50 flex items-center justify-center p-2">
                          <img
                            src={url}
                            alt={img.originalName}
                            className="max-w-full max-h-full object-contain"
                            loading="lazy"
                          />
                        </div>
                        <div className="px-2 py-1.5 border-t border-gray-100">
                          <p className="text-[11px] text-gray-600 truncate font-medium">{img.originalName}</p>
                          <p className="text-[10px] text-gray-400">{(img.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <div className="absolute inset-0 bg-blue-500/0 group-hover:bg-blue-500/5 transition-colors pointer-events-none rounded-lg" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
