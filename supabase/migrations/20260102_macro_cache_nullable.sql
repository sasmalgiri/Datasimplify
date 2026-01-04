-- Ensure macro_data_cache columns are nullable to represent missing data truthfully
-- (Safe to run even if columns are already nullable)

alter table if exists public.macro_data_cache
  alter column value drop not null,
  alter column previous_value drop not null,
  alter column change drop not null,
  alter column source drop not null;
