insert into public.matches (match_no, stage, group_name, home_team, away_team, match_date)
values
(1, 'Gironi', 'A', 'Messico', 'Sudafrica', '2026-06-11 21:00:00+00'),
(2, 'Gironi', 'A', 'Canada', 'Qatar', '2026-06-12 21:00:00+00'),
(3, 'Gironi', 'B', 'Brasile', 'Italia', '2026-06-13 21:00:00+00')
on conflict do nothing;
