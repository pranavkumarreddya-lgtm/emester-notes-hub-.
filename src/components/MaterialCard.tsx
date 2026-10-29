'use client';

import React from 'react';
import { Material } from '../lib/types';
import { formatBytes, formatDate } from '../lib/utils';
import {
  FileText,
  Image as ImageIcon,
  HelpCircle,
  Download,
  Eye,
  Trash2,
  Calendar,
  HardDrive,
  User,
} from 'lucide-react';

interface MaterialCardProps {
  material: Material;
  currentUserId: string;
  isAuthorized: boolean;
  viewMode: 'grid' | 'list';
  onPreview: (material: Material) => void;
  onDownload: (material: Material) => void;
  onDelete: (material: Material) => void;
}

export function MaterialCard({
  material,
  currentUserId,
  isAuthorized,
  viewMode,
  onPreview,
  onDownload,
  onDelete,
}: MaterialCardProps) {
  const isOwner = true; // Open community access - any user can delete with confirmation

  const getCategoryTheme = () => {
    switch (material.category) {
      case 'PDF Notes':
        return {
          icon: <FileText className="w-4 h-4 text-rose-600" />,
          badge: 'bg-rose-50 text-rose-700 border-rose-200/80',
          filePill: 'bg-rose-50 text-rose-700',
        };
      case 'Photos':
        return {
          icon: <ImageIcon className="w-4 h-4 text-blue-600" />,
          badge: 'bg-blue-50 text-blue-700 border-blue-200/80',
          filePill: 'bg-blue-50 text-blue-700',
        };
      case 'Important Questions':
        return {
          icon: <HelpCircle className="w-4 h-4 text-amber-600" />,
          badge: 'bg-amber-50 text-amber-800 border-amber-200/80',
          filePill: 'bg-amber-50 text-amber-800',
        };
    }
  };

  const theme = getCategoryTheme();

  if (viewMode === 'list') {
    return (
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 group">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 shrink-0">
            {theme.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${theme.badge}`}>
                {material.category}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {material.subject}
              </span>
              {material.unit && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {material.unit}
                </span>
              )}
            </div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
              {material.title}
            </h4>
            {material.description && (
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                {material.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2">
              <span className="flex items-center gap-1 font-medium text-slate-600">
                <User className="w-3 h-3 text-slate-400" />
                {material.uploader_name}
              </span>
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                {formatBytes(material.file_size)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(material.created_at)}
              </span>
              <span className="truncate max-w-[200px] text-slate-400 hidden lg:inline">
                {material.original_filename}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <button
            type="button"
            onClick={() => onPreview(material)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
          <button
            type="button"
            onClick={() => onDownload(material)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
          {isAuthorized && isOwner && (
            <button
              type="button"
              onClick={() => onDelete(material)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete material"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group relative">
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${theme.badge}`}>
              {theme.icon}
              <span>{material.category}</span>
            </span>
            {material.unit && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                {material.unit}
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
            {material.subject}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
          {material.title}
        </h4>

        {/* Description */}
        {material.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
            {material.description}
          </p>
        )}

        {/* File Metadata Box */}
        <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 space-y-1 text-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="truncate max-w-[180px] font-medium text-slate-700" title={material.original_filename}>
              {material.original_filename}
            </span>
            <span className="shrink-0 font-mono text-[11px] text-slate-500">
              {formatBytes(material.file_size)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <User className="w-3 h-3 text-slate-400" />
              {material.uploader_name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(material.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPreview(material)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
          <button
            type="button"
            onClick={() => onDownload(material)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>

        {isAuthorized && isOwner && (
          <button
            type="button"
            onClick={() => onDelete(material)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete material"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

