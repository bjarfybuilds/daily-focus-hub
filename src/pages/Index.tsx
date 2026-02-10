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
import { Bot, Sparkles, LayoutGrid, Target } from 'lucide-react';

const leftBuckets = BUCKETS.slice(0, 4);
const rightBuckets = BUCKETS.slice(4, 8);

const PERSONAL_USER_ID = 'personal-user';

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
        <header className="flex items-center justify-between px-6 py-3 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <span className="text-sm font-bold tracking-tight text-foreground">CHAT GSD</span>
            </div>

            {/* View Tabs */}
            <div className="flex items-center bg-secondary/50 rounded-xl p-0.5">
              <button
                onClick={() => setActiveTab('plan')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'plan' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Plan
              </button>
              <button
                onClick={() => setActiveTab('execute')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeTab === 'execute' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Target className="w-3.5 h-3.5" />
                Execute
              </button>
            </div>
          </div>

          <button
            onClick={() => store.setChatOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-accent bg-accent/10 hover:bg-accent/15 transition-colors"
          >
            <Bot className="w-4 h-4" />
            Chat
          </button>
        </header>

        {/* Content */}
        {activeTab === 'plan' ? (
          <div className="flex-1 grid grid-cols-[1fr_minmax(320px,1.2fr)_1fr] gap-4 p-4 overflow-hidden min-h-0">
            <div className="overflow-y-auto min-h-0">
              {renderBucketColumn(leftBuckets)}
            </div>
            <div className="overflow-y-auto min-h-0">
              <DailyPlaybook
                slots={store.slots}
                onStartTimer={(n) => store.updateSlotTimer(n, { timerState: 'running' })}
                onPauseTimer={pauseTimer}
                onCompleteSlot={store.removeTaskFromSlot}
                onReturnTask={store.returnTaskToBucket}
                onClickTask={setSelectedTask}
              />
            </div>
            <div className="overflow-y-auto min-h-0">
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
            onClickTask={setSelectedTask}
            onDeleteTask={store.deleteTask}
            onUpdateTask={store.updateTask}
          />
        )}
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

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={(id, updates) => { store.updateTask(id, updates); setSelectedTask(prev => prev ? { ...prev, ...updates } : null); }}
          onAddLogEntry={(id, text) => { store.addLogEntry(id, text); setSelectedTask(prev => prev ? { ...prev, logEntries: [...(prev.logEntries || []), { id: Math.random().toString(36).substring(2,10), text, createdAt: new Date().toISOString() }] } : null); }}
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
