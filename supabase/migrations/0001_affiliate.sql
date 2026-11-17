create table partners (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name))>0),
 owner text not null default '', status text not null default 'active' check(status in ('active','paused')),
 agreement_ref text not null default '', review_on date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index partners_name on partners(lower(name));
create table offers (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name))>0),
 owner text not null default '', terms_ref text not null default '', status text not null default 'active' check(status in ('active','paused')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index offers_name on offers(lower(name));
create table conversions (
 id uuid primary key default gen_random_uuid(), source_event_id text not null unique check(length(trim(source_event_id))>0),
 transaction_id text not null, partner_id uuid not null references partners(id), offer_id uuid not null references offers(id),
 occurred_at timestamptz not null, source_status text not null check(source_status in ('approved','pending','rejected')),
 decision text not null default 'pending' check(decision in ('approved','pending','rejected')),
 currency text not null check(currency ~ '^[A-Z]{3}$'),
 revenue_cents bigint not null check(abs(revenue_cents)<=1000000000000), payout_cents bigint not null check(abs(payout_cents)<=1000000000000),
 sale_cents bigint not null check(abs(sale_cents)<=1000000000000),
 due_on date not null, retain_until date not null, source_ref text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index conversions_partner on conversions(partner_id);
create index conversions_transaction on conversions(transaction_id);
create table disclosures (
 id uuid primary key default gen_random_uuid(), partner_id uuid not null references partners(id),
 placement text not null check(length(trim(placement))>0), market text not null check(market in ('NZ','AU','other')),
 outcome text not null check(outcome in ('clear','missing','needs-review')), evidence_ref text not null,
 checked_on date not null, review_on date not null check(review_on>=checked_on),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table disputes (
 id uuid primary key default gen_random_uuid(), conversion_id uuid not null references conversions(id),
 reason text not null, owner text not null, due_on date not null,
 status text not null default 'open' check(status in ('open','closed')), resolution text not null default '', evidence_ref text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index one_open_dispute on disputes(conversion_id) where status='open';
create table decisions (
 id uuid primary key default gen_random_uuid(), conversion_id uuid not null references conversions(id),
 decision text not null check(decision in ('approved','pending','rejected')), operator text not null, reason text not null, evidence_ref text not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table activity (
 id uuid primary key default gen_random_uuid(), action text not null, entity text not null, entity_id uuid,
 operator text not null, reason text not null, evidence_ref text not null, before_record jsonb, after_record jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now();return new;end $$;
do $$ declare t text; begin foreach t in array array['partners','offers','conversions','disclosures','disputes','decisions','activity'] loop
 execute format('create trigger touch before update on %I for each row execute function touch_updated_at()',t);
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
end loop;end $$;
create view conversion_review with (security_invoker=true) as
select c.*, p.name partner, p.owner partner_owner, p.status partner_status, o.name offer,
 c.revenue_cents-c.payout_cents margin_cents,
 greatest(current_date-c.due_on,0) overdue_days,
 exists(select 1 from disputes d where d.conversion_id=c.id and d.status='open') disputed
from conversions c join partners p on p.id=c.partner_id join offers o on o.id=c.offer_id;
create view partner_balances with (security_invoker=true) as
select partner_id,partner,currency,count(*) conversions,
 count(*) filter(where decision='pending') pending,
 coalesce(sum(payout_cents) filter(where decision='approved' and source_status='approved' and not disputed),0) approved_payout_cents,
 coalesce(sum(revenue_cents-payout_cents) filter(where decision='approved' and source_status='approved' and not disputed),0) approved_margin_cents,
 coalesce(sum(payout_cents) filter(where decision='pending'),0) pending_payout_cents
from conversion_review group by partner_id,partner,currency;
create view disclosure_review with (security_invoker=true) as
select p.id partner_id,p.name partner,d.id disclosure_id,d.placement,d.market,d.outcome,d.evidence_ref,d.review_on
from partners p left join (
 select distinct on(partner_id,placement) * from disclosures order by partner_id,placement,checked_on desc,created_at desc,id desc
) d on d.partner_id=p.id
where p.status='active' and (d.id is null or d.outcome<>'clear' or d.review_on<current_date);
create view attention with (security_invoker=true) as
select 'conversion' kind,id,source_event_id reference,partner owner,due_on,'Pending decision' issue from conversion_review where decision='pending' and due_on<current_date
union all select 'dispute',d.id,c.source_event_id,d.owner,d.due_on,'Open dispute' from disputes d join conversions c on c.id=d.conversion_id where d.status='open'
union all select 'partner',id,name,owner,review_on,'Partner agreement review' from partners where status='active' and (review_on is null or review_on<current_date or agreement_ref='')
union all select 'retention',id,source_event_id,'Data owner',retain_until,'Retention decision due' from conversions where retain_until<current_date;
