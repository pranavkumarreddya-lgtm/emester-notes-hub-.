'use client';

import React, { useState, useRef } from 'react';
import { SubjectCode, MaterialCategory, MaterialUnit, Material } from '../lib/types';
import { SUBJECTS, CATEGORIES, UNITS, MAX_FILE_SIZE_BYTES } from '../lib/constants';
import { validateUploadFile, formatBytes } from '../lib/utils';
import { createClient, isSupabaseConfigured } from '../lib/supabase/client';
import {
  X,
  UploadCloud,
  FileCheck,
  AlertCircle,
  Loader2,
  FileText,
  Image as ImageIcon,
  HelpCircle,
} from 'lucide-react';

interface MaterialUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubject: SubjectCode;
  defaultCategory: MaterialCategory;
  currentFriend: {
    id: string;
    name: string;
    email: string;
  };
  onMaterialUploaded: (newMaterial: Material) => void;
}

export function MaterialUploadModal({
  isOpen,
  onClose,
  defaultSubject,
  defaultCategory,
  currentFriend,
  onMaterialUploaded,
}: MaterialUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState<SubjectCode>(defaultSubject);
  const [category, setCategory] = useState<MaterialCategory>(defaultCategory);
  const [unit, setUnit] = useState<MaterialUnit | ''>('Unit 1');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setErrorMessage(null);
    const validation = validateUploadFile(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file');
      return;
    }
    setSelectedFile(file);

    // Auto-fill title if empty
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    // Auto-suggest category based on type
    if (file.type.startsWith('image/')) {
      setCategory('Photos');
    } else if (file.type === 'application/pdf') {
      if (category === 'Photos') {
        setCategory('PDF Notes');
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Please provide a title for the material.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const configured = isSupabaseConfigured();

      if (configured) {
        // Upload to private Supabase Storage bucket 'study-materials'
        // Path matches RLS rule: (storage.foldername(name))[1] = auth.uid()::text
        const cleanFileName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${currentFriend.id}/${Date.now()}-${cleanFileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('study-materials')
          .upload(storagePath, selectedFile, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`);
        }

        // Insert metadata record into materials table
        const { data: insertData, error: insertError } = await supabase
          .from('materials')
          .insert([
            {
              title: title.trim(),
              description: description.trim() || null,
              subject,
              category,
              unit: unit || null,
              uploader_id: currentFriend.id,
              uploader_name: currentFriend.name,
              original_filename: selectedFile.name,
              storage_path: storagePath,
              file_size: selectedFile.size,
              mime_type: selectedFile.type,
            },
          ])
          .select()
          .single();

        if (insertError) {
          throw new Error(`Database insert failed: ${insertError.message}`);
        }

        // Fetch signed url for immediate preview
        const { data: signedData } = await supabase.storage
          .from('study-materials')
          .createSignedUrl(storagePath, 3600);

        onMaterialUploaded({
          ...insertData,
          download_url: signedData?.signedUrl,
        });
      } else {
        // Local Vault Demo Mode: Store file locally via Object URL / Base64
        const fileBlobUrl = URL.createObjectURL(selectedFile);
        const newMockMaterial: Material = {
          id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: title.trim(),
          description: description.trim() || null,
          subject,
          category,
          unit: unit || null,
          uploader_id: currentFriend.id,
          uploader_name: currentFriend.name,
          original_filename: selectedFile.name,
          storage_path: `local/${selectedFile.name}`,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          download_url: fileBlobUrl,
          created_at: new Date().toISOString(),
        };

        onMaterialUploaded(newMockMaterial);
      }

      onClose();
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMessage(err.message || 'Failed to upload material. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              <span>Upload Semester Material</span>
            </h3>
            <p className="text-xs text-slate-500">
              Uploading as <strong className="text-slate-700">{currentFriend.name}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* File Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Document or Photo
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : selectedFile
                  ? 'border-emerald-400 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex items-center justify-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {formatBytes(selectedFile.size)} • Click to choose a different file
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="mx-auto w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    Click to browse or drag and drop your file here
                  </p>
                  <p className="text-[11px] text-slate-400">
                    PDF, JPG, JPEG, PNG, WEBP (Max 10 MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Material Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 3 Dynamic Programming Detailed Proofs"
              required
              className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Subject & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Subject Course
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectCode)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-slate-900"
              >
                {SUBJECTS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-slate-900"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Unit selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Syllabus Unit (Optional)
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as MaterialUnit | '')}
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-slate-900"
            >
              <option value="">General / Across Syllabus</option>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description or Key Topics (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Highlights professor's board examples on Knapsack and Bellman-Ford."
              rows={2}
              className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-slate-900 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading to Vault...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Save Material</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

