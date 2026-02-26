-- 在 Supabase SQL Editor 里执行本文件

create extension if not exists pgcrypto;

create table if not exists public.fabric_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  sort_order int not null default 0,
  enabled boolean not null default true,

  title text not null,
  fabric text not null,
  image_url text,
  image_alt text,

  -- points: [{emoji,title,content}, ...]
  points jsonb not null,

  -- tags: ["#面料知识", ...]
  tags text[] not null default '{}'::text[]
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_fabric_posts_updated_at on public.fabric_posts;
create trigger trg_fabric_posts_updated_at
before update on public.fabric_posts
for each row
execute function public.set_updated_at();

alter table public.fabric_posts enable row level security;

-- 任何人都能读取已启用的文案（用于公开页面）
drop policy if exists "public read enabled posts" on public.fabric_posts;
create policy "public read enabled posts"
on public.fabric_posts
for select
using (enabled = true);

-- 只有登录用户（authenticated）能增删改（用于管理后台）
drop policy if exists "admin manage posts" on public.fabric_posts;
create policy "admin manage posts"
on public.fabric_posts
for all
to authenticated
using (true)
with check (true);

