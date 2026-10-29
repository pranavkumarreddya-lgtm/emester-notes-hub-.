import { Material, ApprovedMember } from './types';

export const MOCK_APPROVED_MEMBERS: ApprovedMember[] = [
  {
    id: 'mem-1',
    email: 'student@college.edu',
    user_id: 'user-student-1',
    display_name: 'Student Contributor',
    created_at: '2024-01-15T09:00:00Z',
  },
];

/**
 * Clean & empty initial materials list.
 * Live materials will be fetched directly from your Supabase database and storage bucket.
 */
export const INITIAL_MOCK_MATERIALS: Material[] = [];
