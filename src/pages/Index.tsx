import { useEffect, useRef, useCallback, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useAppStore } from '@/store/useAppStore';
import { BucketCard } from '@/components/BucketCard';
import { DailyPlaybook } from '@/components/DailyPlaybook';
import { AIChatPanel } from '@/components/AIChatPanel';
import { ExecuteView } from '@/components/ExecuteView';
import { StatusLogModal } from '@/components/StatusLogModal';
import { TaskDetailModal } from '@/components/TaskDetailModal';
import { TaskCard } from '@/components/TaskCard';
import { BUCKETS, Task } from '@/types/tasks';
import { Bot, Sparkles, LayoutGrid, Target, MessageCircle } from 'lucide-react';

const leftBuckets = BUCKETS.slice(0, 4);
const rightBuckets = BUCKETS.slice(4, 8);

const PERSONAL_USER_ID = '00000000-0000-0000-0000-000000000000';

type ViewTab = 'plan' | 'execute';

const Index = () => {
  const store = useAppStore(PERSONAL_USER_ID);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [statusLogSlot, setStatusLogSlot] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('plan');

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
    const activeId = String(active.id);
    const fromSlot = active.data.current?.fromSlot as number | undefined;

    if (over) {
      const overId = String(over.id);

      if (overId.startsWith('slot-')) {
        const slotNumber = parseInt(overId.replace('slot-', ''));

        if (fromSlot !== undefined) {
          if (fromSlot !== slotNumber) {
            store.moveSlotToSlot(fromSlot, slotNumber);
          }
        } else {
          const targetSlot = store.slots.find(s => s.slotNumber === slotNumber);
          if (targetSlot && !targetSlot.task) {
            store.moveTaskToSlot(activeId, slotNumber);
          }
        }
        return;
      }

      // Dropped on a bucket — return task from slot to that bucket
      if (overId.startsWith('bucket-') && fromSlot !== undefined) {
        store.returnTaskToBucket(fromSlot);
        return;
      }
    }

    // Dropped outside any slot — if from a slot, return to bucket
    if (fromSlot !== undefined) {
      store.returnTaskToBucket(fromSlot);
    }
  };

  // Timer tick effect
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

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const renderBucketColumn = (buckets: typeof BUCKETS) => (
    <div className="flex flex-col gap-3 h-full">
      {buckets.map(bucket => (
        <div key={bucket.id} className="flex-1 min-h-0">
          <BucketCard
            bucketId={bucket.id}
            tasks={store.tasks.filter(t => t.bucketId === bucket.id)}
            onAddTask={store.addTask}
            onDeleteTask={store.deleteTask}
            onClickTask={setSelectedTask}
          />
        </div>
      ))}
    </div>
  );

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-screen overflow-hidden bg-background">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-4 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent-foreground" />
              </div>
              <span className="text-base font-bold tracking-tight text-foreground">CHAT GSD</span>
            </div>

            {/* View Tabs */}
            <div className="flex items-center surface-sunken p-1 rounded-2xl">
              <button
                onClick={() => setActiveTab('plan')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'plan'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Plan
              </button>
              <button
                onClick={() => setActiveTab('execute')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'execute'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Target className="w-4 h-4" />
                Execute
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{dateStr}</span>
            <button
              onClick={() => store.setChatOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium surface-interactive"
            >
              <MessageCircle className="w-4 h-4 text-accent" />
              <span>AI Chat</span>
            </button>
          </div>
        </header>

        {/* Content */}
        {activeTab === 'plan' ? (
          <div className="flex-1 grid grid-cols-[1fr_minmax(340px,1.3fr)_1fr] gap-4 px-6 pb-6 overflow-hidden min-h-0">
            <div className="overflow-y-auto min-h-0 pr-1">
              {renderBucketColumn(leftBuckets)}
            </div>
            <div className="overflow-y-auto min-h-0 px-1">
              <DailyPlaybook
                slots={store.slots}
                onStartTimer={(n) => store.updateSlotTimer(n, { timerState: 'running' })}
                onPauseTimer={pauseTimer}
                onCompleteSlot={store.removeTaskFromSlot}
                onReturnTask={store.returnTaskToBucket}
                onClickTask={setSelectedTask}
              />
            </div>
            <div className="overflow-y-auto min-h-0 pl-1">
              {renderBucketColumn(rightBuckets)}
            </div>
          </div>
        ) : (
          <ExecuteView
            slots={store.slots}
            tasks={store.tasks}
            onStartTimer={(n) => store.updateSlotTimer(n, { timerState: 'running' })}
            onPauseTimer={pauseTimer}
            onCompleteSlot={store.removeTaskFromSlot}
            onReturnTask={store.returnTaskToBucket}
            onClickTask={setSelectedTask}
            onDeleteTask={store.deleteTask}
            onUpdateTask={store.updateTask}
          />
        )}
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel
        open={store.chatOpen}
        onClose={() => store.setChatOpen(false)}
        store={{
          tasks: store.tasks,
          slots: store.slots,
          addTask: store.addTask,
          deleteTask: store.deleteTask,
          updateTask: store.updateTask,
          moveTaskToSlot: store.moveTaskToSlot,
        }}
      />

      {/* Status Log Modal */}
      {statusLogSlot !== null && (
        <StatusLogModal
          slotNumber={statusLogSlot}
          onSubmit={handleStatusLogSubmit}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={(id, updates) => { store.updateTask(id, updates); setSelectedTask(prev => prev ? { ...prev, ...updates } : null); }}
          onAddLogEntry={(id, text) => { store.addLogEntry(id, text); setSelectedTask(prev => prev ? { ...prev, logEntries: [...(prev.logEntries || []), { id: Math.random().toString(36).substring(2,10), text, createdAt: new Date().toISOString() }] } : null); }}
          onDeleteTask={(id) => { store.deleteTask(id); setSelectedTask(null); }}
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
