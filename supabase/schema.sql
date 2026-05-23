create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text not null,
  created_at timestamptz default now()
);

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  admin_id uuid references auth.users(id) on delete cascade,
  official_top_scorer text,
  created_at timestamptz default now()
);

create table if not exists public.league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid references public.leagues(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  username text,
  role text default 'player',
  status text default 'invited',
  result_points integer default 0,
  top_scorer_choice text,
  top_scorer_bonus integer default 0,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;

create policy "Profiles visible to logged users" on public.profiles for select to authenticated using (true);
create policy "Users insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id);

create policy "League members view leagues" on public.leagues for select to authenticated using (
  exists (
    select 1 from public.league_members lm
    where lm.league_id = leagues.id
    and lm.email = auth.jwt() ->> 'email'
  )
  or admin_id = auth.uid()
);

create policy "Users create leagues" on public.leagues for insert to authenticated with check (admin_id = auth.uid());
create policy "Admins update own leagues" on public.leagues for update to authenticated using (admin_id = auth.uid());

create policy "Members view league members" on public.league_members for select to authenticated using (
  email = auth.jwt() ->> 'email'
  or exists (
    select 1 from public.leagues l
    where l.id = league_members.league_id
    and l.admin_id = auth.uid()
  )
);

create policy "Admins invite members" on public.league_members for insert to authenticated with check (
  exists (
    select 1 from public.leagues l
    where l.id = league_members.league_id
    and l.admin_id = auth.uid()
  )
  or user_id = auth.uid()
);

create policy "Members update own row" on public.league_members for update to authenticated using (
  email = auth.jwt() ->> 'email'
  or exists (
    select 1 from public.leagues l
    where l.id = league_members.league_id
    and l.admin_id = auth.uid()
  )
);
