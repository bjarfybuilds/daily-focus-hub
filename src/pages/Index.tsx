import { useEffect, useRef, useCallback, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useAppStore } from '@/store/useAppStore';
import { BucketNav } from '@/components/BucketNav';
import { KanbanBoard } from '@/components/KanbanBoard';
import { DailyPlaybook } from '@/components/DailyPlaybook';
import { AIChatPanel } from '@/components/AIChatPanel';
import { StatusLogModal } from '@/components/StatusLogModal';
import { TaskCard } from '@/components/TaskCard';
import { BUCKETS, Task } from '@/types/tasks';
import { Bot, Sparkles } from 'lucide-react';

const Index = () => {
  const store = useAppStore();
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [statusLogSlot, setStatusLogSlot] = useState<number | null>(null);
  

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setDraggingTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingTask(null);
    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    if (overId.startsWith('slot-')) {
      const slotNumber = parseInt(overId.replace('slot-', ''));
      const slot = store.slots.find(s => s.slotNumber === slotNumber);
      if (slot && !slot.task) {
        store.moveTaskToSlot(String(active.id), slotNumber);
      }
    }
  };

  // Timer tick effect using refs to avoid stale closures
  const slotsRef = useRef(store.slots);
  slotsRef.current = store.slots;

  useEffect(() => {
    const interval = setInterval(() => {
      slotsRef.current.forEach(slot => {
        if (slot.timerState === 'running') {
          const newTime = Math.max(0, slot.timeRemaining - 1);
          if (newTime <= 300 && slot.timeRemaining > 300) {
            store.updateSlotTimer(slot.slotNumber, { timeRemaining: newTime, timerState: 'logging' });
            setStatusLogSlot(slot.slotNumber);
          } else if (newTime <= 0) {
            store.updateSlotTimer(slot.slotNumber, { timeRemaining: 0, timerState: 'logging' });
            setStatusLogSlot(slot.slotNumber);
          } else {
            store.updateSlotTimer(slot.slotNumber, { timeRemaining: newTime });
          }
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [store]);

  const pauseTimer = useCallback((slotNumber: number) => {
    store.updateSlotTimer(slotNumber, { timerState: 'paused' });
  }, [store]);

  const handleStatusLogSubmit = (accomplished: string, nextStep: string) => {
    if (statusLogSlot !== null) {
      store.removeTaskFromSlot(statusLogSlot);
      setStatusLogSlot(null);
    }
  };

  const activeBucketData = store.activeBucket
    ? BUCKETS.find(b => b.id === store.activeBucket)
    : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <aside className="w-56 border-r border-border/50 flex flex-col shrink-0">
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <span className="text-sm font-bold tracking-tight text-foreground">COMMAND OS</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <BucketNav
              activeBucket={store.activeBucket}
              onSelectBucket={store.setActiveBucket}
              tasks={store.tasks}
            />
          </div>
          <div className="p-2 border-t border-border/50">
            <button
              onClick={() => store.setChatOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-accent bg-accent/10 hover:bg-accent/15 transition-colors"
            >
              <Bot className="w-4 h-4" />
              Strategy AI
            </button>
          </div>
        </aside>

        {/* Kanban Panel (conditional) */}
        {store.activeBucket && activeBucketData && (
          <div className="w-72 border-r border-border/50 p-4 overflow-y-auto shrink-0">
            <KanbanBoard
              bucketId={store.activeBucket}
              bucketLabel={activeBucketData.label}
              tasks={store.getTasksByBucket(store.activeBucket)}
              onAddTask={store.addTask}
              onUpdateColumn={store.updateTaskColumn}
              onDeleteTask={store.deleteTask}
            />
          </div>
        )}

        {/* Main Content - Daily Playbook */}
        <main className="flex-1 p-6 overflow-y-auto">
          <DailyPlaybook
            slots={store.slots}
            onStartTimer={(n) => store.updateSlotTimer(n, { timerState: 'running' })}
            onPauseTimer={pauseTimer}
            onCompleteSlot={store.removeTaskFromSlot}
          />
        </main>
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel open={store.chatOpen} onClose={() => store.setChatOpen(false)} />

      {/* Status Log Modal */}
      {statusLogSlot !== null && (
        <StatusLogModal
          slotNumber={statusLogSlot}
          onSubmit={handleStatusLogSubmit}
        />
      )}

      {/* Drag Overlay */}
      <DragOverlay>
        {draggingTask ? <TaskCard task={draggingTask} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default Index;
