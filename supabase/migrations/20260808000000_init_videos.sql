create table videos (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text,
  owner_id uuid references auth.users(id) not null,
  r2_object_key text not null,
  thumbnail_url text,
  status text not null default 'processing',
  duration_seconds int,
  file_size_bytes bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint videos_status_check check (status in ('processing', 'ready', 'error'))
);

create index idx_videos_slug on videos(slug);
create index idx_videos_owner on videos(owner_id);

alter table videos enable row level security;

create policy "Owners can select their own videos"
  on videos for select
  to authenticated
  using (owner_id = auth.uid());

create policy "Owners can insert their own videos"
  on videos for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "Owners can update their own videos"
  on videos for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Owners can delete their own videos"
  on videos for delete
  to authenticated
  using (owner_id = auth.uid());

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger videos_set_updated_at
  before update on videos
  for each row
  execute function set_updated_at();
