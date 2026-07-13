create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text not null,
  cycle_days integer not null,
  last_purchased_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table products enable row level security;

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text not null,
  category text not null,
  price numeric(10, 2) not null,
  purchased_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table purchases enable row level security;

create table if not exists waste_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text not null,
  amount numeric(10, 2) not null default 0,
  wasted_at date not null default current_date,
  created_at timestamptz not null default now()
);

alter table waste_events enable row level security;

-- Family sharing: households + membership

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mi familia',
  invite_code text not null unique default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)),
  created_at timestamptz not null default now()
);

create table if not exists household_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  household_id uuid not null references households (id) on delete cascade,
  joined_at timestamptz not null default now()
);

alter table households enable row level security;
alter table household_members enable row level security;

create or replace function get_household_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select household_id from household_members where user_id = auth.uid()
$$;

create or replace function find_household_by_invite_code(code text)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from households where invite_code = upper(code)
$$;

drop policy if exists "Members can view their household" on households;
create policy "Members can view their household"
  on households for select
  using (id = get_household_id());

drop policy if exists "Members can update their household" on households;
create policy "Members can update their household"
  on households for update
  using (id = get_household_id());

drop policy if exists "Users can view their own membership" on household_members;
create policy "Users can view their own membership"
  on household_members for select
  using (user_id = auth.uid() or household_id = get_household_id());

drop policy if exists "Users can update their own membership" on household_members;
create policy "Users can update their own membership"
  on household_members for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Auto-provision a household for every new signup

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
begin
  insert into households (name) values ('Mi familia') returning id into new_household_id;
  insert into household_members (user_id, household_id) values (new.id, new_household_id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Backfill: give every existing user a household if they don't have one yet

do $$
declare
  u record;
  hh_id uuid;
begin
  for u in select id from auth.users where id not in (select user_id from household_members) loop
    insert into households (name) values ('Mi familia') returning id into hh_id;
    insert into household_members (user_id, household_id) values (u.id, hh_id);
  end loop;
end $$;

-- Scope products/purchases/waste_events by household instead of by individual user

alter table products add column if not exists household_id uuid references households (id) on delete cascade;
alter table purchases add column if not exists household_id uuid references households (id) on delete cascade;
alter table waste_events add column if not exists household_id uuid references households (id) on delete cascade;

update products p set household_id = hm.household_id
  from household_members hm where hm.user_id = p.user_id and p.household_id is null;
update purchases p set household_id = hm.household_id
  from household_members hm where hm.user_id = p.user_id and p.household_id is null;
update waste_events w set household_id = hm.household_id
  from household_members hm where hm.user_id = w.user_id and w.household_id is null;

alter table products alter column household_id set not null;
alter table purchases alter column household_id set not null;
alter table waste_events alter column household_id set not null;

drop policy if exists "Users can view own products" on products;
drop policy if exists "Users can insert own products" on products;
drop policy if exists "Users can update own products" on products;
drop policy if exists "Users can delete own products" on products;

create policy "Household members can view products"
  on products for select
  using (household_id = get_household_id());

create policy "Household members can insert products"
  on products for insert
  with check (household_id = get_household_id());

create policy "Household members can update products"
  on products for update
  using (household_id = get_household_id());

create policy "Household members can delete products"
  on products for delete
  using (household_id = get_household_id());

drop policy if exists "Users can view own purchases" on purchases;
drop policy if exists "Users can insert own purchases" on purchases;

create policy "Household members can view purchases"
  on purchases for select
  using (household_id = get_household_id());

create policy "Household members can insert purchases"
  on purchases for insert
  with check (household_id = get_household_id());

drop policy if exists "Users can view own waste events" on waste_events;
drop policy if exists "Users can insert own waste events" on waste_events;

create policy "Household members can view waste events"
  on waste_events for select
  using (household_id = get_household_id());

create policy "Household members can insert waste events"
  on waste_events for insert
  with check (household_id = get_household_id());