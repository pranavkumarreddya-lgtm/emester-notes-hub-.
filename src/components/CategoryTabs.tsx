'use client';

import React from 'react';
import { MaterialCategory, MaterialUnit } from '../lib/types';
import { CATEGORIES, UNITS } from '../lib/constants';
import {
  FileText,
  Image as ImageIcon,
  GraduationCap,
  Search,
  Filter,
  Layers,
  LayoutGrid,
  List,
  X,
} from 'lucide-react';

interface CategoryTabsProps {
  selectedCategory: MaterialCategory;
  onSelectCategory: (category: MaterialCategory) => void;
  selectedUnit: string;
  onSelectUnit: (unit: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryCounts: Record<MaterialCategory, number>;
  viewMode: 'grid' | 'list';
  onToggleViewMode: (mode: 'grid' | 'list') => void;
}

export function CategoryTabs({
  selectedCategory,
  onSelectCategory,
  selectedUnit,
  onSelectUnit,
  searchQuery,
  onSearchChange,
  categoryCounts,
  viewMode,
  onToggleViewMode,
}: CategoryTabsProps) {
  const getCategoryIcon = (category: MaterialCategory) => {
    switch (category) {
      case 'PDF Notes':
        return <FileText className="w-4 h-4" />;
      case 'Photos':
        return <ImageIcon className="w-4 h-4" />;
      case 'Previous Year Question Papers':
        return <GraduationCap className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3.5">
      {/* Top: 3 Main Category Tabs */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto">
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category;
            const count = categoryCounts[category] || 0;

            return (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory(category)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-white text-indigo-900 shadow-xs border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <span
                  className={
                    isSelected
                      ? 'text-indigo-600'
                      : 'text-slate-500'
                  }
                >
                  {getCategoryIcon(category)}
                </span>
                <span>{category}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isSelected
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center justify-end gap-1">
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200/70">
            <button
              type="button"
              onClick={() => onToggleViewMode('grid')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode('list')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
        {/* Unit pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-medium text-slate-400 flex items-center gap-1 pr-1 shrink-0">
            <Layers className="w-3.5 h-3.5" />
            <span>Unit:</span>
          </span>
          <button
            type="button"
            onClick={() => onSelectUnit('ALL')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
              selectedUnit === 'ALL'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 border border-transparent'
            }`}
          >
            All Units
          </button>
          {UNITS.map((unit) => (
            <button
              key={unit}
              type="button"
              onClick={() => onSelectUnit(unit)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer shrink-0 ${
                selectedUnit === unit
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 border border-transparent'
              }`}
            >
              {unit}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[220px] max-w-sm sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes, papers..."
            className="w-full text-xs pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

