create table if not exists emails (
  id text primary key,
  owner text,
  subject text,
  sender text,
  snippet text,
  received_at timestamptz
);

create table if not exists ai_results (
  email_id text primary key references emails(id) on delete cascade,
  owner text,
  category text,
  priority text,
  confidence float,
  actions jsonb,
  extra jsonb
);
