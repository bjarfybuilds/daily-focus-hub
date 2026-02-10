
-- Tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'todo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Task log entries
CREATE TABLE public.task_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  entry TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Playbook slots (which task is in which slot)
CREATE TABLE public.playbook_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_number INT NOT NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  timer_state TEXT NOT NULL DEFAULT 'idle',
  time_remaining INT NOT NULL DEFAULT 3600,
  playbook_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, slot_number, playbook_date)
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playbook_slots ENABLE ROW LEVEL SECURITY;

-- Helper: check if user owns a task
CREATE OR REPLACE FUNCTION public.is_task_owner(_task_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tasks WHERE id = _task_id AND user_id = auth.uid()
  )
$$;

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Task logs policies
CREATE POLICY "Users can view own task logs" ON public.task_logs FOR SELECT USING (public.is_task_owner(task_id));
CREATE POLICY "Users can create logs for own tasks" ON public.task_logs FOR INSERT WITH CHECK (public.is_task_owner(task_id));
CREATE POLICY "Users can update own task logs" ON public.task_logs FOR UPDATE USING (public.is_task_owner(task_id));
CREATE POLICY "Users can delete own task logs" ON public.task_logs FOR DELETE USING (public.is_task_owner(task_id));

-- Playbook slots policies
CREATE POLICY "Users can view own slots" ON public.playbook_slots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own slots" ON public.playbook_slots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own slots" ON public.playbook_slots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own slots" ON public.playbook_slots FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for sync across devices
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.playbook_slots;
