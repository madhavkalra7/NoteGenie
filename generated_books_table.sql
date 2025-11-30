-- Run this SQL in Supabase SQL Editor to create the generated_books table
-- Go to: Supabase Dashboard > SQL Editor > New Query > Paste this and run

-- Create the generated_books table
create table if not exists public.generated_books (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  category text not null,
  prompt text not null,
  chapter_count integer not null default 0,
  page_count integer not null default 0,
  pdf_data text, -- Store PDF as base64
  status text check (status in ('generating', 'completed', 'failed')) not null default 'generating',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- If table already exists, add pdf_data column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'generated_books' AND column_name = 'pdf_data') THEN
    ALTER TABLE public.generated_books ADD COLUMN pdf_data text;
  END IF;
END $$;

-- Create index for faster queries
create index if not exists idx_generated_books_user_id on public.generated_books(user_id);
create index if not exists idx_generated_books_created_at on public.generated_books(created_at desc);

-- Enable Row Level Security
alter table public.generated_books enable row level security;

-- Drop existing policies first (to avoid "already exists" error)
drop policy if exists "Users can view own books" on public.generated_books;
drop policy if exists "Users can insert own books" on public.generated_books;
drop policy if exists "Users can update own books" on public.generated_books;
drop policy if exists "Users can delete own books" on public.generated_books;

-- Create RLS policies so users can only access their own books
create policy "Users can view own books" on public.generated_books 
  for select using (auth.uid() = user_id);

create policy "Users can insert own books" on public.generated_books 
  for insert with check (auth.uid() = user_id);

create policy "Users can update own books" on public.generated_books 
  for update using (auth.uid() = user_id);

create policy "Users can delete own books" on public.generated_books 
  for delete using (auth.uid() = user_id);

-- IMPORTANT: For server-side inserts, you need SUPABASE_SERVICE_ROLE_KEY in .env
-- Add this to your .env file:
-- SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
-- You can find it in: Supabase Dashboard > Settings > API > service_role key (secret)
