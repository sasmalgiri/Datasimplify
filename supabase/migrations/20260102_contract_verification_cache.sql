-- Cache Sourcify contract verification lookups

create table if not exists public.contract_verification_cache (
  chain_id integer not null,
  address text not null,
  status text not null check (status in ('verified', 'not_verified')),
  match_type text,
  contract_name text,
  raw jsonb,
  updated_at timestamptz not null default now(),
  primary key (chain_id, address)
);

alter table public.contract_verification_cache enable row level security;

-- Public cache tables in this project are intentionally open.
create policy cvc_all on public.contract_verification_cache
  for all using (true) with check (true);
