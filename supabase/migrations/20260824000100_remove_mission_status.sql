-- Remove the mission lifecycle status from existing databases and content.
update public.missions
set data = data - 'status' - 'status_display';

update public.pending_changes
set payload = (payload - 'status' - 'status_display')
  || case
    when jsonb_typeof(payload->'data') = 'object'
      then jsonb_build_object('data', (payload->'data') - 'status' - 'status_display')
    else '{}'::jsonb
  end
where target_type = 'mission' and payload is not null;

alter table public.missions drop column if exists status;

update public.site_content
set data = jsonb_set(data, '{mission_subtitle}', to_jsonb('Explore student-led near-space missions pushing the boundaries of aerospace research.'::text))
where key = 'homepage'
  and data->>'mission_subtitle' = 'Explore completed, upcoming, and in-progress missions pushing the boundaries of student-led near-space research.';

update public.site_content
set data = jsonb_set(
  data,
  '{answers}',
  (
    select jsonb_agg(
      case
        when item->>'question' = 'What missions does LIFTS work on?'
          and item->>'answer' = 'LIFTS works on high-altitude balloon missions, mission operations, payload development, and CubeSat research. Current programs include the completed NEXO eclipse balloon flight, the upcoming ASCENT Puerto Rico balloon mission, and a long-range 1U CubeSat development path.'
          then jsonb_set(item, '{answer}', to_jsonb('LIFTS works on high-altitude balloon missions, mission operations, payload development, and CubeSat research. Current programs include NEXO, ASCENT, and a long-range 1U CubeSat development path.'::text))
        else item
      end
    )
    from jsonb_array_elements(data->'answers') as item
  )
)
where key = 'homepage' and jsonb_typeof(data->'answers') = 'array';
