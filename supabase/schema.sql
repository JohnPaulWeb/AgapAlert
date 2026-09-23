-- ==============================================================================
-- AgapAlert: Real-Time Evacuation Center & Relief Resource Registry
-- Database Schema for Supabase (PostgreSQL with RLS & Realtime)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. BARANGAYS REGISTRY
create table if not exists public.barangays (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  city text not null,
  province text not null default 'Metro Manila',
  hotline text,
  river_basin text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. USER PROFILES (Linked to Supabase auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('resident', 'official')),
  barangay_id uuid references public.barangays(id) on delete set null,
  status text not null default 'active' check (status in ('pending', 'active', 'suspended')),
  verification_doc_url text, -- For official verification (Barangay ID / Appointment letter)
  phone_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. EVACUATION CENTERS
create table if not exists public.evacuation_centers (
  id uuid primary key default uuid_generate_v4(),
  barangay_id uuid not null references public.barangays(id) on delete cascade,
  name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  capacity integer not null default 100,
  current_occupancy integer not null default 0,
  status text not null default 'open' check (status in ('open', 'limited', 'full', 'closed')),
  elevation_notes text,
  contact_number text,
  features text[] default array[]::text[], -- e.g. ['Medical Aid', 'Pet Friendly', 'High Ground', 'Generator Power']
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. RELIEF INVENTORY
create table if not exists public.relief_inventory (
  id uuid primary key default uuid_generate_v4(),
  center_id uuid not null references public.evacuation_centers(id) on delete cascade,
  item_name text not null, -- e.g. 'Drinking Water', 'Ready-to-eat Rice', 'Hygiene Kits', 'Infant Formula'
  stock_status text not null default 'stocked' check (stock_status in ('stocked', 'running_low', 'critical', 'out_of_stock')),
  quantity_notes text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. INCIDENT REPORTS & EMERGENCY SOS
create table if not exists public.incident_reports (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  barangay_id uuid not null references public.barangays(id) on delete cascade,
  category text not null check (category in ('sos', 'flood', 'relief', 'medical', 'debris', 'hazard')),
  title text not null,
  details text not null,
  latitude double precision,
  longitude double precision,
  location_landmark text not null,
  contact_number text,
  priority text not null default 'HIGH' check (priority in ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  status text not null default 'NEW' check (status in ('NEW', 'ACKNOWLEDGED', 'DISPATCHED', 'RESOLVED')),
  action_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. PUBLIC ADVISORIES & TYPHOON WARNINGS
create table if not exists public.advisories (
  id uuid primary key default uuid_generate_v4(),
  barangay_id uuid not null references public.barangays(id) on delete cascade,
  signal_level integer default 1 check (signal_level between 1 and 5),
  title text not null,
  message text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- TRIGGERS & AUTOMATION
-- ==============================================================================

-- Trigger: Automatically insert row in public.profiles when auth user is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, barangay_id, status, verification_doc_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'AgapAlert User'),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'resident'),
    (new.raw_user_meta_data->>'barangay_id')::uuid,
    case
      when coalesce(new.raw_user_meta_data->>'role', 'resident') = 'official' then 'pending'
      else 'active'
    end,
    new.raw_user_meta_data->>'verification_doc_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger: Automatically update timestamps on row changes
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create or replace trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace trigger set_reports_updated_at
  before update on public.incident_reports
  for each row execute function public.set_updated_at();

create or replace function public.set_center_updated_at()
returns trigger as $$
begin
  new.last_updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create or replace trigger set_evac_center_updated_at
  before update on public.evacuation_centers
  for each row execute function public.set_center_updated_at();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enforcing strict Query-Level RBAC as defined in the AgapAlert Plan
-- ==============================================================================

alter table public.barangays enable row level security;
alter table public.profiles enable row level security;
alter table public.evacuation_centers enable row level security;
alter table public.relief_inventory enable row level security;
alter table public.incident_reports enable row level security;
alter table public.advisories enable row level security;

-- 1. BARANGAYS POLICIES
create policy "Barangays are readable by authenticated users"
  on public.barangays for select
  to authenticated
  using (true);

-- 2. PROFILES POLICIES
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- 3. EVACUATION CENTERS POLICIES
-- All authenticated users can view centers
create policy "Evacuation centers viewable by all authenticated users"
  on public.evacuation_centers for select
  to authenticated
  using (true);

-- Only verified active officials can manage centers in their own barangay
create policy "Officials can insert centers for their own barangay"
  on public.evacuation_centers for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'official'
        and profiles.status = 'active'
        and profiles.barangay_id = evacuation_centers.barangay_id
    )
  );

create policy "Officials can update centers in their own barangay"
  on public.evacuation_centers for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'official'
        and profiles.status = 'active'
        and profiles.barangay_id = evacuation_centers.barangay_id
    )
  );

