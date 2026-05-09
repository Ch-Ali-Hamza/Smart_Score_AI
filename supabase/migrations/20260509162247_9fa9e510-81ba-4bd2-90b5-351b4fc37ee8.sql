create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('student','teacher','admin')),
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  student_id_number text not null,
  class text not null default 'Unassigned',
  section text not null default 'A',
  created_at timestamptz not null default now()
);
create index if not exists students_user_id_idx on public.students(user_id);

create table if not exists public.marks (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  subject text not null,
  marks_obtained numeric not null,
  total_marks numeric not null,
  exam_type text not null,
  entered_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists marks_student_idx on public.marks(student_id);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null,
  status text not null check (status in ('present','absent')),
  marked_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, date)
);
create index if not exists attendance_student_idx on public.attendance(student_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  message text not null,
  type text not null default 'system',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  predicted_score numeric not null,
  prediction_date timestamptz not null default now()
);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  status text not null check (status in ('Success','Failed','Pending')),
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.students enable row level security;
alter table public.marks enable row level security;
alter table public.attendance enable row level security;
alter table public.notifications enable row level security;
alter table public.predictions enable row level security;
alter table public.logs enable row level security;

create policy "users read all" on public.users for select to authenticated using (true);
create policy "users insert self" on public.users for insert to authenticated with check (auth.uid() = id);
create policy "users update self" on public.users for update to authenticated using (auth.uid() = id);
create policy "users delete self" on public.users for delete to authenticated using (auth.uid() = id);

create policy "students read all" on public.students for select to authenticated using (true);
create policy "students insert auth" on public.students for insert to authenticated with check (true);
create policy "students update self" on public.students for update to authenticated using (auth.uid() = user_id);
create policy "students delete self" on public.students for delete to authenticated using (auth.uid() = user_id);

create policy "marks read all" on public.marks for select to authenticated using (true);
create policy "marks insert auth" on public.marks for insert to authenticated with check (true);
create policy "marks update auth" on public.marks for update to authenticated using (true);
create policy "marks delete auth" on public.marks for delete to authenticated using (true);

create policy "att read all" on public.attendance for select to authenticated using (true);
create policy "att insert auth" on public.attendance for insert to authenticated with check (true);
create policy "att update auth" on public.attendance for update to authenticated using (true);
create policy "att delete auth" on public.attendance for delete to authenticated using (true);

create policy "notif read all" on public.notifications for select to authenticated using (true);
create policy "notif insert auth" on public.notifications for insert to authenticated with check (true);
create policy "notif update self" on public.notifications for update to authenticated using (auth.uid() = user_id);
create policy "notif delete self" on public.notifications for delete to authenticated using (auth.uid() = user_id);

create policy "pred read all" on public.predictions for select to authenticated using (true);
create policy "pred insert auth" on public.predictions for insert to authenticated with check (true);
create policy "pred update auth" on public.predictions for update to authenticated using (true);
create policy "pred delete auth" on public.predictions for delete to authenticated using (true);

create policy "logs read all" on public.logs for select to authenticated using (true);
create policy "logs insert auth" on public.logs for insert to authenticated with check (true);