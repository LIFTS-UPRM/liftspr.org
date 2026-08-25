-- Keep the content editor reproducible in local and hosted Supabase projects.
-- Existing rows are preserved; the seed only fills new content or an empty gallery.

create table if not exists public.site_content (
  key text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'upcoming',
  sort_order integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Announcement',
  date_display text not null default '',
  published_at timestamptz not null default now(),
  summary text not null default '',
  body text,
  image_url text,
  author_id uuid references auth.users(id) on delete set null
);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  title text,
  caption text,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  role text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.pending_changes (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_key text,
  action text not null,
  payload jsonb,
  summary text,
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists missions_sort_order_idx on public.missions (sort_order);
create index if not exists posts_published_at_idx on public.posts (published_at desc);
create index if not exists gallery_sort_order_idx on public.gallery (sort_order);
create index if not exists pending_changes_status_idx on public.pending_changes (status, submitted_at desc);

-- The first account becomes the initial admin. Later signups remain pending.
create or replace function public.lifts_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  assigned_role text;
begin
  -- ponytail: serialize only first-account setup; remove when an external
  -- provisioning system owns initial admin assignment.
  perform pg_advisory_xact_lock(hashtextextended('lifts:first-profile', 0));
  select case when exists (select 1 from public.profiles) then 'pending' else 'admin' end
    into assigned_role;

  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data->>'display_name', ''),
    assigned_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.lifts_handle_new_user() from public, anon, authenticated;

drop trigger if exists lifts_on_auth_user_created on auth.users;
create trigger lifts_on_auth_user_created
  after insert on auth.users
  for each row execute function public.lifts_handle_new_user();

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function private.can_edit()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'editor')
  );
$$;

revoke all on function private.is_admin() from public, anon;
revoke all on function private.can_edit() from public, anon;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.can_edit() to authenticated;

-- Public content is readable by the public site. Only admins publish directly;
-- editors submit rows to pending_changes for review.
do $$
begin
  execute 'alter table public.site_content enable row level security';
  execute 'alter table public.missions enable row level security';
  execute 'alter table public.posts enable row level security';
  execute 'alter table public.gallery enable row level security';
  execute 'alter table public.profiles enable row level security';
  execute 'alter table public.pending_changes enable row level security';
end
$$;

revoke all on table public.site_content, public.missions, public.posts, public.gallery from anon, authenticated;
grant select on table public.site_content, public.missions, public.posts, public.gallery to anon, authenticated;
grant insert, update, delete on table public.site_content, public.missions, public.posts, public.gallery to authenticated;

revoke all on table public.profiles from anon, authenticated;
grant select, update on table public.profiles to authenticated;

revoke all on table public.pending_changes from anon, authenticated;
grant select, insert, update on table public.pending_changes to authenticated;

drop policy if exists lifts_site_content_public_read on public.site_content;
create policy lifts_site_content_public_read on public.site_content for select to anon, authenticated using (true);
drop policy if exists lifts_site_content_admin_insert on public.site_content;
create policy lifts_site_content_admin_insert on public.site_content for insert to authenticated with check ((select private.is_admin()));
drop policy if exists lifts_site_content_admin_update on public.site_content;
create policy lifts_site_content_admin_update on public.site_content for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists lifts_site_content_admin_delete on public.site_content;
create policy lifts_site_content_admin_delete on public.site_content for delete to authenticated using ((select private.is_admin()));

drop policy if exists lifts_missions_public_read on public.missions;
create policy lifts_missions_public_read on public.missions for select to anon, authenticated using (true);
drop policy if exists lifts_missions_admin_insert on public.missions;
create policy lifts_missions_admin_insert on public.missions for insert to authenticated with check ((select private.is_admin()));
drop policy if exists lifts_missions_admin_update on public.missions;
create policy lifts_missions_admin_update on public.missions for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists lifts_missions_admin_delete on public.missions;
create policy lifts_missions_admin_delete on public.missions for delete to authenticated using ((select private.is_admin()));

drop policy if exists lifts_posts_public_read on public.posts;
create policy lifts_posts_public_read on public.posts for select to anon, authenticated using (true);
drop policy if exists lifts_posts_admin_insert on public.posts;
create policy lifts_posts_admin_insert on public.posts for insert to authenticated with check ((select private.is_admin()));
drop policy if exists lifts_posts_admin_update on public.posts;
create policy lifts_posts_admin_update on public.posts for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists lifts_posts_admin_delete on public.posts;
create policy lifts_posts_admin_delete on public.posts for delete to authenticated using ((select private.is_admin()));

