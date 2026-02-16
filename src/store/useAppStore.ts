import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, BucketId, KanbanColumn, PlaybookSlot, Priority, TaskLogEntry } from '@/types/tasks';

const initialSlots: PlaybookSlot[] = Array.from({ length: 8 }, (_, i) => ({
  slotNumber: i + 1,
  task: null,
  timerState: 'idle',
  timeRemaining: 3600,
}));

export function useAppStore(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [slots, setSlots] = useState<PlaybookSlot[]>(initialSlots);
  const [activeBucket, setActiveBucket] = useState<BucketId | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load tasks from DB
  useEffect(() => {
    if (!userId) return;
    setLoading(true);

    const fetchData = async () => {
      // Fetch tasks with their log entries
      const { data: dbTasks } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      const { data: dbLogs } = await supabase
        .from('task_logs')
        .select('*')
        .order('created_at', { ascending: true });

      const { data: dbSlots } = await supabase
        .from('playbook_slots')
        .select('*')
        .eq('playbook_date', new Date().toISOString().split('T')[0]);

      // Map DB tasks to local Task type
      const logsByTask: Record<string, TaskLogEntry[]> = {};
      (dbLogs || []).forEach(log => {
        if (!logsByTask[log.task_id]) logsByTask[log.task_id] = [];
        logsByTask[log.task_id].push({ id: log.id, text: log.entry, createdAt: log.created_at });
      });

      const mappedTasks: Task[] = (dbTasks || [])
        .filter(t => {
          // Exclude tasks that are in playbook slots
          const inSlot = (dbSlots || []).some(s => s.task_id === t.id);
          return !inSlot;
        })
        .map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          priority: t.priority as Priority,
          column: t.status as KanbanColumn,
          bucketId: t.bucket_id as BucketId,
          createdAt: t.created_at,
          logEntries: logsByTask[t.id] || [],
        }));

      // Map playbook slots
      const mappedSlots = initialSlots.map(slot => {
        const dbSlot = (dbSlots || []).find(s => s.slot_number === slot.slotNumber);
        if (dbSlot?.task_id) {
          const dbTask = (dbTasks || []).find(t => t.id === dbSlot.task_id);
          if (dbTask) {
            return {
              ...slot,
              task: {
                id: dbTask.id,
                title: dbTask.title,
                description: dbTask.description || '',
                priority: dbTask.priority as Priority,
                column: 'in-progress' as KanbanColumn,
                bucketId: dbTask.bucket_id as BucketId,
                createdAt: dbTask.created_at,
                logEntries: logsByTask[dbTask.id] || [],
              },
              timerState: dbSlot.timer_state as PlaybookSlot['timerState'],
              timeRemaining: dbSlot.time_remaining,
            };
          }
        }
        return slot;
      });

      setTasks(mappedTasks);
      setSlots(mappedSlots);
      setLoading(false);
    };

    fetchData();

    // Realtime subscription for cross-device sync
    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_logs' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'playbook_slots' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const addTask = useCallback(async (bucketId: BucketId, title: string, description: string, priority: Priority) => {
    if (!userId) return;
    const { data, error } = await supabase.from('tasks').insert({
      user_id: userId,
      bucket_id: bucketId,
      title,
      description,
      priority,
      status: 'todo',
    }).select().single();

    if (data && !error) {
      setTasks(prev => [...prev, {
        id: data.id, title, description, priority,
        column: 'todo', bucketId, createdAt: data.created_at, logEntries: [],
      }]);
    }
  }, [userId]);

  const updateTaskColumn = useCallback(async (taskId: string, column: KanbanColumn) => {
    await supabase.from('tasks').update({ status: column }).eq('id', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, column } : t));
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    await supabase.from('tasks').delete().eq('id', taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setSlots(prev => prev.map(s => s.task?.id === taskId ? { ...s, task: null, timerState: 'idle', timeRemaining: 3600 } : s));
  }, []);

  const moveTaskToSlot = useCallback(async (taskId: string, slotNumber: number) => {
    if (!userId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    await supabase.from('tasks').update({ status: 'in-progress' }).eq('id', taskId);

    const today = new Date().toISOString().split('T')[0];
    await supabase.from('playbook_slots').upsert({
      user_id: userId,
      slot_number: slotNumber,
      task_id: taskId,
      timer_state: 'idle',
      time_remaining: 3600,
      playbook_date: today,
    }, { onConflict: 'user_id,slot_number,playbook_date' });

    setTasks(prev => prev.filter(t => t.id !== taskId));
    setSlots(prev => prev.map(s =>
      s.slotNumber === slotNumber ? { ...s, task: { ...task, column: 'in-progress' }, timerState: 'idle', timeRemaining: 3600 } : s
    ));
  }, [userId, tasks]);

  const removeTaskFromSlot = useCallback(async (slotNumber: number) => {
    const slot = slots.find(s => s.slotNumber === slotNumber);
    if (slot?.task) {
      await supabase.from('tasks').update({ status: 'done' }).eq('id', slot.task.id);
      setTasks(prev => [...prev, { ...slot.task!, column: 'done' }]);
    }

    const today = new Date().toISOString().split('T')[0];
    if (userId) {
      await supabase.from('playbook_slots').delete()
        .eq('user_id', userId).eq('slot_number', slotNumber).eq('playbook_date', today);
    }

    setSlots(prev => prev.map(s => s.slotNumber === slotNumber ? { ...s, task: null, timerState: 'idle', timeRemaining: 3600 } : s));
  }, [slots, userId]);

  const returnTaskToBucket = useCallback(async (slotNumber: number) => {
    const slot = slots.find(s => s.slotNumber === slotNumber);
    if (slot?.task) {
      await supabase.from('tasks').update({ status: 'todo' }).eq('id', slot.task.id);
      setTasks(prev => [...prev, { ...slot.task!, column: 'todo' }]);
    }

    const today = new Date().toISOString().split('T')[0];
    if (userId) {
      await supabase.from('playbook_slots').delete()
        .eq('user_id', userId).eq('slot_number', slotNumber).eq('playbook_date', today);
    }

    setSlots(prev => prev.map(s => s.slotNumber === slotNumber ? { ...s, task: null, timerState: 'idle', timeRemaining: 3600 } : s));
  }, [slots, userId]);

  const moveSlotToSlot = useCallback(async (fromSlotNumber: number, toSlotNumber: number) => {
    if (!userId) return;
    const fromSlot = slots.find(s => s.slotNumber === fromSlotNumber);
    if (!fromSlot?.task) return;
    const toSlot = slots.find(s => s.slotNumber === toSlotNumber);

    const fromTask = fromSlot.task;
    const toTask = toSlot?.task || null;
    const today = new Date().toISOString().split('T')[0];

    // Update from-slot: swap in toTask or clear it
    if (toTask) {
      await supabase.from('playbook_slots').upsert({
        user_id: userId,
        slot_number: fromSlotNumber,
        task_id: toTask.id,
        timer_state: toSlot!.timerState,
        time_remaining: toSlot!.timeRemaining,
        playbook_date: today,
      }, { onConflict: 'user_id,slot_number,playbook_date' });
    } else {
      await supabase.from('playbook_slots').delete()
        .eq('user_id', userId).eq('slot_number', fromSlotNumber).eq('playbook_date', today);
    }

    // Update to-slot with fromTask
    await supabase.from('playbook_slots').upsert({
      user_id: userId,
      slot_number: toSlotNumber,
      task_id: fromTask.id,
      timer_state: fromSlot.timerState,
      time_remaining: fromSlot.timeRemaining,
      playbook_date: today,
    }, { onConflict: 'user_id,slot_number,playbook_date' });

    setSlots(prev => prev.map(s => {
      if (s.slotNumber === fromSlotNumber) {
        return toTask
          ? { ...s, task: toTask, timerState: toSlot!.timerState, timeRemaining: toSlot!.timeRemaining }
          : { ...s, task: null, timerState: 'idle', timeRemaining: 3600 };
      }
      if (s.slotNumber === toSlotNumber) {
        return { ...s, task: fromTask, timerState: fromSlot.timerState, timeRemaining: fromSlot.timeRemaining };
      }
      return s;
    }));
  }, [slots, userId]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.column !== undefined) dbUpdates.status = updates.column;

    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from('tasks').update(dbUpdates).eq('id', taskId);
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    setSlots(prev => prev.map(s => s.task?.id === taskId ? { ...s, task: { ...s.task!, ...updates } } : s));
  }, []);

  const addLogEntry = useCallback(async (taskId: string, text: string) => {
    const { data } = await supabase.from('task_logs').insert({
      task_id: taskId,
      entry: text,
    }).select().single();

    if (data) {
      const entry: TaskLogEntry = { id: data.id, text: data.entry, createdAt: data.created_at };
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, logEntries: [...(t.logEntries || []), entry] } : t));
      setSlots(prev => prev.map(s => s.task?.id === taskId ? { ...s, task: { ...s.task!, logEntries: [...(s.task!.logEntries || []), entry] } } : s));
    }
  }, []);

  const updateSlotTimer = useCallback(async (slotNumber: number, updates: Partial<PlaybookSlot>) => {
    const shouldPersist = updates.timerState !== undefined || updates.timeRemaining !== undefined;
    if (shouldPersist && userId) {
      const today = new Date().toISOString().split('T')[0];
      const dbUpdate: Record<string, any> = {};
      if (updates.timerState !== undefined) dbUpdate.timer_state = updates.timerState;
      if (updates.timeRemaining !== undefined) dbUpdate.time_remaining = updates.timeRemaining;
      // Don't persist every tick — only persist time_remaining if timerState changed or it's an explicit duration set
      if (updates.timerState !== undefined || !('timerState' in updates)) {
        await supabase.from('playbook_slots').update(dbUpdate)
          .eq('user_id', userId).eq('slot_number', slotNumber).eq('playbook_date', today);
      }
    }

    setSlots(prev => prev.map(s => s.slotNumber === slotNumber ? { ...s, ...updates } : s));
  }, [userId]);

  const getTasksByBucket = useCallback((bucketId: BucketId) => {
    return tasks.filter(t => t.bucketId === bucketId);
  }, [tasks]);

  return {
    tasks, slots, activeBucket, chatOpen, loading,
    setActiveBucket, setChatOpen,
    addTask, updateTaskColumn, deleteTask,
    moveTaskToSlot, moveSlotToSlot, removeTaskFromSlot, returnTaskToBucket,
    updateTask, addLogEntry, updateSlotTimer,
    getTasksByBucket,
  };
}
