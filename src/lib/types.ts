export type SubjectCode = 'NLP' | 'DA' | 'DAA' | 'DEVOPS' | 'CN';
export type SubjectSlug = 'nlp' | 'da' | 'daa' | 'devops' | 'cn';

export type MaterialCategory = 'PDF Notes' | 'Photos' | 'Previous Year Question Papers';

export type MaterialUnit = 'Unit 1' | 'Unit 2' | 'Unit 3' | 'Unit 4' | 'Unit 5';

export interface Material {
  id: string;
  title: string;
  description?: string | null;
  subject: SubjectCode;
  category: MaterialCategory;
  unit?: MaterialUnit | null;
  uploader_id: string;
  uploader_name: string;
  original_filename: string;
  storage_path: string;
  file_size?: number | null;
  mime_type?: string | null;
  download_url?: string | null;
  created_at: string;
}

export interface ApprovedMember {
  id: string;
  email: string;
  user_id?: string | null;
  display_name: string;
  created_at: string;
}

export interface SubjectConfig {
  code: SubjectCode;
  slug: SubjectSlug;
  title: string;
  fullName: string;
  description: string;
  iconName: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  accentBadge: string;
  iconBg: string;
  iconText: string;
  pastelBg: string;
  pastelBorder: string;
  pastelBadge: string;
  pastelText: string;
  accentGradient: string;
  quickTopics: string[];
  relatedSubjects: SubjectCode[];
}
