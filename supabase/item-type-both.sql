-- Additive migration: a third item type, 'both', for work that is *both*
-- research/knowledge AND an action item.
--
-- Run once in Supabase -> SQL Editor. Does NOT touch existing data: every
-- existing row stays 'learn' or 'build'.
--
-- Note: `alter type ... add value` cannot be used in the same transaction that
-- adds it, so this file only adds the value. Nothing else here depends on it.

alter type item_type add value if not exists 'both';
