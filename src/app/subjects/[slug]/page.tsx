'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { SubjectCode, MaterialCategory, MaterialUnit, Material } from '../../../lib/types';
import { SUBJECTS, CATEGORIES, UNITS } from '../../../lib/constants';
import { createClient, isSupabaseConfigured } from '../../../lib/supabase/client';
import { formatBytes, formatDate } from '../../../lib/utils';

import { Navbar } from '../../../components/Navbar';
import { MaterialUploadModal } from '../../../components/MaterialUploadModal';
import { PreviewModal } from '../../../components/PreviewModal';

import {
  GraduationCap,
  ArrowLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  Download,
  Eye,
  Trash2,
  Upload,
  Search,
  BookOpen,
  Calendar,
  CheckCircle2,
  HardDrive,
  User,
  Sparkles,
  MessageSquareCode,
  BarChart3,
  Binary,
  Workflow,
  Network,
  ExternalLink,
  Tag,
  Lightbulb,
} from 'lucide-react';

export default function SubjectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = ((params?.slug as string) || '').toLowerCase();

  // Find subject config by slug or code
  const subject = useMemo(() => {
    return SUBJECTS.find(
      (s) => s.slug === slug || s.code.toLowerCase() === slug
    );
  }, [slug]);

  // Tab state: 'PDF Notes' | 'Photos' | 'Previous Year Question Papers'
  const [activeTab, setActiveTab] = useState<MaterialCategory>('PDF Notes');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Materials & Supabase state
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load materials for this subject
  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);

    if (!subject) return;

    if (configured) {
      loadSubjectMaterials(subject.code);
    } else {
      try {
        const saved = localStorage.getItem('semester_notes_local_materials');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((m: Material) => m.subject === subject.code);
            setMaterials(filtered);
          }
        }
      } catch (e) {
        console.warn('Could not read from localStorage', e);
      } finally {
        setIsLoading(false);
      }
    }
  }, [subject]);

  const loadSubjectMaterials = async (code: SubjectCode) => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('subject', code)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase subject materials query warning:', error.message);
      } else if (data) {
        setMaterials(data);
      }
    } catch (err) {
      console.error('Failed to load subject data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = {
      'PDF Notes': 0,
      Photos: 0,
      'Previous Year Question Papers': 0,
    };
    materials.forEach((m) => {
      if (counts[m.category] !== undefined) {
        counts[m.category]++;
      }
    });
    return counts;
  }, [materials]);

  // Filtered materials for active tab & search
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (m.category !== activeTab) return false;
      if (selectedUnit !== 'ALL' && m.unit !== selectedUnit) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesDesc = m.description?.toLowerCase().includes(q) || false;
        const matchesFilename = m.original_filename.toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesFilename;
      }
      return true;
    });
  }, [materials, activeTab, selectedUnit, searchQuery]);

  // Handle uploaded materials
  const handleMaterialUploaded = (newItems: Material | Material[]) => {
    const itemsArray = Array.isArray(newItems) ? newItems : [newItems];
    if (itemsArray.length === 0) return;

    // Filter to this subject if any
    const forThisSubject = itemsArray.filter((m) => m.subject === subject?.code);

    if (forThisSubject.length > 0) {
      setMaterials((prev) => {
        const newIds = new Set(forThisSubject.map((m) => m.id));
        const filtered = prev.filter((m) => !newIds.has(m.id));
        return [...forThisSubject, ...filtered];
      });

      // Switch to category of uploaded item
      setActiveTab(forThisSubject[0].category);
      setSelectedUnit('ALL');
      setSearchQuery('');
    }

    if (itemsArray.length === 1) {
      showToast(`"${itemsArray[0].title}" added to ${subject?.code}!`);
    } else {
      showToast(`${itemsArray.length} materials added to ${subject?.code}!`);
    }
  };

  // Handle download
  const handleDownloadMaterial = async (item: Material) => {
    if (isConfigured && item.storage_path && !item.storage_path.startsWith('local/')) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.storage
          .from('study-materials')
          .download(item.storage_path);

        if (error) throw error;
        if (data) {
          const url = window.URL.createObjectURL(data);
          const link = document.createElement('a');
          link.href = url;
          link.download = item.original_filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          showToast(`Downloaded ${item.original_filename}`);
          return;
        }
      } catch (err) {
        console.error('Download error:', err);
      }
    }

    if (item.download_url) {
      const link = document.createElement('a');
      link.href = item.download_url;
      link.download = item.original_filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Downloaded ${item.original_filename}`);
    } else {
      const content = `Semester Notes Hub\n\nSubject: ${item.subject}\nCategory: ${item.category}\nUnit: ${item.unit || 'General'}\nTitle: ${item.title}\nDescription: ${item.description || 'N/A'}\nCreated at: ${new Date(item.created_at).toLocaleString()}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = item.original_filename.endsWith('.pdf')
        ? item.original_filename.replace('.pdf', '_summary.txt')
        : `${item.original_filename}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast(`Downloaded sample for ${item.title}`);
    }
  };

  // Handle delete
  const handleDeleteMaterial = async (item: Material) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) {
      return;
    }

    if (isConfigured) {
      try {
        const supabase = createClient();
        const { error: dbError } = await supabase.from('materials').delete().eq('id', item.id);
        if (dbError) throw dbError;

        await supabase.storage.from('study-materials').remove([item.storage_path]);
        setMaterials((prev) => prev.filter((m) => m.id !== item.id));
        showToast(`Material "${item.title}" deleted.`);
      } catch (err: any) {
        console.error('Delete error:', err);
        alert(err.message || 'Failed to delete material.');
      }
    } else {
      setMaterials((prev) => prev.filter((m) => m.id !== item.id));
      showToast(`Material deleted.`);
    }
  };

  // Subject icon helper
  const renderSubjectIcon = (code: SubjectCode, className = 'w-6 h-6') => {
    switch (code) {
      case 'NLP':
        return <MessageSquareCode className={className} />;
      case 'DA':
        return <BarChart3 className={className} />;
      case 'DAA':
        return <Binary className={className} />;
      case 'DEVOPS':
        return <Workflow className={className} />;
      case 'CN':
        return <Network className={className} />;
    }
  };

  // If subject is invalid, show friendly 404
  if (!subject) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans">
        <Navbar onOpenUpload={() => setIsUploadOpen(true)} />
        <div className="flex-1 max-w-lg mx-auto px-4 py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Subject Not Found</h2>
          <p className="text-sm text-slate-500">
            The course &quot;{slug}&quot; does not exist. Choose one of our 5 official semester subjects:
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {SUBJECTS.map((s) => (
              <Link
                key={s.code}
                href={`/subjects/${s.slug}`}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                {s.code} – {s.fullName}
              </Link>
            ))}
          </div>
          <div className="pt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Related subjects (excluding current)
  const relatedSubjectsList = SUBJECTS.filter((s) => s.code !== subject.code);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar onOpenUpload={() => setIsUploadOpen(true)} />

      {/* Main Page Content */}
      <main className="flex-1 w-full pb-16">
        
        {/* ================= BREADCRUMB NAVIGATION ================= */}
        <div className="border-b border-slate-100 bg-slate-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <Link href="/#subjects" className="hover:text-blue-600 transition-colors">
                Subjects
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-slate-900 font-bold">{subject.code}</span>
            </nav>
          </div>
        </div>

        {/* ================= SUBJECT HERO SECTION ================= */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 via-slate-50/30 to-white border-b border-slate-100 py-8 sm:py-12">
          
          {/* Subtle background glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              {/* Left: Icon, Subject Code, Full Name, Description */}
              <div className="flex items-start gap-4 sm:gap-6">
                
                {/* Subject-specific Big Icon Box */}
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${subject.iconBg}`}>
                  {renderSubjectIcon(subject.code, 'w-8 h-8 sm:w-10 sm:h-10')}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                      {subject.code}
                    </h1>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100/80 text-blue-700 border border-blue-200">
                      Semester Course
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-slate-700">
                    {subject.fullName}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                    {subject.description}
                  </p>
                </div>
              </div>

              {/* Right: Upload Button for this Subject */}
              <div className="flex items-center gap-3 self-start md:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload for {subject.code}</span>
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* ================= TABS NAVIGATION ROW ================= */}
        <div className="border-b border-slate-200/80 bg-white sticky top-16 sm:top-20 z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 sm:gap-3 py-3 overflow-x-auto no-scrollbar">
              
              {/* 1. Notes Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('PDF Notes');
                  setSelectedUnit('ALL');
                }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'PDF Notes'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Notes</span>
                <span className={`px-2 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'PDF Notes' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tabCounts['PDF Notes']}
                </span>
              </button>

              {/* 2. Class Photos Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('Photos');
                  setSelectedUnit('ALL');
                }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'Photos'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Class Photos</span>
                <span className={`px-2 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'Photos' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tabCounts['Photos']}
                </span>
              </button>

              {/* 3. Question Papers Tab */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('Previous Year Question Papers');
                  setSelectedUnit('ALL');
                }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'Previous Year Question Papers'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>Question Papers</span>
                <span className={`px-2 py-0.2 rounded-full text-[10px] ${
                  activeTab === 'Previous Year Question Papers' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {tabCounts['Previous Year Question Papers']}
                </span>
              </button>

            </div>
          </div>
        </div>

        {/* ================= MAIN CONTENT + SIDEBAR ================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ================= LEFT / MAIN COLUMN (TABS CONTENT) ================= */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Tab Header & Search Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    {activeTab === 'PDF Notes' && <FileText className="w-5 h-5 text-blue-600" />}
                    {activeTab === 'Photos' && <ImageIcon className="w-5 h-5 text-blue-600" />}
                    {activeTab === 'Previous Year Question Papers' && <HelpCircle className="w-5 h-5 text-blue-600" />}
                    <span>
                      {activeTab === 'PDF Notes'
                        ? 'Notes'
                        : activeTab === 'Photos'
                        ? 'Classroom Whiteboard Photos'
                        : 'Previous Year Question Papers'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {activeTab === 'PDF Notes'
                      ? 'Download subject-wise notes in PDF format.'
                      : activeTab === 'Photos'
                      ? 'High-res photos captured during lectures and blackboard sessions.'
                      : 'End-semester and mid-term exam question papers with solutions.'}
                  </p>
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeTab.toLowerCase()}...`}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white text-slate-900"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Syllabus Unit Pills Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Units:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedUnit('ALL')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    selectedUnit === 'ALL'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  All Units
                </button>
                {UNITS.map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setSelectedUnit(unit)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      selectedUnit === unit
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>

              {/* Materials Grid matching the reference image layout */}
              {isLoading ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">Loading materials from vault...</p>
                </div>
              ) : filteredMaterials.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredMaterials.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        {/* Top: Red PDF / Photo Icon + Title */}
                        <div className="flex items-start gap-3">
                          
                          {/* File Type Badge (Reference image style: Red square with PDF) */}
                          <div
                            className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 font-black text-[10px] tracking-tight shadow-xs ${
                              item.category === 'Photos'
                                ? 'bg-sky-100 text-sky-700'
                                : item.category === 'Previous Year Question Papers'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {item.category === 'Photos' ? (
                              <ImageIcon className="w-5 h-5" />
                            ) : item.category === 'Previous Year Question Papers' ? (
                              <HelpCircle className="w-5 h-5" />
                            ) : (
                              <>
                                <FileText className="w-4 h-4" />
                                <span className="text-[9px] -mt-0.5">PDF</span>
                              </>
                            )}
                          </div>

                          {/* Title & Unit */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              {item.unit && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                                  {item.unit}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400">
                                {formatBytes(item.file_size)}
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                              {item.title}
                            </h4>
                          </div>
                        </div>

                        {/* Description */}
                        {item.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        {/* Original Filename & Contributor */}
                        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-50">
                          <span className="truncate max-w-[170px]" title={item.original_filename}>
                            {item.original_filename}
                          </span>
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      </div>

                      {/* Bottom Action Buttons */}
                      <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setPreviewMaterial(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDownloadMaterial(item)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl transition-all cursor-pointer shadow-2xs"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteMaterial(item)}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              ) : (
                /* Empty State */
                <div className="bg-slate-50/60 border border-dashed border-slate-200 rounded-3xl p-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    No {activeTab.toLowerCase()} found for {subject.code}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {searchQuery
                      ? `No materials matched "${searchQuery}". Clear your search.`
                      : `Be the first to contribute ${activeTab} for ${subject.fullName}.`}
                  </p>
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="px-4 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Clear Search Filter
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsUploadOpen(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Notes for {subject.code}</span>
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* ================= RIGHT SIDEBAR ================= */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Card 1: Quick Links */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Quick Links
                </h4>

                <div className="space-y-1 text-xs">
                  {/* Syllabus */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('PDF Notes');
                      setSelectedUnit('ALL');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                      <span className="font-semibold">Complete Syllabus</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Important Questions */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('Previous Year Question Papers');
                      setSelectedUnit('ALL');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                      <span className="font-semibold">Important Questions</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Previous Year Papers */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('Previous Year Question Papers');
                      setSelectedUnit('ALL');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <GraduationCap className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                      <span className="font-semibold">Previous Year Papers</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Class Photos */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('Photos');
                      setSelectedUnit('ALL');
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                      <span className="font-semibold">Lecture Photos</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Card 2: Core Syllabus Topics for this Subject */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>Key Focus Topics</span>
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Exam Prep</span>
                </div>

                <div className="space-y-2">
                  {subject.quickTopics.map((topic, i) => (
                    <div
                      key={topic}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2 text-xs text-slate-700 font-medium"
                    >
                      <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Related Subjects */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Related Subjects
                </h4>

                <div className="space-y-1.5">
                  {relatedSubjectsList.map((rel) => (
                    <Link
                      key={rel.code}
                      href={`/subjects/${rel.slug}`}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${rel.iconBg}`}>
                          {renderSubjectIcon(rel.code, 'w-4 h-4')}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {rel.code}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            {rel.fullName}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>

      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white border-t border-slate-200 py-8 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-900">Semester Notes Hub</span>
            <span>•</span>
            <span>{subject.fullName}</span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="hover:text-blue-600">
              Home
            </Link>
            <span>•</span>
            <Link href="/#subjects" className="hover:text-blue-600">
              All Subjects
            </Link>
          </div>
        </div>
      </footer>

      {/* ================= MODALS ================= */}
      {isUploadOpen && (
        <MaterialUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          defaultSubject={subject.code}
          defaultCategory={activeTab}
          currentFriend={{
            id: 'community-student',
            name: 'Student',
            email: 'student@college.edu',
          }}
          onMaterialUploaded={handleMaterialUploaded}
        />
      )}

      <PreviewModal
        material={previewMaterial}
        isOpen={Boolean(previewMaterial)}
        onClose={() => setPreviewMaterial(null)}
        onDownload={handleDownloadMaterial}
      />
    </div>
  );
}
