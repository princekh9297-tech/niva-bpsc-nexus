create table if not exists niva_users (
  telegram_id text primary key,
  name text,
  nickname text,
  tone text default 'normal',
  intensity text default 'normal',
  mode text default 'auto',
  mood text default 'neutral',
  recent jsonb default '[]'::jsonb,
  interactions integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
