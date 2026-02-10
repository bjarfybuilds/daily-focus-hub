
-- Drop foreign key constraints referencing auth.users
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
ALTER TABLE public.playbook_slots DROP CONSTRAINT IF EXISTS playbook_slots_user_id_fkey;
