create index if not exists users_role_idx on public.users (role);
create index if not exists users_created_at_idx on public.users (created_at desc);
create index if not exists logs_created_at_idx on public.logs (created_at desc);
create index if not exists logs_user_id_created_at_idx on public.logs (user_id, created_at desc);
create index if not exists marks_student_created_at_idx on public.marks (student_id, created_at);
create index if not exists attendance_student_date_idx on public.attendance (student_id, date desc);
create index if not exists attendance_student_status_idx on public.attendance (student_id, status);