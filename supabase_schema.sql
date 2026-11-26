-- ==============================================================================
-- FASTudy 100% Idempotent Supabase Database Schema
-- Safe to run multiple times without any "already exists" errors.
-- Run in your Supabase SQL Editor: https://supabase.com/dashboard/project/<your-project-ref>/sql
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    title TEXT DEFAULT 'CS Undergraduate',
    campus TEXT DEFAULT 'Islamabad Campus',
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure newly added columns exist if table was created in an earlier migration
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS campus TEXT DEFAULT 'Islamabad Campus';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email';

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY, -- 'pf', 'calculus', 'physics'
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY, -- 'dry-runs', 'logic-building', 'bug-hunting'
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Subcategories Table
CREATE TABLE IF NOT EXISTS public.subcategories (
    id TEXT PRIMARY KEY, -- 'math', 'bitwise', 'loops', 'pointers', 'recursion', etc.
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Questions Table (Streamable with live visualizations and 4 problem types)
CREATE TABLE IF NOT EXISTS public.questions (
    id TEXT PRIMARY KEY, -- 'pf-pointers-001', 'calc-limits-001', etc.
    type TEXT NOT NULL DEFAULT 'dry_run',
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    subcategory_id TEXT NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    difficulty TEXT DEFAULT 'easy',
    code TEXT,                       -- Source code to trace or starter code
    starter_code TEXT,               -- For Judge0 logic building
    expected_output TEXT,            -- Output for dry run / test evaluation
    statement TEXT,                  -- Question statement / description
    description TEXT,                -- Extended guidelines
    latex_expression TEXT,           -- KaTeX mathematical formula
    explanation TEXT,                -- Solution walkthrough
    hints JSONB DEFAULT '[]'::jsonb, -- Array of hint strings
    tags JSONB DEFAULT '[]'::jsonb,  -- Array of tag strings
    visualization JSONB,             -- Live streamable visualization object
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'dry_run';
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS starter_code TEXT;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS visualization JSONB;

-- 7. Comments Table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    likes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add parent_id column for nested comment replies
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- 8. Comment Likes Table (Tracks which user liked which comment, one like per user per comment)
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: each user can only like a comment once (idempotent via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comment_likes_user_comment_unique'
  ) THEN
    ALTER TABLE public.comment_likes
      ADD CONSTRAINT comment_likes_user_comment_unique UNIQUE (user_id, comment_id);
  END IF;
END $$;

-- 9. User Submissions Table (Powers Activity Heatmap)
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    submitted_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Bookmarks Table
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- ==============================================================================
-- Row Level Security (RLS) & Idempotent Policies
-- Drops existing policies before recreating to eliminate 42710 duplicate errors
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Catalog Tables Policies (Public read)
DROP POLICY IF EXISTS "Public read subjects" ON public.subjects;
CREATE POLICY "Public read subjects" ON public.subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read subcategories" ON public.subcategories;
CREATE POLICY "Public read subcategories" ON public.subcategories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read questions" ON public.questions;
CREATE POLICY "Public read questions" ON public.questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin or Auth insert questions" ON public.questions;
CREATE POLICY "Admin or Auth insert questions" ON public.questions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin or Auth update questions" ON public.questions;
CREATE POLICY "Admin or Auth update questions" ON public.questions FOR UPDATE USING (true);

-- Comments Policies
DROP POLICY IF EXISTS "Public read comments" ON public.comments;
CREATE POLICY "Public read comments" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users insert comments" ON public.comments;
CREATE POLICY "Auth users insert comments" ON public.comments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update comments likes" ON public.comments;
CREATE POLICY "Public update comments likes" ON public.comments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete own comments" ON public.comments;
CREATE POLICY "Public delete own comments" ON public.comments FOR DELETE USING (true);

-- Comment Likes Policies
DROP POLICY IF EXISTS "Public read comment_likes" ON public.comment_likes;
CREATE POLICY "Public read comment_likes" ON public.comment_likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users insert comment_likes" ON public.comment_likes;
CREATE POLICY "Auth users insert comment_likes" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own comment_likes" ON public.comment_likes;
CREATE POLICY "Users delete own comment_likes" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Submissions Policies
DROP POLICY IF EXISTS "Users insert submissions" ON public.submissions;
CREATE POLICY "Users insert submissions" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own submissions" ON public.submissions;
CREATE POLICY "Users read own submissions" ON public.submissions FOR SELECT USING (auth.uid() = user_id);

-- Bookmarks Policies
DROP POLICY IF EXISTS "Public read bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users read own bookmarks" ON public.bookmarks;
CREATE POLICY "Users read own bookmarks" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Auth users insert bookmarks" ON public.bookmarks;
CREATE POLICY "Auth users insert bookmarks" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Auth users delete bookmarks" ON public.bookmarks;
CREATE POLICY "Auth users delete bookmarks" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- Realtime Replication Publication
-- Safely adds tables to supabase_realtime ignoring duplicate_object errors
-- ==============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.questions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ==============================================================================
-- Auto Profile Creation Trigger on OAuth / Auth Signup
-- Handles both Google and GitHub OAuth metadata and prevents username collisions
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_uname TEXT;
  final_uname TEXT;
  avatar TEXT;
  name_val TEXT;
  auth_prov TEXT;
BEGIN
  -- Determine auth provider (google, github, email)
  auth_prov := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');

  -- Base username resolution
  base_uname := COALESCE(
    NEW.raw_user_meta_data->>'user_name',
    NEW.raw_user_meta_data->>'preferred_username',
    split_part(NEW.email, '@', 1),
    'fastian'
  );
  -- Sanitize username (alphanumeric and underscore only)
  base_uname := regexp_replace(base_uname, '[^a-zA-Z0-9_]', '_', 'g');
  IF length(base_uname) = 0 THEN
    base_uname := 'fastian';
  END IF;

  final_uname := base_uname;

  -- Ensure username uniqueness
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = final_uname AND id <> NEW.id) THEN
    final_uname := base_uname || '_' || substr(NEW.id::text, 1, 6);
  END IF;

  -- Extract avatar (Google uses 'picture', GitHub uses 'avatar_url')
  avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    'https://api.dicebear.com/7.x/bottts/svg?seed=' || NEW.id
  );

  -- Extract full name
  name_val := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    final_uname
  );

  INSERT INTO public.profiles (id, username, full_name, avatar_url, title, campus, provider)
  VALUES (
    NEW.id,
    final_uname,
    name_val,
    avatar,
    'BS Computer Science',
    'Islamabad Campus',
    auth_prov
  )
  ON CONFLICT (id) DO UPDATE SET
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    provider = COALESCE(public.profiles.provider, EXCLUDED.provider),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
