-- Polyglot : une sauvegarde par joueur et par langue
create table if not exists public.saves (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  lang text not null check (lang in ('ar', 'ru', 'ka', 'zh')),
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, lang)
);

alter table public.saves enable row level security;

create policy "lire sa partie" on public.saves for select using (auth.uid() = user_id);
create policy "créer sa partie" on public.saves for insert with check (auth.uid() = user_id);
create policy "modifier sa partie" on public.saves for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