drop policy if exists lifts_gallery_public_read on public.gallery;
create policy lifts_gallery_public_read on public.gallery for select to anon, authenticated using (true);
drop policy if exists lifts_gallery_admin_insert on public.gallery;
create policy lifts_gallery_admin_insert on public.gallery for insert to authenticated with check ((select private.is_admin()));
drop policy if exists lifts_gallery_admin_update on public.gallery;
create policy lifts_gallery_admin_update on public.gallery for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists lifts_gallery_admin_delete on public.gallery;
create policy lifts_gallery_admin_delete on public.gallery for delete to authenticated using ((select private.is_admin()));

drop policy if exists lifts_profiles_read on public.profiles;
create policy lifts_profiles_read on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));
drop policy if exists lifts_profiles_admin_update on public.profiles;
create policy lifts_profiles_admin_update on public.profiles for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists lifts_pending_changes_read on public.pending_changes;
create policy lifts_pending_changes_read on public.pending_changes for select to authenticated
  using (submitted_by = (select auth.uid()) or (select private.is_admin()));
drop policy if exists lifts_pending_changes_insert on public.pending_changes;
create policy lifts_pending_changes_insert on public.pending_changes for insert to authenticated
  with check (submitted_by = (select auth.uid()) and (select private.can_edit()));
drop policy if exists lifts_pending_changes_admin_update on public.pending_changes;
create policy lifts_pending_changes_admin_update on public.pending_changes for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- Public image delivery plus authenticated uploads for editors/admins.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists lifts_media_upload on storage.objects;
create policy lifts_media_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select private.can_edit()));

insert into public.missions (slug, name, status, sort_order, data)
select seed.slug, seed.name, seed.status, seed.sort_order, seed.data
from (values
  ('nexo', 'NEXO', 'completed', 2, '{"slug":"nexo","name":"NEXO","full_name":"Space Navigator for Exploration and Observation","status":"completed","status_display":"Completed","date":"2024-04-08","date_display":"April 8, 2024","date_month":"APR","date_day":"08","date_year":"2024","location":"Austin, TX","location_full":"Austin, TX","launch_time":"12:30 p.m.","max_altitude_ft":95000,"max_altitude_display":"95,000 ft","flight_duration":"3.5 hours","flight_duration_tracked":"~4.5 hours tracked","recovery_location":"Tyler, TX","recovery_distance":"~200 miles","recovery_status":"Recovered intact","recovery_info":"Recovered intact near Tyler, TX, about 200 miles from launch","image":"https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=1200&q=80","summary":"Our first high-altitude balloon launch during the 2024 total solar eclipse as part of the Nationwide Eclipse Ballooning Project.","highlights":["Completed eclipse-day launch operations in Austin, Texas.","Tracked the payload through a multi-hour near-space flight.","Recovered the flight system intact near Tyler, Texas."],"objectives":["Collect near-space imagery and environmental data during eclipse conditions.","Validate team operations for launch, tracking, and recovery.","Build the foundation for future Puerto Rico-led balloon missions."]}'::jsonb),
  ('ascent', 'ASCENT', 'upcoming', 1, '{"slug":"ascent","name":"ASCENT","full_name":"Advanced Science Carrier for Environmental and Near-space Technology","status":"upcoming","status_display":"Upcoming","date":"2026-03-14","date_display":"March 14, 2026","date_iso":"2026-03-14T00:00:00","date_month":"MAR","date_day":"14","date_year":"2026","location":"Mayaguez, PR","location_full":"TBD, Puerto Rico","target_altitude_ft":100000,"target_altitude_display":"100,000+ ft","target_altitude_short":"100,000 ft","est_flight_time":"~3 hours","payload_mass_kg":2.5,"payload_mass_display":"2.5 kg","payload_count":5,"payload_count_display":"5 modules","image":"https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=1200&q=80","summary":"A Puerto Rico-based high-altitude balloon mission carrying multiple scientific payloads into the stratosphere.","highlights":["Targets a 100,000+ foot flight profile.","Supports five payload modules in a 2.5 kg payload envelope.","Expands LIFTS launch operations from mainland campaign work to Puerto Rico."],"objectives":["Collect environmental data through ascent, float, and descent.","Validate payload integration and recovery systems.","Train the next mission operations cohort at UPRM."]}'::jsonb),
  ('cubesat', 'CubeSat Program', 'in-progress', 3, '{"slug":"cubesat","name":"CubeSat Program","status":"in-progress","status_display":"In Progress","form_factor":"1U CubeSat","dimensions":"10x10x10 cm","mass":"<1.33 kg","target_orbit":"LEO (400km)","target_orbit_altitude":"~400 km LEO","mission_life":"~1 year","est_launch_year":2028,"est_launch_year_display":"2028","target_year":"2028","image":"https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1200&q=80","summary":"A long-range development program to design and build a student-led CubeSat at UPRM.","highlights":["Developing toward a 1U CubeSat platform.","Building subsystem experience through balloon payload work.","Targeting a future low Earth orbit mission."],"objectives":["Develop flight software, power, communications, structures, and payload subsystems.","Create a repeatable student satellite engineering pipeline.","Prepare the university team for future launch opportunities."]}'::jsonb)
) as seed(slug, name, status, sort_order, data)
on conflict (slug) do nothing;