-- 4. RELIEF INVENTORY POLICIES
create policy "Relief inventory viewable by all authenticated users"
  on public.relief_inventory for select
  to authenticated
  using (true);

create policy "Officials can update inventory for centers in their barangay"
  on public.relief_inventory for all
  to authenticated
  using (
    exists (
      select 1 from public.evacuation_centers
      join public.profiles on profiles.barangay_id = evacuation_centers.barangay_id
      where evacuation_centers.id = relief_inventory.center_id
        and profiles.id = auth.uid()
        and profiles.role = 'official'
        and profiles.status = 'active'
    )
  );

-- 5. INCIDENT REPORTS POLICIES
-- Residents can view their own reports
-- Officials can view all reports filed in their assigned barangay
create policy "View incident reports based on scope"
  on public.incident_reports for select
  to authenticated
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'official'
        and profiles.status = 'active'
        and profiles.barangay_id = incident_reports.barangay_id
    )
  );

-- Any authenticated user can submit an incident report
create policy "Authenticated users can create incident reports"
  on public.incident_reports for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Only officials of the assigned barangay can update report status
create policy "Officials can acknowledge or resolve reports in their barangay"
  on public.incident_reports for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'official'
        and profiles.status = 'active'
        and profiles.barangay_id = incident_reports.barangay_id
    )
  );

-- 6. ADVISORIES POLICIES
create policy "Advisories viewable by all authenticated users"
  on public.advisories for select
  to authenticated
  using (true);

create policy "Officials can post advisories for their barangay"
  on public.advisories for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'official'
        and profiles.status = 'active'
        and profiles.barangay_id = advisories.barangay_id
    )
  );

-- ==============================================================================
-- ENABLE SUPABASE REALTIME REPLICATION
-- Real-time broadcast for Evacuation Centers, Inventory, and Incident Reports
-- ==============================================================================

alter publication supabase_realtime add table public.evacuation_centers;
alter publication supabase_realtime add table public.relief_inventory;
alter publication supabase_realtime add table public.incident_reports;
alter publication supabase_realtime add table public.advisories;

-- ==============================================================================
-- INITIAL SEED DATA (Philippine LGUs & Evacuation Centers)
-- ==============================================================================

-- Seed Barangays
insert into public.barangays (id, name, city, province, hotline, river_basin) values
  ('b0000000-0000-0000-0000-000000000001', 'Dalongue', 'Santa Barbara', 'Pangasinan', '(075) 518-2024', 'Sinocalan River Basin'),
  ('b0000000-0000-0000-0000-000000000002', 'Poblacion Sur', 'Santa Barbara', 'Pangasinan', '0917-508-1122', 'Sinocalan River Basin'),
  ('b0000000-0000-0000-0000-000000000003', 'Tuliao', 'Santa Barbara', 'Pangasinan', '0920-911-3344', 'Sinocalan River Basin'),
  ('b1111111-1111-1111-1111-111111111111', 'Sto. Niño', 'Marikina City', 'Metro Manila', '(02) 8646-1633', 'Marikina River Basin'),
  ('b2222222-2222-2222-2222-222222222222', 'Concepcion Uno', 'Marikina City', 'Metro Manila', '(02) 8941-2290', 'Marikina River Basin'),
  ('b3333333-3333-3333-3333-333333333333', 'San Roque', 'Marikina City', 'Metro Manila', '(02) 8646-0812', 'Marikina River Basin'),
  ('b4444444-4444-4444-4444-444444444444', 'Loyola Heights', 'Quezon City', 'Metro Manila', '(02) 8928-1144', 'San Mateo River'),
  ('b5555555-5555-5555-5555-555555555555', 'Santolan', 'Pasig City', 'Metro Manila', '(02) 8641-0022', 'Pasig-Manggahan Floodway')
on conflict (id) do nothing;

