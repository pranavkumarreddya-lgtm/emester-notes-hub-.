'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SubjectCode, MaterialCategory, MaterialUnit, Material } from '../lib/types';
import { SUBJECTS, CATEGORIES, UNITS } from '../lib/constants';
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
  Plus,
  Trash2,
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
  onMaterialUploaded: (newMaterials: Material | Material[]) => void;
}

export function MaterialUploadModal({
  isOpen,
  onClose,
  defaultSubject,
  defaultCategory,
  currentFriend,
  onMaterialUploaded,
}: MaterialUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState<SubjectCode>(defaultSubject);
  const [category, setCategory] = useState<MaterialCategory>(defaultCategory);
  const [unit, setUnit] = useState<MaterialUnit | ''>('Unit 1');
  const [uploaderName, setUploaderName] = useState('Student');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    currentName: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fresh reset helper: clears all form state so upload is always completely fresh
  const resetForm = () => {
    setSelectedFiles([]);
    setTitle('');
    setDescription('');
    setSubject(defaultSubject);
    setCategory(defaultCategory);
    setUnit('Unit 1');
    setUploaderName('Student');
    setIsUploading(false);
    setUploadProgress(null);
    setErrorMessage(null);
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset form whenever modal opens or default subject/category changes
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, defaultSubject, defaultCategory]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isUploading) return;
    resetForm();
    onClose();
  };

  const handleFilesAdded = (incomingFiles: FileList | File[]) => {
    setErrorMessage(null);
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(incomingFiles).forEach((file) => {
      const validation = validateUploadFile(file);
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
      } else {
        // Prevent duplicate files by name and size
        const exists = selectedFiles.some(
          (f) => f.name === file.name && f.size === file.size
        );
        if (!exists) {
          validFiles.push(file);
        }
      }
    });

    if (errors.length > 0) {
      setErrorMessage(errors.slice(0, 2).join(' | '));
    }

    if (validFiles.length > 0) {
      const nextList = [...selectedFiles, ...validFiles];
      setSelectedFiles(nextList);

      // Auto-populate title from clean filename if currently empty
      if (!title.trim()) {
        if (nextList.length === 1) {
          const cleanName = nextList[0].name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
          setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        } else {
          const firstClean = nextList[0].name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
          setTitle(`${firstClean.charAt(0).toUpperCase() + firstClean.slice(1)} (${nextList.length} files)`);
        }
      }
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const updated = selectedFiles.filter((_, idx) => idx !== indexToRemove);
    setSelectedFiles(updated);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (updated.length === 0) {
      setTitle('');
    } else if (updated.length === 1 && title.includes('files)')) {
      const cleanName = updated[0].name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setErrorMessage('Please select one or more files to upload.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Please provide a title for the material.');
      return;
    }
    if (!category || !CATEGORIES.includes(category)) {
      setErrorMessage('Please select a valid category.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    const authorName = uploaderName.trim() || 'Student';
    const uploadedMaterials: Material[] = [];

    try {
      const supabase = createClient();
      const configured = isSupabaseConfigured();

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress({
          current: i + 1,
          total: selectedFiles.length,
          currentName: file.name,
        });

        // Determine title for this file
        let itemTitle = title.trim();
        if (selectedFiles.length > 1) {
          const cleanBase = title.replace(/\s*\(\d+\s*files\)$/i, '').trim();
          const cleanFileName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
          itemTitle = `${cleanBase} - Part ${i + 1} (${cleanFileName})`;
        }

        if (configured) {
          // Upload directly to public Supabase Storage bucket 'study-materials'
          const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const storagePath = `notes/${Date.now()}-${i}-${cleanFileName}`;

          const { error: uploadError } = await supabase.storage
            .from('study-materials')
            .upload(storagePath, file, {
              cacheControl: '3600',
              upsert: false,
            });

          if (uploadError) {
            if (uploadError.message.toLowerCase().includes('bucket not found')) {
              throw new Error(
                'Bucket "study-materials" not found in Supabase. Please ensure the bucket exists and is set to Public.'
              );
            }
            throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`);
          }

          // Get public URL directly from the public bucket
          const { data: publicUrlData } = supabase.storage
            .from('study-materials')
            .getPublicUrl(storagePath);

          // Insert metadata record into materials table using the EXACT selected category
          const insertPayload: Record<string, any> = {
            title: itemTitle,
            description: description.trim() || null,
            subject,
            category,
            unit: unit || null,
            original_filename: file.name,
            storage_path: storagePath,
          };

          const { data: insertData, error: insertError } = await supabase
            .from('materials')
            .insert([insertPayload])
            .select()
            .single();

          if (insertError) {
            throw new Error(`Database save failed for ${file.name}: ${insertError.message}`);
          }

          uploadedMaterials.push({
            ...insertData,
            uploader_name: insertData.uploader_name || authorName,
            file_size: insertData.file_size || file.size,
            mime_type: insertData.mime_type || file.type,
            download_url: publicUrlData?.publicUrl,
          });
        } else {
          // Local Vault Mode
          const fileBlobUrl = URL.createObjectURL(file);
          uploadedMaterials.push({
            id: `local-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
            title: itemTitle,
            description: description.trim() || null,
            subject,
            category,
            unit: unit || null,
            uploader_id: 'anonymous-student',
            uploader_name: authorName,
            original_filename: file.name,
            storage_path: `local/${file.name}`,
            file_size: file.size,
            mime_type: file.type,
            download_url: fileBlobUrl,
            created_at: new Date().toISOString(),
          });
        }
      }

      onMaterialUploaded(uploadedMaterials);
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Upload error:', err);
      setErrorMessage(err.message || 'Failed to upload material. Please try again.');
      if (uploadedMaterials.length > 0) {
        onMaterialUploaded(uploadedMaterials);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-600" />
              <span>Upload Semester Material</span>
            </h3>
            <p className="text-xs text-slate-500">
              Select multiple photos or documents to upload in one go
            </p>
          </div>
          <button
            onClick={handleClose}
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
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {/* Hidden File Input with 'multiple' enabled */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
            onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
            className="hidden"
          />

          {/* File Selection Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Select Files or Photos <span className="text-rose-500">*</span>
              </label>
              {selectedFiles.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add More</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFiles([]);
                      setTitle('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {selectedFiles.length === 0 ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="mx-auto w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800">
                    Click to browse or drag and drop multiple files here
                  </p>
                  <p className="text-[11px] text-slate-400">
                    PDF, JPG, JPEG, PNG, WEBP (Multiple files supported • Max 10 MB each)
                  </p>
                </div>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl bg-slate-50/70 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium px-1">
                  <span>
                    <strong className="text-slate-900">{selectedFiles.length}</strong> file{selectedFiles.length > 1 ? 's' : ''} ready
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Total: {formatBytes(totalBytes)}
                  </span>
                </div>

                {/* List of chosen files */}
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {selectedFiles.map((file, idx) => {
                    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
                    return (
                      <div
                        key={`${file.name}-${idx}-${file.size}`}
                        className="flex items-center justify-between gap-2.5 p-2 bg-white rounded-lg border border-slate-200/80 shadow-2xs text-left"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                              isPdf
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {isPdf ? (
                              <FileText className="w-3.5 h-3.5" />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800 truncate">
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {formatBytes(file.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    + Add more files / photos
                  </button>
                </div>
              </div>
            )}
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
              placeholder="e.g. 2023 End-Sem Exam Question Paper or Unit 3 Notes"
              required
              className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-slate-900"
            />
            {selectedFiles.length > 1 && (
              <p className="mt-1 text-[11px] text-slate-400">
                Multiple files will be saved with part numbers (e.g. "{title} - Part 1")
              </p>
            )}
          </div>

          {/* Uploader Name field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Your Name / Contributor (Optional)
            </label>
            <input
              type="text"
              value={uploaderName}
              onChange={(e) => setUploaderName(e.target.value)}
              placeholder="e.g. Rahul, Student, Anonymous"
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
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-slate-900 cursor-pointer"
              >
                {SUBJECTS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Category</span>
                <span className="text-[10px] font-normal text-indigo-600">Selected target</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-slate-900 font-medium cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-slate-500 truncate">
                Will be stored in: <strong className="text-indigo-600 font-semibold">{category}</strong>
              </p>
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
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-slate-900 cursor-pointer"
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
              placeholder="e.g. 2023 semester exam paper with solutions, or Unit 3 handwritten formulas."
              rows={2}
              className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white text-slate-900 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
            {uploadProgress ? (
              <div className="flex-1 flex items-center gap-2 text-xs text-indigo-700 font-medium truncate mr-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
                <span className="truncate">
                  Uploading {uploadProgress.current} of {uploadProgress.total}: {uploadProgress.currentName}
                </span>
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || selectedFiles.length === 0}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>
                      {selectedFiles.length > 1
                        ? `Save ${selectedFiles.length} Materials`
                        : 'Save Material'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