insert into public.posts (title, category, date_display, published_at, summary)
select seed.title, seed.category, seed.date_display, seed.published_at, seed.summary
from (values
  ('ASCENT mission planning continues', 'Mission Update', 'January 2026', '2026-01-15T12:00:00Z'::timestamptz, 'The team is refining payload interfaces, launch operations, and recovery procedures for ASCENT.'),
  ('CubeSat program enters subsystem study phase', 'Program Update', 'Fall 2025', '2025-09-01T12:00:00Z'::timestamptz, 'Students are mapping requirements for power, communications, flight software, and structures.'),
  ('NEXO recovery validates operations workflow', 'Flight Result', 'April 2024', '2024-04-20T12:00:00Z'::timestamptz, 'The NEXO mission gave LIFTS hands-on launch, tracking, recovery, and post-flight analysis experience.')
) as seed(title, category, date_display, published_at, summary)
where not exists (select 1 from public.posts existing where existing.title = seed.title);

insert into public.site_content (key, data)
values
  ('home_intro', '{"title":"What is LIFTS?","description":"LIFTS is a student-led near-space research organization at UPRM. The team designs, builds, launches, tracks, and recovers high-altitude balloon payloads while developing the technical foundation for future CubeSat work from Puerto Rico."}'::jsonb),
  ('homepage', '{"hero_image":"https://images.unsplash.com/photo-1661705969607-cde73828023d?q=80&w=2832&auto=format&fit=crop","hero_credit_label":"Photo: Vimal S / Unsplash","hero_credit_url":"https://unsplash.com/photos/GBg3jyGS-Ug","primary_cta":"Explore Missions","secondary_cta":"Learn More About LIFTS","about_label":"About LIFTS","about_cta":"Learn More About LIFTS","mission_label":"Our Work","mission_title":"Mission Highlights","mission_subtitle":"Explore completed, upcoming, and in-progress missions pushing the boundaries of student-led near-space research.","mission_cta":"View All Missions","supporters_label":"Our Supporters","supporters_title":"Partners & Sponsors","supporters_subtitle":"Thank you to our sponsors and partners for supporting LIFTS and helping make student-led aerospace research possible.","answers_label":"Quick Answers","answers_title":"Near-Space Research at UPRM","answers_subtitle":"Concise answers for students, partners, search snippets, and AI-powered discovery.","answers":[{"question":"What is LIFTS?","answer":"LIFTS is a student-led near-space research organization at UPRM. The team designs, builds, launches, tracks, and recovers high-altitude balloon payloads while developing the technical foundation for future CubeSat work from Puerto Rico."},{"question":"What missions does LIFTS work on?","answer":"LIFTS works on high-altitude balloon missions, mission operations, payload development, and CubeSat research. Current programs include the completed NEXO eclipse balloon flight, the upcoming ASCENT Puerto Rico balloon mission, and a long-range 1U CubeSat development path."},{"question":"How can students, sponsors, or collaborators connect with LIFTS?","answer":"Students and collaborators can contact LIFTS at lifts@uprm.edu. The team welcomes interest in aerospace engineering, electronics, flight software, mission operations, outreach, sponsorship, media, and research collaboration."}],"programs_label":"Programs","programs_title":"A Practical Aerospace Pipeline","programs_subtitle":"Each program builds technical depth while supporting the next mission."}'::jsonb)
on conflict (key) do nothing;

insert into public.gallery (title, caption, image_url, sort_order)
select seed.title, seed.caption, seed.image_url, seed.sort_order
from (values
  ('NEXO Mission', 'High-altitude balloon research during the 2024 total solar eclipse.', 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=1200&q=80', 0),
  ('ASCENT Mission', 'Preparing the next generation of Puerto Rico-led near-space missions.', 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=1200&q=80', 1),
  ('CubeSat Program', 'Building the technical foundation for future student-led satellite missions.', 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1200&q=80', 2)
) as seed(title, caption, image_url, sort_order)
where not exists (select 1 from public.gallery);
