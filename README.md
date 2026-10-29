# Semester Notes Hub 🎓

A collaborative semester study repository built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase Auth**, **PostgreSQL**, and **Private Supabase Storage**.

Built specifically for a study group of **three authorized friends** to organize, upload, preview, and download semester exam notes across all their devices.

---

## 📚 Core Academic Structure

### Five Core Subjects
1. **NLP** – Natural Language Processing (Language models, transformers, tokenization, semantics & syntax processing)
2. **DA** – Data Analytics (Statistical modeling, exploratory analysis, visualization & data mining)
3. **DAA** – Design & Analysis of Algorithms (Asymptotic analysis, dynamic programming, greedy algorithms & graph theory)
4. **DEVOPS** – Development & Operations (CI/CD pipelines, Docker, Kubernetes, infrastructure as code & monitoring)
5. **CN** – Computer Networks (OSI layers, TCP/IP, routing protocols, subnetting & network security)

### Three Material Categories
- **PDF Notes**: Comprehensive lecture notes, summaries, and formula derivations.
- **Photos**: High-resolution classroom blackboard photos, diagram snapshots, and handwritten cheat sheets.
- **Previous Year Question Papers**: Semester-end question papers, model papers, and previous exam question sheets.

### Syllabus Units
- Materials can be categorized and filtered across **Unit 1**, **Unit 2**, **Unit 3**, **Unit 4**, and **Unit 5**.

---

## 🔒 Security & Authorization Architecture

### 1. Three Authorized Friends Roster
- The system uses a dedicated `approved_members` table in PostgreSQL.
- Only users whose emails exist in this roster are authorized to upload or delete study materials.
- Helper function `public.is_approved_member()` validates authorization both against `auth.uid()` and the authenticated user's JWT email.

### 2. Private Supabase Storage (`study-materials`)
- Bucket is strictly **private** (`public = false`).
- Files are organized per user under `{user_id}/{timestamp}-{filename}`.
- Allowed file types: `application/pdf`, `image/jpeg`, `image/jpg`, `image/png`, `image/webp`.
- Maximum file size: **10 MB** (10,485,760 bytes).
- Downloads and previews use **short-lived signed URLs** generated via `supabase.storage.from('study-materials').createSignedUrl(path, 3600)`.

### 3. Row Level Security (RLS)
- **Materials Table**:
  - `SELECT`: Only authenticated users who pass `is_approved_member()` can view materials.
  - `INSERT`: Only approved users can insert, and `uploader_id` must match `auth.uid()`.
  - `UPDATE`: Only the original uploader can modify their material.
  - `DELETE`: Only the original uploader can delete their material.
- **Storage Objects**:
  - Read access is restricted to approved members.
  - Write and delete access is restricted to the uploader's personal folder `(storage.foldername(name))[1] = auth.uid()::text`.

### 4. Client-Side Security Rule
- **Never expose the Supabase service-role key** in frontend code or client-side `.env.local`.
- The application uses solely `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested with Node 20 & 24)
- npm or pnpm

### 2. Environment Setup
Copy the example environment configuration:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Note on Placeholders**: If no credentials are configured, the hub runs in **Local Vault Demo Mode**, allowing you to test all subject switching, unit filtering, uploads (persisted in browser storage), previews, and member switching immediately.

### 3. Supabase Database & Storage Migration
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to the **SQL Editor**.
3. Open `supabase/migrations/20240101000000_semester_notes_schema.sql` (or click **SQL & Setup** directly in the hub UI to copy it).
4. Update the 3 friend emails in the seed section:
   ```sql
   INSERT INTO public.approved_members (email, display_name)
   VALUES
       ('alex@college.edu', 'Alex Rivera'),
       ('sam@college.edu', 'Sam Chen'),
       ('jordan@college.edu', 'Jordan Patel')
   ON CONFLICT (email) DO NOTHING;
   ```
5. Click **Run**. The script will automatically create:
   - `public.approved_members` table with RLS
   - `public.materials` table with subject and category checks
   - `public.is_approved_member()` security definer function
   - `public.handle_user_sync()` trigger on `auth.users`
   - Private `study-materials` storage bucket with 10 MB limit and mime type restrictions
   - Complete storage RLS policies for read, upload, and delete

### 4. Invite Your 3 Friends
1. In the Supabase Dashboard, go to **Authentication > Users**.
2. Click **Add User > Send Invite** or have them register directly in the app using their authorized college emails.
3. When they register, the database trigger automatically associates their `auth.users(id)` with their `approved_members` record.

---

## 🛠️ Development & Production Build

### Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### Run Production Build
```bash
npm run build
```

### Start Production Server
```bash
npm run start
```

---

## 📁 Project Structure

```
semester-notes-hub/
├── .env.example               # Environment variable template
├── .env.local                 # Local environment credentials (git-ignored)
├── package.json               # Dependencies and build scripts
├── postcss.config.js          # Tailwind CSS v4 processor configuration
├── postcss-tailwind.js        # PostCSS Tailwind build plugin
├── supabase/
│   └── migrations/
│       └── 20240101000000_semester_notes_schema.sql  # Database & storage schema
└── src/
    ├── app/
    │   ├── globals.css        # Global CSS styling
    │   ├── layout.tsx         # Root layout with system font stack
    │   └── page.tsx           # Main Semester Notes Hub interactive view
    ├── components/
    │   ├── Navbar.tsx         # Top bar with auth profile & quick actions
    │   ├── Banner.tsx         # Storage connection indicator
    │   ├── SubjectSelector.tsx # 5 Course selector cards (NLP, DA, DAA, DEVOPS, CN)
    │   ├── CategoryTabs.tsx   # PDF Notes, Photos, Previous Year Question Papers & Unit filters
    │   ├── MaterialCard.tsx   # Material card with grid/list view and preview/download
    │   ├── MaterialUploadModal.tsx # Upload modal with 10MB validation
    │   ├── AuthModal.tsx      # Supabase Auth / 3-friend switcher
    │   ├── PreviewModal.tsx   # PDF reader & photo viewer with signed URLs
    │   └── SqlSetupModal.tsx  # In-app SQL migration viewer with copy button
    └── lib/
        ├── constants.ts       # Subject definitions, mime types, and size limits
        ├── types.ts           # TypeScript interfaces for materials and members
        ├── utils.ts           # File size formatting and upload validation
        ├── mock-data.ts       # Initial curated materials and demo friend roster
        └── supabase/
            ├── client.ts      # Browser-safe Supabase client (anon key only)
            └── server.ts      # Server-safe Supabase client with cookies
```

---

## ✨ Features Checklist

- [x] Next.js App Router, TypeScript, Tailwind CSS
- [x] Exactly five subjects: NLP, DA, DAA, DEVOPS, CN
- [x] Three categories per subject: PDF Notes, Photos, Previous Year Question Papers
- [x] Three authorized friends access control (`approved_members` table & JWT checks)
- [x] Private Supabase Storage bucket (`study-materials`) with signed download URLs
- [x] Row Level Security (RLS) on database and storage objects
- [x] Accepts PDF, JPG, JPEG, PNG, WEBP files up to 10 MB
- [x] No exposure of Supabase service-role key in frontend code
- [x] Graceful fallback to Local Vault Demo Mode with placeholders
- [x] Production build passes cleanly with zero errors
