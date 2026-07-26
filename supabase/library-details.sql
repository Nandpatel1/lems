-- Additive migration: a free-form details/description field on library resources.
-- Run once in Supabase -> SQL Editor. Does NOT touch existing data.

alter table resources add column if not exists description text;
