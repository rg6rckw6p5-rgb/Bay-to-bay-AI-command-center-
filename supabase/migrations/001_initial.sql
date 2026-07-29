create extension if not exists "pgcrypto";

create type public.organization_kind as enum ('business', 'nonprofit');
create type public.conversation_mode as enum ('ai', 'human', 'paused');
create type public.message_direction as enum ('inbound', 'outbound');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  kind public.organization_kind not null default 'business',
  sms_number text unique,
  ai_instructions text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','manager','agent','viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  first_name text,
  last_name text,
  phone text not null,
  email text,
  address jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, phone)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  channel text not null check (channel in ('sms','web','phone')),
  mode public.conversation_mode not null default 'ai',
  assigned_user_id uuid references auth.users(id),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (organization_id, contact_id, channel)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction public.message_direction not null,
  body text not null,
  provider_message_id text unique,
  status text not null,
  ai_generated boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.sms_consents (
  phone text primary key,
  status text not null check (status in ('opted_in','opted_out')),
  source text not null,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id),
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index conversations_last_message_idx on public.conversations (organization_id, last_message_at desc);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at desc);
create index contacts_phone_idx on public.contacts (phone);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.sms_consents enable row level security;
alter table public.audit_logs enable row level security;

create function public.is_org_member(target_org uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_org and user_id = auth.uid()
  );
$$;

create policy "members read organizations" on public.organizations
for select using (public.is_org_member(id));
create policy "members read memberships" on public.organization_members
for select using (user_id = auth.uid() or public.is_org_member(organization_id));
create policy "members manage contacts" on public.contacts
for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members manage conversations" on public.conversations
for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members manage messages" on public.messages
for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "members read audit logs" on public.audit_logs
for select using (public.is_org_member(organization_id));

insert into public.organizations (name, slug, kind) values
('Bay to Bay Tree Services of Florida', 'tree-services', 'business'),
('Bay to Bay Premier Painting Co.', 'premier-painting', 'business'),
('Bay to Bay Docks & Decks', 'docks-decks', 'business'),
('Bay to Bay Landscaping', 'landscaping', 'business'),
('Bay to Bay ArborPro', 'arborpro', 'business'),
('Rise and Shine Charities & Ministries', 'rise-and-shine', 'nonprofit');