-- Seed Evacuation Centers
insert into public.evacuation_centers (id, barangay_id, name, address, latitude, longitude, capacity, current_occupancy, status, elevation_notes, contact_number, features) values
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Dalongue Barangay Evacuation Hall', 'Barangay Road, Dalongue, Santa Barbara, Pangasinan', 16.0034, 120.3850, 180, 42, 'open', '18m High Ground', '(075) 518-2024', array['Medical Aid', 'High Ground', 'Generator Power', 'Rescue Boats']),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Santa Barbara Multi-Purpose Gymnasium', 'Poblacion Sur, Santa Barbara, Pangasinan', 15.9982, 120.4015, 350, 110, 'open', '22m High Elevation', '0917-508-1122', array['Medical Aid', 'Pet Friendly', 'High Ground', 'Solar Backup']),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Tuliao Disaster Evacuation Center', 'Tuliao Highway, Santa Barbara, Pangasinan', 16.0120, 120.3780, 220, 65, 'open', '20m Elevation', '0920-911-3344', array['Medical Aid', 'Pet Friendly', 'High Ground']),
  ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Marikina Sports Center Complex', 'Sumulong Highway, Sto. Niño, Marikina City', 14.6339, 121.0963, 220, 54, 'open', '24m High Elevation', '(02) 8646-1633', array['Medical Aid', 'Pet Friendly', 'High Ground', 'Generator Power']),
  ('c2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Concepcion Elementary School', 'J.P. Rizal St., Concepcion Uno, Marikina City', 14.6543, 121.1084, 200, 132, 'open', '21m Elevation', '(02) 8941-2290', array['Medical Aid', 'High Ground'])
on conflict (id) do nothing;

-- 7. RIVER GAUGE MONITORING STATIONS & TELEMETRY
create table if not exists public.river_stations (
  id uuid primary key default uuid_generate_v4(),
  station_id text not null unique,
  station_name text not null,
  river_basin text not null,
  barangay_id uuid references public.barangays(id) on delete set null,
  latitude double precision not null,
  longitude double precision not null,
  current_level_meters double precision not null default 0.0,
  alert_level_meters double precision not null,
  critical_level_meters double precision not null,
  trend text not null default 'STABLE' check (trend in ('RISING', 'STABLE', 'FALLING')),
  rate_of_rise double precision default 0.0,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.sensor_readings (
  id uuid primary key default uuid_generate_v4(),
  station_id text not null references public.river_stations(station_id) on delete cascade,
  sensor_type text not null check (sensor_type in ('water_level', 'rain_rate', 'soil_moisture', 'wind_speed')),
  value double precision not null,
  unit text not null,
  recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.river_stations enable row level security;
alter table public.sensor_readings enable row level security;

create policy "River stations readable by all authenticated users"
  on public.river_stations for select
  to authenticated
  using (true);

create policy "Sensor readings readable by all authenticated users"
  on public.sensor_readings for select
  to authenticated
  using (true);

alter publication supabase_realtime add table public.river_stations;
alter publication supabase_realtime add table public.sensor_readings;

-- Seed River Gauge Stations
insert into public.river_stations (id, station_id, station_name, river_basin, barangay_id, latitude, longitude, current_level_meters, alert_level_meters, critical_level_meters, trend, rate_of_rise) values
  ('s0000000-0000-0000-0000-000000000001', 'sinocalan-sb-01', 'Sinocalan River - Santa Barbara Bridge Gauge', 'Sinocalan River Basin', 'b0000000-0000-0000-0000-000000000001', 16.0034, 120.3850, 5.82, 5.20, 6.80, 'RISING', 0.18),
  ('s1111111-1111-1111-1111-111111111111', 'marikina-sto-nino-02', 'Marikina River - Sto. Niño Water Level Gauge', 'Marikina River Basin', 'b1111111-1111-1111-1111-111111111111', 14.6339, 121.0963, 16.40, 15.00, 18.00, 'RISING', 0.35),
  ('s2222222-2222-2222-2222-222222222222', 'pasig-floodway-03', 'Manggahan Floodway - Pasig Sluice Gate', 'Pasig-Manggahan Floodway', 'b5555555-5555-5555-5555-555555555555', 14.5764, 121.0851, 12.80, 13.50, 15.50, 'STABLE', 0.02)
on conflict (station_id) do nothing;

