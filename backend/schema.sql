-- ==============================================================================
-- AgapAlert: Hydrological & Rain Risk Backend Database Schema
-- ==============================================================================

create extension if not exists "pgcrypto";

create table if not exists alerts (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  kind text not null check (kind in ('flash-flood', 'river-overflow', 'heavy-rainfall', 'typhoon', 'landslide-risk')),
  title text not null,
  area text not null,
  description text not null,
  severity text not null check (severity in ('critical', 'high', 'watch', 'advisory', 'normal')),
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
  minimum_severity text not null default 'watch' check (minimum_severity in ('critical', 'high', 'watch', 'advisory', 'normal')),
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

-- River water level gauge monitoring stations
create table if not exists river_monitoring_stations (
  id uuid primary key default gen_random_uuid(),
  station_id text not null unique,
  station_name text not null,
  river_basin text not null,
  latitude double precision not null,
  longitude double precision not null,
  current_level_meters double precision not null default 0.0,
  alert_level_meters double precision not null,
  critical_level_meters double precision not null,
  trend text not null default 'STABLE' check (trend in ('RISING', 'STABLE', 'FALLING')),
  rate_of_rise double precision default 0.0,
  last_updated timestamptz not null default now()
);

-- Time-series telemetry readings from IoT rain gauges & ultrasonic river sensors
create table if not exists sensor_telemetry_readings (
  id uuid primary key default gen_random_uuid(),
  station_id text not null references river_monitoring_stations(station_id) on delete cascade,
  sensor_type text not null check (sensor_type in ('water_level', 'rain_rate', 'soil_moisture', 'wind_speed')),
  value double precision not null,
  unit text not null,
  recorded_at timestamptz not null default now()
);

create index if not exists alerts_issued_at_idx on alerts (issued_at desc);
create index if not exists subscriptions_coordinates_idx on alert_subscriptions (latitude, longitude);
create index if not exists telemetry_station_time_idx on sensor_telemetry_readings (station_id, recorded_at desc);
