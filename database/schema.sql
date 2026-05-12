-- RM Tracker Database Schema
-- Run this in Supabase SQL Editor

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  role text not null check (role in ('manager', 'employee')),
  created_at timestamptz default now() not null
);

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'active' check (status in ('active', 'delayed', 'completed')),
  progress_percent integer not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  description text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Progress updates
create table public.progress_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  week_date date not null,
  description text not null,
  progress_percent integer check (progress_percent >= 0 and progress_percent <= 100),
  issues text,
  next_steps text,
  created_by uuid references public.profiles(id) not null,
  created_at timestamptz default now() not null
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on public.projects
  for each row execute function update_updated_at();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'employee')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.progress_updates enable row level security;

-- Profiles policies
create policy "Anyone can read profiles"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Projects policies
create policy "View own or all if manager"
  on public.projects for select
  using (
    auth.uid() = owner_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'manager')
  );

create policy "Insert own or if manager"
  on public.projects for insert
  with check (
    auth.uid() = owner_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'manager')
  );

create policy "Update own or if manager"
  on public.projects for update
  using (
    auth.uid() = owner_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'manager')
  );

-- Progress updates policies
create policy "View updates for accessible projects"
  on public.progress_updates for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
      and (
        p.owner_id = auth.uid()
        or exists (select 1 from public.profiles where id = auth.uid() and role = 'manager')
      )
    )
  );

create policy "Insert own updates"
  on public.progress_updates for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.projects p
      where p.id = project_id
      and (
        p.owner_id = auth.uid()
        or exists (select 1 from public.profiles where id = auth.uid() and role = 'manager')
      )
    )
  );
