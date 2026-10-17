-- Polyglot : profils publics, scores et classement (à coller une fois dans le SQL Editor de Supabase)

-- 1. Le chinois rejoint les langues des sauvegardes
alter table public.saves drop constraint if exists saves_lang_check;
alter table public.saves add constraint saves_lang_check check (lang in ('ar', 'ru', 'ka', 'zh'));

-- 2. Un profil public par compte : pseudo et avatar
create table if not exists public.profiles (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  pseudo text not null check (pseudo ~ '^[A-Za-z0-9_À-ÿ.-]{3,20}$'),
  avatar text not null default '🦊' check (char_length(avatar) <= 8),
  created_at timestamptz not null default now()
);
create unique index if not exists profiles_pseudo_unique on public.profiles (lower(pseudo));

alter table public.profiles enable row level security;
create policy "profils visibles par tous" on public.profiles for select using (true);
create policy "créer son profil" on public.profiles for insert with check (auth.uid() = user_id);
create policy "modifier son profil" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. Un score par joueur et par langue : XP de la semaine et depuis le début
create table if not exists public.scores (
  user_id uuid not null default auth.uid() references public.profiles (user_id) on delete cascade,
  lang text not null check (lang in ('ar', 'ru', 'ka', 'zh')),
  week_start date not null,
  week_xp integer not null default 0 check (week_xp between 0 and 1000000),
  total_xp integer not null default 0 check (total_xp between 0 and 100000000),
  level smallint not null default 1 check (level between 1 and 5),
  cards integer not null default 0 check (cards >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, lang)
);
create index if not exists scores_week on public.scores (lang, week_start, week_xp desc);
create index if not exists scores_total on public.scores (lang, total_xp desc);

alter table public.scores enable row level security;
create policy "scores visibles par tous" on public.scores for select using (true);
create policy "créer son score" on public.scores for insert with check (auth.uid() = user_id);
create policy "modifier son score" on public.scores for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
