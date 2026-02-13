
-- Drop the old permissive-to-all policies
DROP POLICY IF EXISTS "Allow all select on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow all insert on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow all update on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow all delete on tasks" ON public.tasks;

DROP POLICY IF EXISTS "Allow all select on playbook_slots" ON public.playbook_slots;
DROP POLICY IF EXISTS "Allow all insert on playbook_slots" ON public.playbook_slots;
DROP POLICY IF EXISTS "Allow all update on playbook_slots" ON public.playbook_slots;
DROP POLICY IF EXISTS "Allow all delete on playbook_slots" ON public.playbook_slots;

DROP POLICY IF EXISTS "Allow all select on task_logs" ON public.task_logs;
DROP POLICY IF EXISTS "Allow all insert on task_logs" ON public.task_logs;
DROP POLICY IF EXISTS "Allow all update on task_logs" ON public.task_logs;
DROP POLICY IF EXISTS "Allow all delete on task_logs" ON public.task_logs;

-- Tasks: user can only access their own
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Playbook slots: user can only access their own
CREATE POLICY "Users can view own slots" ON public.playbook_slots FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own slots" ON public.playbook_slots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own slots" ON public.playbook_slots FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own slots" ON public.playbook_slots FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Task logs: user can access logs for their own tasks
CREATE POLICY "Users can view own task logs" ON public.task_logs FOR SELECT TO authenticated USING (public.is_task_owner(task_id));
CREATE POLICY "Users can insert own task logs" ON public.task_logs FOR INSERT TO authenticated WITH CHECK (public.is_task_owner(task_id));
CREATE POLICY "Users can update own task logs" ON public.task_logs FOR UPDATE TO authenticated USING (public.is_task_owner(task_id));
CREATE POLICY "Users can delete own task logs" ON public.task_logs FOR DELETE TO authenticated USING (public.is_task_owner(task_id));
