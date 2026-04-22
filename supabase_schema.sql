-- Royal PMS - Supabase schema hardening
-- Apply this in Supabase SQL Editor before deploying the frontend to production.

-- Extensions
create extension if not exists pgcrypto;

-- Tables
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text,
  role text default 'client',
  company_id uuid,
  photo_url text,
  phone text,
  permissions jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists permissions jsonb;
alter table public.profiles alter column role set default 'client';

create table if not exists public.companies (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  cnpj text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.files (
  id uuid default gen_random_uuid() primary key,
  original_name text not null,
  storage_path text not null,
  type text,
  category text,
  amount decimal(12, 2),
  due_date date,
  period text,
  status text default 'PENDING',
  is_deleted boolean default false,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  viewed_by_client boolean default false,
  dispute_response text,
  dispute_resolved_at timestamp with time zone,
  company_id uuid references public.companies(id) on delete cascade,
  uploaded_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  action text not null,
  details jsonb,
  user_id uuid references auth.users(id),
  user_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  link text,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.bank_accounts (
  id uuid default gen_random_uuid() primary key,
  institution text not null,
  bank_name text not null,
  agency text not null,
  account text not null,
  pix_key text not null,
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.tariffs (
  id uuid default gen_random_uuid() primary key,
  company_name text not null,
  base_rate decimal(12, 2) not null,
  percentage decimal(5, 2) not null,
  room_type text,
  category text,
  description text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Helpers
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.handle_updated_at();

drop trigger if exists set_tariffs_updated_at on public.tariffs;
create trigger set_tariffs_updated_at
before update on public.tariffs
for each row
execute function public.handle_updated_at();

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

create or replace function public.current_user_can_manage_users()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and (
        role in ('admin', 'faturamento')
        or coalesce((permissions ->> 'canCreateUsers')::boolean, false)
      )
  );
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  can_manage boolean;
begin
  can_manage := public.current_user_can_manage_users();

  if tg_op = 'INSERT' then
    if auth.uid() = new.id and not can_manage then
      new.role := 'client';
      new.permissions := null;
      new.company_id := null;
    end if;

    return new;
  end if;

  if auth.uid() = old.id and not can_manage then
    new.role := old.role;
    new.permissions := old.permissions;
    new.company_id := old.company_id;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_privileged_fields on public.profiles;
create trigger protect_profile_privileged_fields
before insert or update on public.profiles
for each row
execute function public.protect_profile_privileged_fields();

grant execute on function public.current_user_role() to authenticated, anon, service_role;
grant execute on function public.current_user_can_manage_users() to authenticated, service_role;
grant execute on function public.current_user_is_admin() to authenticated, service_role;

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.files enable row level security;
alter table public.audit_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.tariffs enable row level security;

-- Profiles policies
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;
drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles" on public.profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "Users can bootstrap their own profile" on public.profiles;
create policy "Users can bootstrap their own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Managers can create profiles" on public.profiles;
create policy "Managers can create profiles" on public.profiles
  for insert with check (public.current_user_can_manage_users());

drop policy if exists "Users can update their own profile safely" on public.profiles;
create policy "Users can update their own profile safely" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Managers can update profiles" on public.profiles;
create policy "Managers can update profiles" on public.profiles
  for update using (public.current_user_can_manage_users())
  with check (public.current_user_can_manage_users());

-- Companies policies
drop policy if exists "Companies are viewable by authenticated users." on public.companies;
drop policy if exists "Only admins can manage companies." on public.companies;
drop policy if exists "Companies are viewable by authenticated users" on public.companies;
create policy "Companies are viewable by authenticated users" on public.companies
  for select using (auth.role() = 'authenticated');

drop policy if exists "Only admins can manage companies" on public.companies;
create policy "Only admins can manage companies" on public.companies
  for all using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- Files policies
drop policy if exists "Files are viewable by authenticated users." on public.files;
drop policy if exists "Only admins can manage files." on public.files;
drop policy if exists "Files are viewable by authenticated users" on public.files;
create policy "Files are viewable by authenticated users" on public.files
  for select using (auth.role() = 'authenticated');

drop policy if exists "Only admins can manage files" on public.files;
create policy "Only admins can manage files" on public.files
  for all using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- Audit logs policies
drop policy if exists "Admins can view audit logs." on public.audit_logs;
drop policy if exists "Authenticated users can insert audit logs." on public.audit_logs;
drop policy if exists "Admins can view audit logs" on public.audit_logs;
create policy "Admins can view audit logs" on public.audit_logs
  for select using (public.current_user_is_admin());

drop policy if exists "Authenticated users can insert audit logs" on public.audit_logs;
create policy "Authenticated users can insert audit logs" on public.audit_logs
  for insert with check (auth.role() = 'authenticated');

-- Notifications policies
drop policy if exists "Users can view their own notifications." on public.notifications;
drop policy if exists "Users can update their own notifications." on public.notifications;
drop policy if exists "System can insert notifications." on public.notifications;
drop policy if exists "Users can view their own notifications" on public.notifications;
create policy "Users can view their own notifications" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "Users can update their own notifications" on public.notifications;
create policy "Users can update their own notifications" on public.notifications
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can insert notifications" on public.notifications;
create policy "Authenticated users can insert notifications" on public.notifications
  for insert with check (auth.role() = 'authenticated');

-- Bank accounts policies
drop policy if exists "Bank accounts are viewable by authenticated users." on public.bank_accounts;
drop policy if exists "Only admins can manage bank accounts." on public.bank_accounts;
drop policy if exists "Bank accounts are viewable by authenticated users" on public.bank_accounts;
create policy "Bank accounts are viewable by authenticated users" on public.bank_accounts
  for select using (auth.role() = 'authenticated');

drop policy if exists "Only admins can manage bank accounts" on public.bank_accounts;
create policy "Only admins can manage bank accounts" on public.bank_accounts
  for all using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- Tariffs policies
drop policy if exists "Tariffs are viewable by authenticated users." on public.tariffs;
drop policy if exists "Only admins and reservations can manage tariffs." on public.tariffs;
drop policy if exists "Tariffs are viewable by authenticated users" on public.tariffs;
create policy "Tariffs are viewable by authenticated users" on public.tariffs
  for select using (auth.role() = 'authenticated');

drop policy if exists "Admins and reservations can manage tariffs" on public.tariffs;
create policy "Admins and reservations can manage tariffs" on public.tariffs
  for all using (
    public.current_user_is_admin()
    or public.current_user_role() = 'reservations'
  )
  with check (
    public.current_user_is_admin()
    or public.current_user_role() = 'reservations'
  );

-- Storage policies
-- Create the "files" bucket before applying these policies.
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated users can upload files" on storage.objects;
drop policy if exists "Authenticated users can delete files" on storage.objects;
drop policy if exists "Authenticated users can read files bucket" on storage.objects;
create policy "Authenticated users can read files bucket" on storage.objects
  for select using (bucket_id = 'files' and auth.role() = 'authenticated');

drop policy if exists "Authenticated users can upload files to files bucket" on storage.objects;
create policy "Authenticated users can upload files to files bucket" on storage.objects
  for insert with check (bucket_id = 'files' and auth.role() = 'authenticated');

drop policy if exists "Authenticated users can delete files from files bucket" on storage.objects;
create policy "Authenticated users can delete files from files bucket" on storage.objects
  for delete using (bucket_id = 'files' and auth.role() = 'authenticated');
