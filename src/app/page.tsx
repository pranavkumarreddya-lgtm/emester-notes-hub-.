'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { SubjectCode, MaterialCategory, Material } from '../lib/types';
import { SUBJECTS, CATEGORIES } from '../lib/constants';
import { INITIAL_MOCK_MATERIALS } from '../lib/mock-data';
import { createClient, isSupabaseConfigured } from '../lib/supabase/client';
import { formatBytes, formatDate } from '../lib/utils';

import { Navbar } from '../components/Navbar';
import { MaterialUploadModal } from '../components/MaterialUploadModal';
import { PreviewModal } from '../components/PreviewModal';

import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  BookOpen,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  Download,
  Eye,
  Trash2,
  Upload,
  Calendar,
  CheckCircle2,
  HardDrive,
  User,
  MessageSquareCode,
  BarChart3,
  Binary,
  Workflow,
  Network,
  Search,
} from 'lucide-react';

export default function HomePage() {
  const [materials, setMaterials] = useState<Material[]>(INITIAL_MOCK_MATERIALS);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedUploadSubject, setSelectedUploadSubject] = useState<SubjectCode>('NLP');
  const [selectedUploadCategory, setSelectedUploadCategory] = useState<MaterialCategory>('PDF Notes');
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  // Search & Filter state for recent materials section
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [homeFilterCategory, setHomeFilterCategory] = useState<'ALL' | MaterialCategory>('ALL');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check Supabase status and load data
  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);

    if (configured) {
      loadSupabaseData();
    } else {
      try {
        const saved = localStorage.getItem('semester_notes_local_materials');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMaterials(parsed);
          }
        }
      } catch (e) {
        console.warn('Could not read from localStorage', e);
      }
    }
  }, []);

  const loadSupabaseData = async () => {
    setIsLoadingMaterials(true);
    try {
      const supabase = createClient();
      const { data: dbMaterials, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase materials query warning:', error.message);
      } else if (dbMaterials) {
        setMaterials(dbMaterials);
      }
    } catch (err) {
      console.error('Failed to load data from Supabase:', err);
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  // Compute stats across all materials
  const stats = useMemo(() => {
    const counts = {
      pdfNotes: 0,
      photos: 0,
      questionPapers: 0,
      bySubject: {
        NLP: 0,
        DA: 0,
        DAA: 0,
        DEVOPS: 0,
        CN: 0,
      } as Record<SubjectCode, number>,
    };

    materials.forEach((m) => {
      if (m.category === 'PDF Notes') counts.pdfNotes++;
      else if (m.category === 'Photos') counts.photos++;
      else if (m.category === 'Previous Year Question Papers') counts.questionPapers++;

      if (counts.bySubject[m.subject] !== undefined) {
        counts.bySubject[m.subject]++;
      }
    });

    return counts;
  }, [materials]);

  // Handle uploaded materials
  const handleMaterialUploaded = (newItems: Material | Material[]) => {
    const itemsArray = Array.isArray(newItems) ? newItems : [newItems];
    if (itemsArray.length === 0) return;

    setMaterials((prev) => {
      const newIds = new Set(itemsArray.map((m) => m.id));
      const filtered = prev.filter((m) => !newIds.has(m.id));
      const updated = [...itemsArray, ...filtered];
      if (!isConfigured) {
        try {
          localStorage.setItem('semester_notes_local_materials', JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });

    if (itemsArray.length === 1) {
      showToast(`"${itemsArray[0].title}" saved to ${itemsArray[0].subject}!`);
    } else {
      showToast(`${itemsArray.length} materials successfully saved!`);
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
      setMaterials((prev) => {
        const updated = prev.filter((m) => m.id !== item.id);
        try {
          localStorage.setItem('semester_notes_local_materials', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
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

  // Filtered recent materials
  const recentFilteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (homeFilterCategory !== 'ALL' && m.category !== homeFilterCategory) {
        return false;
      }
      if (homeSearchQuery.trim()) {
        const q = homeSearchQuery.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesSubject = m.subject.toLowerCase().includes(q);
        const matchesFile = m.original_filename.toLowerCase().includes(q);
        return matchesTitle || matchesSubject || matchesFile;
      }
      return true;
    }).slice(0, 10);
  }, [materials, homeFilterCategory, homeSearchQuery]);

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
      <Navbar
        onOpenUpload={() => {
          setSelectedUploadSubject('NLP');
          setSelectedUploadCategory('PDF Notes');
          setIsUploadOpen(true);
        }}
        onSearchClick={() => {
          const el = document.getElementById('recent-vault');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Body */}
      <main className="flex-1 w-full">
        
        {/* ================= HERO SECTION ================= */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-blue-50/20 to-white pt-8 pb-12 sm:pt-14 sm:pb-16 border-b border-slate-100/80">
          
          {/* Subtle background glow circles */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-10 w-96 h-96 bg-indigo-300/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Column: Heading & Value Proposition */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                
                {/* Pill Tag */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/70 text-blue-700 text-xs font-bold border border-blue-200/80 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Your Semester, Organized</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
                  Everything you need <br className="hidden sm:inline" />
                  to <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">ace</span> the semester.
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  Notes, PDF&apos;s, Class Photos and Question Papers for all subjects — in one place.
                </p>

                {/* Hero CTA Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                  <a
                    href="#subjects"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Browse Subjects</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById('recent-vault');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <span>Explore Community</span>
                  </button>
                </div>

              </div>

              {/* Right Column: Hero Illustration / Graphic Stack */}
              <div className="lg:col-span-5 flex items-center justify-center">
                <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
                  
                  {/* Decorative glowing backplate */}
                  <div className="absolute inset-4 rounded-3xl bg-gradient-to-tr from-blue-100 to-indigo-100/50 shadow-inner blur-xl" />

                  {/* 3D-styled Academic Illustration Card */}
                  <div className="relative z-10 w-full bg-white/90 backdrop-blur-sm border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-900/5 text-center flex flex-col items-center justify-center space-y-4">
                    
                    {/* Big Graduation Cap & Book Centerpiece */}
                    <div className="relative">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                        <GraduationCap className="w-14 h-14" />
                      </div>
                      
                      {/* Floating Badge 1 */}
                      <div className="absolute -top-3 -right-6 bg-white px-3 py-1.5 rounded-xl shadow-md border border-slate-100 text-[11px] font-bold text-blue-600 flex items-center gap-1.5 animate-bounce">
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                        <span>PDF Ready</span>
                      </div>

                      {/* Floating Badge 2 */}
                      <div className="absolute -bottom-2 -left-6 bg-white px-3 py-1.5 rounded-xl shadow-md border border-slate-100 text-[11px] font-bold text-emerald-600 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Public Vault</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <h3 className="text-base font-extrabold text-slate-900">
                        Semester Study Repository
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Centralized &amp; instant access to lecture notes across all 5 courses
                      </p>
                    </div>

                    {/* Quick Subject Avatars bar */}
                    <div className="flex items-center gap-2 pt-1">
                      {SUBJECTS.map((s) => (
                        <Link
                          key={s.code}
                          href={`/subjects/${s.slug}`}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-extrabold transition-transform hover:scale-110 shadow-xs ${s.iconBg}`}
                          title={`${s.code} - ${s.fullName}`}
                        >
                          {s.code}
                        </Link>
                      ))}
                    </div>

                  </div>

                </div>
              </div>

            </div>

            {/* ================= STATS PILL / BAR ================= */}
            <div className="mt-10 sm:mt-14 max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl sm:rounded-full border border-slate-200/90 shadow-md shadow-slate-100 p-3 sm:px-6 sm:py-3.5 flex flex-wrap items-center justify-around gap-4 text-xs sm:text-sm font-semibold text-slate-700">
                
                {/* 5 Subjects */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span>
                    <strong className="text-slate-950 font-bold">5</strong> Core Subjects
                  </span>
                </div>

                <div className="hidden sm:block w-px h-5 bg-slate-200" />

                {/* PDF Notes */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span>
                    <strong className="text-slate-950 font-bold">{stats.pdfNotes}</strong> PDF Notes
                  </span>
                </div>

                <div className="hidden sm:block w-px h-5 bg-slate-200" />

                {/* Class Photos */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <span>
                    <strong className="text-slate-950 font-bold">{stats.photos}</strong> Class Photos
                  </span>
                </div>

                <div className="hidden sm:block w-px h-5 bg-slate-200" />

                {/* Question Papers */}
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <span>
                    <strong className="text-slate-950 font-bold">{stats.questionPapers}</strong> Question Papers
                  </span>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ================= SUBJECTS SECTION (CORE ROUTING HUB) ================= */}
        <section id="subjects" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Subjects
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Choose your subject to explore notes, photos and more.
              </p>
            </div>

            <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
              <span>5 Dedicated Course Pages</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* 5 Responsive Subject Cards matching reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {SUBJECTS.map((sub) => {
              const materialCount = stats.bySubject[sub.code] || 0;
              return (
                <Link
                  key={sub.code}
                  href={`/subjects/${sub.slug}`}
                  className="group bg-white border border-slate-200/90 hover:border-blue-400 rounded-2xl p-5 shadow-xs hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* Top row: Subject Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${sub.iconBg}`}>
                        {renderSubjectIcon(sub.code, 'w-6 h-6')}
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {materialCount} files
                      </span>
                    </div>

                    {/* Subject Code */}
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                      {sub.code}
                    </h3>

                    {/* Subject Full Name */}
                    <p className="text-xs font-semibold text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {sub.fullName}
                    </p>
                  </div>

                  {/* Bottom Action: Circle Arrow Button */}
                  <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="text-[11px] text-slate-400 group-hover:text-blue-600 transition-colors">
                      Open Notes
                    </span>
                    <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-blue-600 text-slate-600 group-hover:text-white flex items-center justify-center transition-colors">
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

        </section>

        {/* ================= RECENT MATERIALS STREAM ================= */}
        <section id="recent-vault" className="bg-slate-50/70 border-t border-slate-200/80 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            
            {/* Header + Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>Recent Community Uploads</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Latest study resources added across all semester subjects
                </p>
              </div>

              {/* Search & Category Pills */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Search input */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={homeSearchQuery}
                    onChange={(e) => setHomeSearchQuery(e.target.value)}
                    placeholder="Search recent files..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 w-44 sm:w-56"
                  />
                </div>

                {/* Category toggles */}
                {(['ALL', 'PDF Notes', 'Photos', 'Previous Year Question Papers'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setHomeFilterCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      homeFilterCategory === cat
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat === 'ALL' ? 'All' : cat === 'Previous Year Question Papers' ? 'Papers' : cat}
                  </button>
                ))}

              </div>
            </div>

            {/* Materials Grid / List */}
            {recentFilteredMaterials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentFilteredMaterials.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: Category badge & Subject Pill linking to subject page */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <Link
                          href={`/subjects/${item.subject.toLowerCase()}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <span>{item.subject}</span>
                          <span className="text-slate-400">›</span>
                        </Link>

                        <div className="flex items-center gap-1.5">
                          {item.unit && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                              {item.unit}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-slate-200 text-slate-600">
                            {item.category === 'Previous Year Question Papers' ? 'PYQ' : item.category}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                        {item.title}
                      </h4>

                      {/* Description */}
                      {item.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="mt-3 p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                        <span className="truncate max-w-[150px] font-medium" title={item.original_filename}>
                          {item.original_filename}
                        </span>
                        <span>{formatBytes(item.file_size)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewMaterial(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadMaterial(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteMaterial(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete material"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-10 text-center space-y-3 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No materials found</h4>
                <p className="text-xs text-slate-500">
                  {homeSearchQuery
                    ? `No materials matched "${homeSearchQuery}". Try clearing search.`
                    : 'Be the first to contribute notes for this semester!'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Now</span>
                </button>
              </div>
            )}

          </div>
        </section>

      </main>

      {/* ================= MODERN FOOTER ================= */}
      <footer className="bg-white border-t border-slate-200 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-sm">Semester Notes Hub</span>
              <p className="text-[11px] text-slate-400">Collaborative Academic Vault</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600">
            {SUBJECTS.map((s) => (
              <Link key={s.code} href={`/subjects/${s.slug}`} className="hover:text-blue-600 transition-colors">
                {s.code}
              </Link>
            ))}
          </div>

          <p className="text-slate-400 text-center sm:text-right">
            Powered by Next.js &amp; Supabase Storage
          </p>
        </div>
      </footer>

      {/* ================= MODALS ================= */}
      {isUploadOpen && (
        <MaterialUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          defaultSubject={selectedUploadSubject}
          defaultCategory={selectedUploadCategory}
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
