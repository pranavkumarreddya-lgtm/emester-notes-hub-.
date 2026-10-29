'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { SubjectCode, MaterialCategory, MaterialUnit, Material } from '../lib/types';
import { SUBJECTS, CATEGORIES, UNITS } from '../lib/constants';
import { INITIAL_MOCK_MATERIALS, MOCK_APPROVED_MEMBERS } from '../lib/mock-data';
import { createClient, isSupabaseConfigured } from '../lib/supabase/client';

import { Navbar } from '../components/Navbar';
import { Banner } from '../components/Banner';
import { SubjectSelector } from '../components/SubjectSelector';
import { CategoryTabs } from '../components/CategoryTabs';
import { MaterialCard } from '../components/MaterialCard';
import { MaterialUploadModal } from '../components/MaterialUploadModal';
import { AuthModal } from '../components/AuthModal';
import { PreviewModal } from '../components/PreviewModal';
import { SqlSetupModal } from '../components/SqlSetupModal';

import {
  FileText,
  Upload,
  BookOpen,
  Sparkles,
  Search,
  Layers,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const [selectedSubject, setSelectedSubject] = useState<SubjectCode>('NLP');
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory>('PDF Notes');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Supabase Configuration status
  const [isConfigured, setIsConfigured] = useState(false);

  // Active friend / user
  const [currentFriend, setCurrentFriend] = useState<{
    id: string;
    name: string;
    email: string;
    isAuthorized: boolean;
  }>({
    id: MOCK_APPROVED_MEMBERS[0].user_id || 'user-hemanth-1',
    name: MOCK_APPROVED_MEMBERS[0].display_name,
    email: MOCK_APPROVED_MEMBERS[0].email,
    isAuthorized: true,
  });

  // Materials list
  const [materials, setMaterials] = useState<Material[]>(INITIAL_MOCK_MATERIALS);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  // Toast / notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initialize and check Supabase auth & data
  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);

    if (configured) {
      loadSupabaseData();
    } else {
      // Load any previously uploaded local materials from localStorage
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

      // Check current logged in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Check if user is in approved_members table
        const { data: memberData } = await supabase
          .from('approved_members')
          .select('*')
          .eq('email', user.email || '')
          .single();

        setCurrentFriend({
          id: user.id,
          name:
            memberData?.display_name ||
            user.user_metadata?.display_name ||
            user.email?.split('@')[0] ||
            'Authorized Friend',
          email: user.email || '',
          isAuthorized: Boolean(memberData),
        });
      }

      // Fetch materials from Supabase
      const { data: dbMaterials, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase materials query warning:', error.message);
      } else if (dbMaterials && dbMaterials.length > 0) {
        setMaterials(dbMaterials);
      }
    } catch (err) {
      console.error('Failed to load data from Supabase:', err);
    } finally {
      setIsLoadingMaterials(false);
    }
  };

  // Handle new uploaded material
  const handleMaterialUploaded = (newMaterial: Material) => {
    setMaterials((prev) => {
      const updated = [newMaterial, ...prev];
      if (!isConfigured) {
        try {
          localStorage.setItem(
            'semester_notes_local_materials',
            JSON.stringify(updated)
          );
        } catch (e) {
          console.warn('Failed to save to localStorage', e);
        }
      }
      return updated;
    });

    // Automatically switch to subject and category of uploaded file
    setSelectedSubject(newMaterial.subject);
    setSelectedCategory(newMaterial.category);
    showToast(`"${newMaterial.title}" uploaded successfully!`);
  };

  // Handle material deletion
  const handleDeleteMaterial = async (item: Material) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) {
      return;
    }

    if (isConfigured) {
      try {
        const supabase = createClient();
        // Delete from database
        const { error: dbError } = await supabase
          .from('materials')
          .delete()
          .eq('id', item.id);

        if (dbError) throw dbError;

        // Delete from storage
        await supabase.storage.from('study-materials').remove([item.storage_path]);

        setMaterials((prev) => prev.filter((m) => m.id !== item.id));
        showToast(`Material "${item.title}" deleted.`);
      } catch (err: any) {
        console.error('Delete error:', err);
        alert(err.message || 'Failed to delete material.');
      }
    } else {
      // Local mode
      setMaterials((prev) => {
        const updated = prev.filter((m) => m.id !== item.id);
        try {
          localStorage.setItem(
            'semester_notes_local_materials',
            JSON.stringify(updated)
          );
        } catch (e) {}
        return updated;
      });
      showToast(`Material deleted from local vault.`);
    }
  };

  // Handle material download
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
      } catch (err: any) {
        console.error('Download error:', err);
        // Fallback to signed URL if direct blob fails
      }
    }

    // Fallback: If download_url or demo sample
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
      // Generate synthetic sample file for demo purposes
      const content = `Semester Notes Hub\n\nSubject: ${item.subject}\nCategory: ${item.category}\nUnit: ${item.unit || 'General'}\nTitle: ${item.title}\nDescription: ${item.description || 'N/A'}\nUploaded by: ${item.uploader_name} on ${new Date(item.created_at).toLocaleString()}\n\n[Persistent file uploaded to private storage bucket 'study-materials']`;
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
      showToast(`Downloaded sample file for ${item.title}`);
    }
  };

  // Calculate subject counts
  const materialCounts = useMemo(() => {
    const counts: Record<SubjectCode, number> = {
      NLP: 0,
      DA: 0,
      DAA: 0,
      DEVOPS: 0,
      CN: 0,
    };
    materials.forEach((m) => {
      if (counts[m.subject] !== undefined) {
        counts[m.subject]++;
      }
    });
    return counts;
  }, [materials]);

  // Calculate category counts for current subject
  const categoryCounts = useMemo(() => {
    const counts: Record<MaterialCategory, number> = {
      'PDF Notes': 0,
      Photos: 0,
      'Important Questions': 0,
    };
    materials
      .filter((m) => m.subject === selectedSubject)
      .forEach((m) => {
        if (counts[m.category] !== undefined) {
          counts[m.category]++;
        }
      });
    return counts;
  }, [materials, selectedSubject]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (m.subject !== selectedSubject) return false;
      if (m.category !== selectedCategory) return false;
      if (selectedUnit !== 'ALL' && m.unit !== selectedUnit) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesDesc = m.description?.toLowerCase().includes(q) || false;
        const matchesUploader = m.uploader_name.toLowerCase().includes(q);
        const matchesFile = m.original_filename.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesUploader && !matchesFile) {
          return false;
        }
      }

      return true;
    });
  }, [materials, selectedSubject, selectedCategory, selectedUnit, searchQuery]);

  const activeSubjectConfig = SUBJECTS.find((s) => s.code === selectedSubject);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <Banner
        isConfigured={isConfigured}
        onOpenSetup={() => setIsSetupOpen(true)}
      />

      {/* Main Navbar */}
      <Navbar
        currentFriend={currentFriend}
        isConfigured={isConfigured}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenSetup={() => setIsSetupOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Course Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold border border-indigo-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                <span>3 Friends Shared Vault</span>
                <span>•</span>
                <span>Persistent Across Devices</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Semester Notes & Study Repository
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
                Centralized archive for high-scoring PDF notes, classroom whiteboard photos, and recurring exam questions across our 5 core subjects.
              </p>
            </div>

            {/* Quick Upload CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                disabled={!currentFriend.isAuthorized}
                className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-all cursor-pointer ${
                  currentFriend.isAuthorized
                    ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-600/30 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Upload New Material</span>
              </button>
            </div>
          </div>
        </div>

        {/* 1. Five Subjects Selector */}
        <section>
          <SubjectSelector
            selectedSubject={selectedSubject}
            onSelectSubject={(sub) => {
              setSelectedSubject(sub);
              setSelectedUnit('ALL');
            }}
            materialCounts={materialCounts}
          />
        </section>

        {/* 2. Category Tabs & Unit Filters */}
        <section className="space-y-4">
          <CategoryTabs
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedUnit={selectedUnit}
            onSelectUnit={setSelectedUnit}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categoryCounts={categoryCounts}
            viewMode={viewMode}
            onToggleViewMode={setViewMode}
          />

          {/* Active section summary header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="font-bold text-slate-800">{activeSubjectConfig?.fullName}</span>
              <span>›</span>
              <span className="font-semibold text-indigo-600">{selectedCategory}</span>
              {selectedUnit !== 'ALL' && (
                <>
                  <span>›</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-semibold">
                    {selectedUnit}
                  </span>
                </>
              )}
              <span>•</span>
              <span>
                {filteredMaterials.length}{' '}
                {filteredMaterials.length === 1 ? 'material' : 'materials'} available
              </span>
            </div>
          </div>

          {/* 3. Materials List / Grid */}
          {filteredMaterials.length > 0 ? (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-3'
              }
            >
              {filteredMaterials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  currentUserId={currentFriend.id}
                  isAuthorized={currentFriend.isAuthorized}
                  viewMode={viewMode}
                  onPreview={(item) => setPreviewMaterial(item)}
                  onDownload={handleDownloadMaterial}
                  onDelete={handleDeleteMaterial}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-10 text-center space-y-3 max-w-lg mx-auto my-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                No materials found in this category
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {searchQuery
                  ? `No items match the search query "${searchQuery}". Try clearing filters.`
                  : `Be the first to upload ${selectedCategory} for ${activeSubjectConfig?.fullName}.`}
              </p>
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Search
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(true)}
                  disabled={!currentFriend.isAuthorized}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload for {selectedSubject}</span>
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-slate-800">Semester Notes Hub</span>
            <span>•</span>
            <span>3 Authorized Friends Vault</span>
          </div>
          <p className="text-slate-400">
            Powered by Next.js App Router, Supabase Auth & PostgreSQL RLS
          </p>
        </div>
      </footer>

      {/* Modals */}
      <MaterialUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        defaultSubject={selectedSubject}
        defaultCategory={selectedCategory}
        currentFriend={currentFriend}
        onMaterialUploaded={handleMaterialUploaded}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        isConfigured={isConfigured}
        currentFriend={currentFriend}
        onSelectLocalFriend={(friend) => {
          setCurrentFriend(friend);
          showToast(`Active friend switched to ${friend.name}`);
        }}
        onSupabaseAuthChange={loadSupabaseData}
      />

      <PreviewModal
        material={previewMaterial}
        isOpen={Boolean(previewMaterial)}
        onClose={() => setPreviewMaterial(null)}
        onDownload={handleDownloadMaterial}
      />

      <SqlSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
      />
    </div>
  );
}
