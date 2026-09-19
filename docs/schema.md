# MyPainter schema (Supabase — My Sites project)

Project: `jkampxliebnzsevvmqre` · Prefix: `mp_` (shared org with Invest; no table collisions)

## Conventions

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- Money: `numeric(10,2)` — never float
- Line items: `jsonb` — array of `{ name, description?, qty, unitPrice, unitCost?, optional? }`
- Timestamps: `created_at`, `updated_at` with trigger
- RLS: `auth.uid() = user_id` on all business tables

## mp_clients

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | owner |
| name | text | required |
| email | text | |
| phone | text | |
| address | text | |
| tags | text[] | default `{}` |
| status | text | `lead`, `active`, `inactive` |
| last_activity_at | timestamptz | |
| notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## mp_requests

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | |
| client_id | uuid | FK → mp_clients |
| title | text | |
| requested_on | date | |
| service_details | text | |
| images | jsonb | `[{ path, caption? }]` |
| assessment_at | timestamptz | optional on-site visit |
| line_items | jsonb | |
| subtotal | numeric(10,2) | |
| status | text | `draft`, `open`, `approved`, `closed` |
| internal_notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## mp_quotes

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | |
| client_id | uuid | FK |
| request_id | uuid | FK nullable |
| number | text | `MP-131` format, unique per user |
| title | text | |
| quote_date | date | |
| valid_until | date | |
| line_items | jsonb | |
| discount | numeric(10,2) | default 0 |
| subtotal | numeric(10,2) | |
| gst | numeric(10,2) | 15% |
| total | numeric(10,2) | |
| terms | text | default 30-day validity |
| status | text | `draft`, `sent`, `approved`, `declined` |
| internal_notes | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## mp_quote_seq

| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | PK |
| next_num | integer | seed **131** |

## mp_jobs

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | |
| client_id | uuid | FK |
| quote_id | uuid | FK nullable |
| number | text | job number |
| title | text | |
| visits | jsonb | schedule blocks |
| billing_flags | jsonb | |
| line_items | jsonb | includes unit_cost + unit_price |
| subtotal_cost | numeric(10,2) | |
| subtotal_price | numeric(10,2) | |
| status | text | `scheduled`, `active`, `completed` |
| notes | text | |
| attachments | jsonb | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## mp_invoices

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | |
| client_id | uuid | FK |
| job_id | uuid | FK nullable |
| number | text | |
| subject | text | default "For Services Rendered" |
| issued_date | date | |
| payment_terms | text | |
| line_items | jsonb | |
| subtotal | numeric(10,2) | |
| gst | numeric(10,2) | |
| total | numeric(10,2) | |
| balance | numeric(10,2) | |
| paid_at | timestamptz | |
| status | text | `draft`, `sent`, `paid`, `overdue` |
| attachments | jsonb | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## mp_expenses

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | |
| job_id | uuid | FK nullable |
| amount | numeric(10,2) | |
| gst_inclusive | boolean | default true |
| category | text | enum below |
| description | text | |
| expense_date | date | |
| receipt_path | text | Storage path |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**category enum:** `COGS_Materials`, `Motor_Vehicle`, `Tools_Equipment`, `Subcontractors`, `Admin_Insurance`

## mp_crew_timesheets

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | owner |
| crew_member | text | name |
| job_id | uuid | FK nullable |
| check_in_time | timestamptz | |
| check_out_time | timestamptz | |
| duration_seconds | integer | |
| geo | jsonb | lat/lng if available |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## mp_revenue_goals

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | |
| period_start | date | |
| period_end | date | |
| target_amount | numeric(10,2) | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## mp_pipeline_opportunities

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | |
| client_id | uuid | FK nullable |
| title | text | |
| stage | text | kanban column |
| deal_value | numeric(10,2) | |
| assigned_to | text | |
| address | text | |
| outcome | text | `won`, `lost`, null |
| outcome_reason | text | |
| sort_order | integer | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

## mp_gallery_albums / mp_gallery_photos

Migrated from Cloudflare D1 (Phase 2). Public read when `published = true`.

**mp_gallery_albums:** id, user_id, slug, title, sort_order, published, created_at, updated_at

**mp_gallery_photos:** id, user_id, album_id, storage_path, caption, alt_text, sort_order, created_at, updated_at

## Storage buckets

| Bucket | Access |
|--------|--------|
| `mypainter-gallery` | public read published; owner write |
| `mypainter-receipts` | owner only |
