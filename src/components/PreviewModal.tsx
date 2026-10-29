'use client';

import React, { useState, useEffect } from 'react';
import { Material } from '../lib/types';
import { formatBytes, formatDate } from '../lib/utils';
import { createClient, isSupabaseConfigured } from '../lib/supabase/client';
import {
  X,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  User,
  Calendar,
  HardDrive,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface PreviewModalProps {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (material: Material) => void;
}

export function PreviewModal({
  material,
  isOpen,
  onClose,
  onDownload,
}: PreviewModalProps) {
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!material || !isOpen) {
      setActiveUrl(null);
      setLoadError(null);
      return;
    }

    if (material.download_url) {
      setActiveUrl(material.download_url);
      return;
    }

    // If Supabase is configured and material has storage path, request a 1-hour signed URL
    const fetchSignedUrl = async () => {
      if (isSupabaseConfigured() && material.storage_path) {
        setIsLoading(true);
        setLoadError(null);
        try {
          const supabase = createClient();
          const { data, error } = await supabase.storage
            .from('study-materials')
            .createSignedUrl(material.storage_path, 3600);

          if (error) throw error;
          if (data?.signedUrl) {
            setActiveUrl(data.signedUrl);
          } else {
            throw new Error('Could not generate signed access URL.');
          }
        } catch (err: any) {
          console.error('Error fetching signed url:', err);
          setLoadError(err.message || 'Failed to retrieve file from private storage.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchSignedUrl();
  }, [material, isOpen]);

  if (!isOpen || !material) return null;

  const isImage =
    material.mime_type?.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp)$/i.test(material.original_filename);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-800">
                {material.subject}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                {material.category}
              </span>
              {material.unit && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  {material.unit}
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {material.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeUrl && (
              <a
                href={activeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </a>
            )}
            <button
              onClick={() => onDownload(material)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        <div className="flex-1 bg-slate-900 relative overflow-auto flex items-center justify-center p-2 sm:p-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-slate-300">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-xs">Generating secure signed preview URL...</p>
            </div>
          ) : loadError ? (
            <div className="max-w-md p-6 bg-slate-800 rounded-xl border border-slate-700 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Preview Unavailable</h4>
              <p className="text-xs text-slate-300">{loadError}</p>
              <button
                type="button"
                onClick={() => onDownload(material)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Try Direct Download</span>
              </button>
            </div>
          ) : activeUrl ? (
            isImage ? (
              <div className="w-full h-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeUrl}
                  alt={material.title}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
                />
              </div>
            ) : (
              <iframe
                src={`${activeUrl}#view=FitH`}
                title={material.title}
                className="w-full h-full rounded-lg bg-white border-0 shadow-lg"
              />
            )
          ) : (
            <div className="max-w-md p-6 bg-slate-800 rounded-xl border border-slate-700 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">{material.original_filename}</h4>
              <p className="text-xs text-slate-400">
                {material.description || 'Preview placeholder for demo vault item.'}
              </p>
              <button
                type="button"
                onClick={() => onDownload(material)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Sample Note</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Uploaded by {material.uploader_name}</span>
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatBytes(material.file_size)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatDate(material.created_at)}</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {material.original_filename}
          </span>
        </div>
      </div>
    </div>
  );
}

