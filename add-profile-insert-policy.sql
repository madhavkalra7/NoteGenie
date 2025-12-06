-- Add missing INSERT policy for profiles table
-- This allows users to create their own profile row during upsert operations

create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
