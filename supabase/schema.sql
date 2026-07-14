-- CourseBeam database schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

-- ---------------------------------------------------------------------------
-- 1. Profiles (mirrors auth.users, created automatically on sign-up)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  daily_goal_minutes integer default 30,
  created_at timestamptz default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. Courses — one row per playlist/video a user imports
-- ---------------------------------------------------------------------------
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  youtube_playlist_id text,           -- null for single-video "courses"
  title text not null,
  description text,
  thumbnail_url text,
  channel_name text,
  total_videos integer default 0,
  is_favorite boolean default false,
  tags text[] default '{}',
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists courses_user_id_idx on courses (user_id);

-- ---------------------------------------------------------------------------
-- 3. Lessons — individual videos that belong to a course
-- ---------------------------------------------------------------------------
create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses (id) on delete cascade,
  youtube_video_id text not null,
  title text not null,
  description text,
  thumbnail_url text,
  duration_seconds integer default 0,
  position integer not null default 0,
  created_at timestamptz default now()
);

create index if not exists lessons_course_id_idx on lessons (course_id);
create unique index if not exists lessons_course_video_unique
  on lessons (course_id, youtube_video_id);

-- ---------------------------------------------------------------------------
-- 4. Progress — per-user, per-lesson watch state
-- ---------------------------------------------------------------------------
create type lesson_status as enum ('not_started', 'in_progress', 'completed');

create table if not exists progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references courses (id) on delete cascade,
  lesson_id uuid not null references lessons (id) on delete cascade,
  status lesson_status not null default 'not_started',
  percentage_watched numeric(5, 2) not null default 0,
  last_position_seconds numeric(10, 2) not null default 0,
  watch_time_seconds numeric(10, 2) not null default 0,
  completed_at timestamptz,
  updated_at timestamptz default now(),
  unique (user_id, lesson_id)
);

create index if not exists progress_user_course_idx on progress (user_id, course_id);

-- ---------------------------------------------------------------------------
-- 5. Notes — timestamped notes per lesson
-- ---------------------------------------------------------------------------
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references lessons (id) on delete cascade,
  timestamp_seconds numeric(10, 2) not null default 0,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists notes_user_lesson_idx on notes (user_id, lesson_id);

-- ---------------------------------------------------------------------------
-- 6. Bookmarks — a timestamp bookmark, or a whole-lesson bookmark (timestamp null)
-- ---------------------------------------------------------------------------
create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references lessons (id) on delete cascade,
  timestamp_seconds numeric(10, 2),
  label text,
  created_at timestamptz default now()
);

create index if not exists bookmarks_user_lesson_idx on bookmarks (user_id, lesson_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — every table is private to its owning user
-- ---------------------------------------------------------------------------
alter table profiles enable row level security;
alter table courses enable row level security;
alter table lessons enable row level security;
alter table progress enable row level security;
alter table notes enable row level security;
alter table bookmarks enable row level security;

create policy "Users manage their own profile"
  on profiles for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users manage their own courses"
  on courses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage lessons of their own courses"
  on lessons for all using (
    exists (select 1 from courses c where c.id = lessons.course_id and c.user_id = auth.uid())
  ) with check (
    exists (select 1 from courses c where c.id = lessons.course_id and c.user_id = auth.uid())
  );

create policy "Users manage their own progress"
  on progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own notes"
  on notes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users manage their own bookmarks"
  on bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 7. Manual completions — log of "Mark as complete" clicks, used to rate-limit
--    the feature to 5 uses per rolling 5-hour window per user.
-- ---------------------------------------------------------------------------
create table if not exists manual_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references lessons (id) on delete cascade,
  created_at timestamptz default now()
);

create index if not exists manual_completions_user_time_idx
  on manual_completions (user_id, created_at);

alter table manual_completions enable row level security;

create policy "Users manage their own manual completions"
  on manual_completions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
