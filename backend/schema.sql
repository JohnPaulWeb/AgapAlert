create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  kind text not null check (kind in ('flash-flood', 'typhoon')),
  title text not null,
  area text not null,
  description text not null,
  severity text not null check (severity in ('critical', 'high', 'watch')),
  issued_at timestamptz not null,
  source_url text not null,
  fingerprint text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  device_token text not null unique,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  radius_km double precision not null default 25 check (radius_km > 0 and radius_km <= 250),
  flash_floods boolean not null default true,
  typhoons boolean not null default true,
  minimum_severity text not null default 'watch' check (minimum_severity in ('critical', 'high', 'watch')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references alerts(id) on delete cascade,
  subscription_id uuid not null references alert_subscriptions(id) on delete cascade,
  status text not null check (status in ('queued', 'sent', 'failed')),
  sent_at timestamptz,
  provider_ticket_id text,
  unique (alert_id, subscription_id)
);

create index if not exists alerts_issued_at_idx on alerts (issued_at desc);
create index if not exists subscriptions_coordinates_idx on alert_subscriptions (latitude, longitude);
