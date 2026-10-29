import { SubjectCode, MaterialCategory, MaterialUnit, SubjectConfig } from './types';

export const SUBJECTS: SubjectConfig[] = [
  {
    code: 'NLP',
    title: 'NLP',
    fullName: 'Natural Language Processing',
    description: 'Language models, transformers, tokenization, semantics & syntax processing.',
    iconName: 'MessageSquareCode',
    pastelBg: 'bg-purple-50/70 hover:bg-purple-50',
    pastelBorder: 'border-purple-200/80 hover:border-purple-300',
    pastelBadge: 'bg-purple-100 text-purple-700 border-purple-200',
    pastelText: 'text-purple-700',
    accentGradient: 'from-purple-500 to-indigo-500',
  },
  {
    code: 'DA',
    title: 'DA',
    fullName: 'Data Analytics',
    description: 'Statistical modeling, exploratory analysis, visualization & data mining.',
    iconName: 'BarChart3',
    pastelBg: 'bg-blue-50/70 hover:bg-blue-50',
    pastelBorder: 'border-blue-200/80 hover:border-blue-300',
    pastelBadge: 'bg-blue-100 text-blue-700 border-blue-200',
    pastelText: 'text-blue-700',
    accentGradient: 'from-blue-500 to-cyan-500',
  },
  {
    code: 'DAA',
    title: 'DAA',
    fullName: 'Design & Analysis of Algorithms',
    description: 'Asymptotic analysis, dynamic programming, greedy algorithms & graph theory.',
    iconName: 'Binary',
    pastelBg: 'bg-emerald-50/70 hover:bg-emerald-50',
    pastelBorder: 'border-emerald-200/80 hover:border-emerald-300',
    pastelBadge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pastelText: 'text-emerald-700',
    accentGradient: 'from-emerald-500 to-teal-500',
  },
  {
    code: 'DEVOPS',
    title: 'DEVOPS',
    fullName: 'Development & Operations',
    description: 'CI/CD pipelines, Docker, Kubernetes, infrastructure as code & monitoring.',
    iconName: 'Workflow',
    pastelBg: 'bg-amber-50/70 hover:bg-amber-50',
    pastelBorder: 'border-amber-200/80 hover:border-amber-300',
    pastelBadge: 'bg-amber-100 text-amber-800 border-amber-200',
    pastelText: 'text-amber-800',
    accentGradient: 'from-amber-500 to-orange-500',
  },
  {
    code: 'CN',
    title: 'CN',
    fullName: 'Computer Networks',
    description: 'OSI layers, TCP/IP, routing protocols, subnetting & network security.',
    iconName: 'Network',
    pastelBg: 'bg-cyan-50/70 hover:bg-cyan-50',
    pastelBorder: 'border-cyan-200/80 hover:border-cyan-300',
    pastelBadge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    pastelText: 'text-cyan-800',
    accentGradient: 'from-cyan-500 to-sky-500',
  },
];

export const CATEGORIES: MaterialCategory[] = [
  'PDF Notes',
  'Photos',
  'Previous Year Question Papers',
];

export const UNITS: MaterialUnit[] = [
  'Unit 1',
  'Unit 2',
  'Unit 3',
  'Unit 4',
  'Unit 5',
];

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const STORAGE_BUCKET = 'study-materials';
