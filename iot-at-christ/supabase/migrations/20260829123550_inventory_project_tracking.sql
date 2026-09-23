-- IoT at CHRIST — Hardware inventory and student project tracking
--
-- Adds quantity-aware inventory, accountable hardware loans, and progress
-- updates attached to the existing research_projects table.

-- ─────────────────────────────────────────────
-- Hardware catalogue
-- ─────────────────────────────────────────────

create table if not exists public.hardware_inventory (
  id                 uuid primary key default gen_random_uuid(),
  asset_code         text not null unique,
  name               text not null,
  category           text not null,
  model              text,
  description        text,
  storage_location   text,
  total_quantity     integer not null default 1 check (total_quantity >= 0),
  minimum_quantity   integer not null default 0 check (minimum_quantity >= 0),
  unit_cost_inr      numeric(10, 2) check (unit_cost_inr is null or unit_cost_inr >= 0),
  condition          text not null default 'usable'
                     check (condition in ('usable', 'needs_repair', 'retired')),
  created_by         uuid references public.profiles(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_hardware_inventory_category
  on public.hardware_inventory(category);

create index if not exists idx_hardware_inventory_name
  on public.hardware_inventory(name);

-- ─────────────────────────────────────────────
-- Hardware circulation
-- ─────────────────────────────────────────────

create table if not exists public.hardware_loans (
  id                 uuid primary key default gen_random_uuid(),
  inventory_item_id  uuid not null references public.hardware_inventory(id),
  borrower_id        uuid not null references public.profiles(id),
  project_id         uuid references public.research_projects(id) on delete set null,
  issued_by          uuid not null references public.profiles(id),
  quantity           integer not null check (quantity > 0),
  returned_quantity  integer not null default 0
                     check (returned_quantity >= 0 and returned_quantity <= quantity),
  purpose            text,
  issued_at          timestamptz not null default now(),
  due_at             timestamptz,
  returned_at        timestamptz,
  return_notes       text,
  status             text not null default 'active'
                     check (status in (
                       'active', 'partially_returned', 'returned',
                       'overdue', 'lost', 'damaged'
                     )),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_hardware_loans_borrower
  on public.hardware_loans(borrower_id, status);

create index if not exists idx_hardware_loans_project
  on public.hardware_loans(project_id) where project_id is not null;

create index if not exists idx_hardware_loans_item_active
  on public.hardware_loans(inventory_item_id, status);

create index if not exists idx_hardware_loans_due
  on public.hardware_loans(due_at)
  where status in ('active', 'partially_returned', 'overdue');

-- Stop two simultaneous checkouts from allocating more units than exist.
-- This function uses the caller's privileges; inventory managers can see all
-- loans through RLS, so no SECURITY DEFINER bypass is required.
create or replace function public.validate_hardware_loan_quantity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  stock_total integer;
  already_out integer;
  requested_out integer;
begin
  if new.status = 'returned' then
    return new;
  end if;

  select total_quantity
    into stock_total
    from public.hardware_inventory
   where id = new.inventory_item_id
   for update;

  if stock_total is null then
    raise exception 'Inventory item does not exist';
  end if;

  select coalesce(sum(quantity - returned_quantity), 0)::integer
    into already_out
    from public.hardware_loans
   where inventory_item_id = new.inventory_item_id
     and status <> 'returned'
     and id is distinct from new.id;

  requested_out := new.quantity - new.returned_quantity;

  if already_out + requested_out > stock_total then
    raise exception 'Not enough stock available. Requested %, available %',
      requested_out, greatest(stock_total - already_out, 0);
  end if;

  return new;
end;
$$;

revoke all on function public.validate_hardware_loan_quantity() from public, anon, authenticated;

drop trigger if exists hardware_loan_quantity_guard on public.hardware_loans;
create trigger hardware_loan_quantity_guard
  before insert or update of inventory_item_id, quantity, returned_quantity, status
  on public.hardware_loans
  for each row
  execute function public.validate_hardware_loan_quantity();

-- ─────────────────────────────────────────────
-- Student project progress timeline
-- ─────────────────────────────────────────────

create table if not exists public.project_progress_updates (
  id                 uuid primary key default gen_random_uuid(),
  project_id         uuid not null references public.research_projects(id) on delete cascade,
  author_id          uuid not null references public.profiles(id),
  progress_percent   integer not null check (progress_percent between 0 and 100),
  status             text not null default 'in_progress'
                     check (status in ('planning', 'in_progress', 'blocked', 'testing', 'completed')),
  summary            text not null check (length(trim(summary)) > 0),
  accomplishments    text,
  blockers           text,
  next_steps         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_project_progress_updates_project
  on public.project_progress_updates(project_id, created_at desc);

create index if not exists idx_project_progress_updates_author
  on public.project_progress_updates(author_id, created_at desc);

-- ─────────────────────────────────────────────
-- Explicit Data API grants (required by new Supabase defaults)
-- ─────────────────────────────────────────────

grant select, insert, update, delete on table public.hardware_inventory to authenticated;
grant select, insert, update, delete on table public.hardware_loans to authenticated;
grant select, insert, update, delete on table public.project_progress_updates to authenticated;

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────

alter table public.hardware_inventory enable row level security;
alter table public.hardware_loans enable row level security;
alter table public.project_progress_updates enable row level security;

-- All signed-in users can browse the catalogue. Only inventory managers can
-- change it. WITH CHECK prevents a permitted UPDATE from producing a row the
-- manager is no longer authorized to write.
create policy "inventory_authenticated_read"
  on public.hardware_inventory for select
  to authenticated
  using (true);

create policy "inventory_staff_insert"
  on public.hardware_inventory for insert
  to authenticated
  with check (
    (select role from public.profiles where id = (select auth.uid()))
      in ('teacher', 'coordinator')
  );

create policy "inventory_staff_update"
  on public.hardware_inventory for update
  to authenticated
  using (
    (select role from public.profiles where id = (select auth.uid()))
      in ('teacher', 'coordinator')
  )
  with check (
    (select role from public.profiles where id = (select auth.uid()))
      in ('teacher', 'coordinator')
  );

create policy "inventory_staff_delete"
  on public.hardware_inventory for delete
  to authenticated
  using (
    (select role from public.profiles where id = (select auth.uid()))
      in ('teacher', 'coordinator')
  );

-- A student sees only their own checkouts. Staff manage all circulation.
create policy "loans_borrower_read"
  on public.hardware_loans for select
  to authenticated
  using (borrower_id = (select auth.uid()));

create policy "loans_staff_read"
  on public.hardware_loans for select
  to authenticated
  using (
    (select role from public.profiles where id = (select auth.uid()))
      in ('teacher', 'coordinator')
  );

create policy "loans_staff_insert"
  on public.hardware_loans for insert
  to authenticated
  with check (
    issued_by = (select auth.uid())
    and (select role from public.profiles where id = (select auth.uid()))
      in ('teacher', 'coordinator')
  );

create policy "loans_staff_update"
  on public.hardware_loans for update
  to authenticated
  using (
    (select role from public.profiles where id = (select auth.uid()))
      in ('teacher', 'coordinator')
  )
  with check (
    (select role from public.profiles where id = (select auth.uid()))
      in ('teacher', 'coordinator')
  );

create policy "loans_staff_delete"
  on public.hardware_loans for delete
  to authenticated
  using (
    (select role from public.profiles where id = (select auth.uid()))
      in ('teacher', 'coordinator')
  );

-- Students manage progress entries only for the project they own.
create policy "project_updates_owner_read"
  on public.project_progress_updates for select
  to authenticated
  using (
    exists (
      select 1 from public.research_projects project
      where project.id = project_id
        and project.owner_id = (select auth.uid())
    )
  );

create policy "project_updates_owner_insert"
  on public.project_progress_updates for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.research_projects project
      where project.id = project_id
        and project.owner_id = (select auth.uid())
    )
  );

create policy "project_updates_owner_update"
  on public.project_progress_updates for update
  to authenticated
  using (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.research_projects project
      where project.id = project_id
        and project.owner_id = (select auth.uid())
    )
  )
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.research_projects project
      where project.id = project_id
        and project.owner_id = (select auth.uid())
    )
  );

create policy "project_updates_owner_delete"
  on public.project_progress_updates for delete
  to authenticated
  using (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.research_projects project
      where project.id = project_id
        and project.owner_id = (select auth.uid())
    )
  );

-- Teachers/coordinators see every update. Supervisors see updates only for
-- projects actively assigned to them.
create policy "project_updates_staff_read"
  on public.project_progress_updates for select
  to authenticated
  using (
    (select role from public.profiles where id = (select auth.uid()))
      in ('teacher', 'coordinator')
  );

create policy "project_updates_supervisor_read"
  on public.project_progress_updates for select
  to authenticated
  using (
    exists (
      select 1 from public.project_supervisors assignment
      where assignment.project_id = project_id
        and assignment.supervisor_id = (select auth.uid())
        and assignment.active = true
    )
  );
