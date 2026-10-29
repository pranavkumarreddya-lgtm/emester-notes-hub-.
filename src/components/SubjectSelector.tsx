'use client';

import React from 'react';
import { SubjectCode } from '../lib/types';
import { SUBJECTS } from '../lib/constants';
import {
  MessageSquare,
  BarChart3,
  Binary,
  Workflow,
  Network,
  BookOpen,
} from 'lucide-react';

interface SubjectSelectorProps {
  selectedSubject: SubjectCode;
  onSelectSubject: (code: SubjectCode) => void;
  materialCounts: Record<SubjectCode, number>;
}

export function SubjectSelector({
  selectedSubject,
  onSelectSubject,
  materialCounts,
}: SubjectSelectorProps) {
  const getIcon = (code: SubjectCode) => {
    switch (code) {
      case 'NLP':
        return <MessageSquare className="w-5 h-5" />;
      case 'DA':
        return <BarChart3 className="w-5 h-5" />;
      case 'DAA':
        return <Binary className="w-5 h-5" />;
      case 'DEVOPS':
        return <Workflow className="w-5 h-5" />;
      case 'CN':
        return <Network className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Semester Subjects</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              5 Courses
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            Select a subject to browse categorized notes, blackboard photos, and questions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {SUBJECTS.map((sub) => {
          const isSelected = selectedSubject === sub.code;
          const count = materialCounts[sub.code] || 0;

          return (
            <button
              key={sub.code}
              type="button"
              onClick={() => onSelectSubject(sub.code)}
              className={`relative text-left p-3.5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${
                isSelected
                  ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-md shadow-indigo-100'
                  : 'bg-white hover:bg-slate-50/90 border-slate-200/90 hover:border-slate-300 shadow-2xs hover:shadow-xs'
              }`}
            >
              {/* Top row: Icon and Code Badge */}
              <div className="flex items-center justify-between w-full mb-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 group-hover:bg-slate-200/80'
                  }`}
                >
                  {getIcon(sub.code)}
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {sub.code}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    {count} {count === 1 ? 'file' : 'files'}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div>
                <h3
                  className={`text-sm font-bold tracking-tight line-clamp-1 transition-colors ${
                    isSelected ? 'text-indigo-950' : 'text-slate-800 group-hover:text-slate-900'
                  }`}
                >
                  {sub.fullName}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                  {sub.description}
                </p>
              </div>

              {/* Active selection bottom indicator */}
              {isSelected && (
                <div className="absolute bottom-0 inset-x-6 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

