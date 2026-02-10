
-- Drop existing restrictive RLS policies on tasks
DROP POLICY IF EXISTS "Users can create own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;

-- Create open policies for personal use
CREATE POLICY "Allow all select on tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow all insert on tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on tasks" ON public.tasks FOR DELETE USING (true);

-- Drop existing restrictive RLS policies on task_logs
DROP POLICY IF EXISTS "Users can create logs for own tasks" ON public.task_logs;
DROP POLICY IF EXISTS "Users can delete own task logs" ON public.task_logs;
DROP POLICY IF EXISTS "Users can update own task logs" ON public.task_logs;
DROP POLICY IF EXISTS "Users can view own task logs" ON public.task_logs;

-- Create open policies for personal use
CREATE POLICY "Allow all select on task_logs" ON public.task_logs FOR SELECT USING (true);
CREATE POLICY "Allow all insert on task_logs" ON public.task_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on task_logs" ON public.task_logs FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on task_logs" ON public.task_logs FOR DELETE USING (true);

-- Drop existing restrictive RLS policies on playbook_slots
DROP POLICY IF EXISTS "Users can create own slots" ON public.playbook_slots;
DROP POLICY IF EXISTS "Users can delete own slots" ON public.playbook_slots;
DROP POLICY IF EXISTS "Users can update own slots" ON public.playbook_slots;
DROP POLICY IF EXISTS "Users can view own slots" ON public.playbook_slots;

-- Create open policies for personal use
CREATE POLICY "Allow all select on playbook_slots" ON public.playbook_slots FOR SELECT USING (true);
CREATE POLICY "Allow all insert on playbook_slots" ON public.playbook_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on playbook_slots" ON public.playbook_slots FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on playbook_slots" ON public.playbook_slots FOR DELETE USING (true);
