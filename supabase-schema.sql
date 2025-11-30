-- NoteGenie Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Summaries table
create table if not exists public.summaries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null default 'Untitled Note',
  raw_text text not null,
  one_liner text not null,
  short_summary text not null,
  detailed_bullets text[] not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Flashcards table
create table if not exists public.flashcards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  summary_id uuid references public.summaries on delete cascade,
  question text not null,
  answer text not null,
  concept_id uuid,
  times_reviewed integer default 0,
  was_correct boolean,
  last_reviewed timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Concepts table
create table if not exists public.concepts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  summary_id uuid references public.summaries on delete cascade,
  term text not null,
  definition text not null,
  category text,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')) not null default 'medium',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Questions table
create table if not exists public.questions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  summary_id uuid references public.summaries on delete cascade,
  question text not null,
  type text check (type in ('mcq', 'short', 'truefalse')) not null,
  options text[],
  correct_answer text not null,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')) not null default 'medium',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Study Tasks table
create table if not exists public.study_tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  day integer not null,
  topics text[] not null default '{}',
  duration integer not null,
  priority text check (priority in ('high', 'medium', 'low')) not null default 'medium',
  completed boolean default false,
  date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Stats table
create table if not exists public.user_stats (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade unique not null,
  notes_processed integer default 0,
  flashcards_generated integer default 0,
  quizzes_taken integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better query performance
create index if not exists idx_summaries_user_id on public.summaries(user_id);
create index if not exists idx_summaries_created_at on public.summaries(created_at desc);
create index if not exists idx_flashcards_user_id on public.flashcards(user_id);
create index if not exists idx_flashcards_summary_id on public.flashcards(summary_id);
create index if not exists idx_concepts_user_id on public.concepts(user_id);
create index if not exists idx_concepts_summary_id on public.concepts(summary_id);
create index if not exists idx_questions_user_id on public.questions(user_id);
create index if not exists idx_questions_summary_id on public.questions(summary_id);
create index if not exists idx_study_tasks_user_id on public.study_tasks(user_id);

-- Generated Books table
create table if not exists public.generated_books (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  category text not null,
  prompt text not null,
  chapter_count integer not null default 0,
  page_count integer not null default 0,
  pdf_url text,
  pdf_data bytea,
  status text check (status in ('generating', 'completed', 'failed')) not null default 'generating',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_generated_books_user_id on public.generated_books(user_id);
create index if not exists idx_generated_books_created_at on public.generated_books(created_at desc);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.summaries enable row level security;
alter table public.flashcards enable row level security;
alter table public.concepts enable row level security;
alter table public.questions enable row level security;
alter table public.study_tasks enable row level security;
alter table public.user_stats enable row level security;
alter table public.generated_books enable row level security;

-- RLS Policies - Users can only access their own data
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can view own summaries" on public.summaries for select using (auth.uid() = user_id);
create policy "Users can insert own summaries" on public.summaries for insert with check (auth.uid() = user_id);
create policy "Users can update own summaries" on public.summaries for update using (auth.uid() = user_id);
create policy "Users can delete own summaries" on public.summaries for delete using (auth.uid() = user_id);

create policy "Users can view own flashcards" on public.flashcards for select using (auth.uid() = user_id);
create policy "Users can insert own flashcards" on public.flashcards for insert with check (auth.uid() = user_id);
create policy "Users can update own flashcards" on public.flashcards for update using (auth.uid() = user_id);
create policy "Users can delete own flashcards" on public.flashcards for delete using (auth.uid() = user_id);

create policy "Users can view own concepts" on public.concepts for select using (auth.uid() = user_id);
create policy "Users can insert own concepts" on public.concepts for insert with check (auth.uid() = user_id);
create policy "Users can update own concepts" on public.concepts for update using (auth.uid() = user_id);
create policy "Users can delete own concepts" on public.concepts for delete using (auth.uid() = user_id);

create policy "Users can view own questions" on public.questions for select using (auth.uid() = user_id);
create policy "Users can insert own questions" on public.questions for insert with check (auth.uid() = user_id);
create policy "Users can update own questions" on public.questions for update using (auth.uid() = user_id);
create policy "Users can delete own questions" on public.questions for delete using (auth.uid() = user_id);

create policy "Users can view own study_tasks" on public.study_tasks for select using (auth.uid() = user_id);
create policy "Users can insert own study_tasks" on public.study_tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own study_tasks" on public.study_tasks for update using (auth.uid() = user_id);
create policy "Users can delete own study_tasks" on public.study_tasks for delete using (auth.uid() = user_id);

create policy "Users can view own stats" on public.user_stats for select using (auth.uid() = user_id);
create policy "Users can insert own stats" on public.user_stats for insert with check (auth.uid() = user_id);
create policy "Users can update own stats" on public.user_stats for update using (auth.uid() = user_id);

create policy "Users can view own books" on public.generated_books for select using (auth.uid() = user_id);
create policy "Users can insert own books" on public.generated_books for insert with check (auth.uid() = user_id);
create policy "Users can update own books" on public.generated_books for update using (auth.uid() = user_id);
create policy "Users can delete own books" on public.generated_books for delete using (auth.uid() = user_id);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url'
  );
  
  insert into public.user_stats (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
