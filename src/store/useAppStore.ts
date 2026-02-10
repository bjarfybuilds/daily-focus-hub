import { useState, useCallback } from 'react';
import { Task, BucketId, KanbanColumn, PlaybookSlot, Priority, TaskLogEntry } from '@/types/tasks';

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

const initialSlots: PlaybookSlot[] = Array.from({ length: 8 }, (_, i) => ({
  slotNumber: i + 1,
  task: null,
  timerState: 'idle',
  timeRemaining: 3600,
}));

export function useAppStore() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [slots, setSlots] = useState<PlaybookSlot[]>(initialSlots);
  const [activeBucket, setActiveBucket] = useState<BucketId | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const addTask = useCallback((bucketId: BucketId, title: string, description: string, priority: Priority) => {
    const task: Task = {
      id: generateId(),
      title,
      description,
      priority,
      column: 'todo',
      bucketId,
      createdAt: new Date().toISOString(),
      logEntries: [],
    };
    setTasks(prev => [...prev, task]);
  }, []);

  const updateTaskColumn = useCallback((taskId: string, column: KanbanColumn) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, column } : t));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setSlots(prev => prev.map(s => s.task?.id === taskId ? { ...s, task: null, timerState: 'idle', timeRemaining: 3600 } : s));
  }, []);

  const moveTaskToSlot = useCallback((taskId: string, slotNumber: number) => {
    setTasks(prev => {
      const task = prev.find(t => t.id === taskId);
      if (!task) return prev;
      setSlots(prevSlots => prevSlots.map(s =>
        s.slotNumber === slotNumber ? { ...s, task: { ...task, column: 'in-progress' } } : s
      ));
      return prev.filter(t => t.id !== taskId);
    });
  }, []);

  const removeTaskFromSlot = useCallback((slotNumber: number) => {
    setSlots(prev => {
      const slot = prev.find(s => s.slotNumber === slotNumber);
      if (slot?.task) {
        setTasks(prevTasks => [...prevTasks, { ...slot.task!, column: 'done' }]);
      }
      return prev.map(s => s.slotNumber === slotNumber ? { ...s, task: null, timerState: 'idle', timeRemaining: 3600 } : s);
    });
  }, []);

  const returnTaskToBucket = useCallback((slotNumber: number) => {
    setSlots(prev => {
      const slot = prev.find(s => s.slotNumber === slotNumber);
      if (slot?.task) {
        setTasks(prevTasks => [...prevTasks, { ...slot.task!, column: 'todo' }]);
      }
      return prev.map(s => s.slotNumber === slotNumber ? { ...s, task: null, timerState: 'idle', timeRemaining: 3600 } : s);
    });
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    setSlots(prev => prev.map(s => s.task?.id === taskId ? { ...s, task: { ...s.task!, ...updates } } : s));
  }, []);

  const addLogEntry = useCallback((taskId: string, text: string) => {
    const entry: TaskLogEntry = { id: generateId(), text, createdAt: new Date().toISOString() };
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, logEntries: [...(t.logEntries || []), entry] } : t));
    setSlots(prev => prev.map(s => s.task?.id === taskId ? { ...s, task: { ...s.task!, logEntries: [...(s.task!.logEntries || []), entry] } } : s));
  }, []);

  const updateSlotTimer = useCallback((slotNumber: number, updates: Partial<PlaybookSlot>) => {
    setSlots(prev => prev.map(s => s.slotNumber === slotNumber ? { ...s, ...updates } : s));
  }, []);

  const getTasksByBucket = useCallback((bucketId: BucketId) => {
    return tasks.filter(t => t.bucketId === bucketId);
  }, [tasks]);

  return {
    tasks, slots, activeBucket, chatOpen,
    setActiveBucket, setChatOpen,
    addTask, updateTaskColumn, deleteTask,
    moveTaskToSlot, removeTaskFromSlot, returnTaskToBucket,
    updateTask, addLogEntry, updateSlotTimer,
    getTasksByBucket,
  };
}
