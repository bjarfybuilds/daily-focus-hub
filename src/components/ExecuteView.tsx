import { Task, BUCKETS, BUCKET_COLORS, PlaybookSlot, Priority } from '@/types/tasks';
import { CheckCircle2, Circle, Trash2, ChevronDown, Target, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExecuteViewProps {
  slots: PlaybookSlot[];
  tasks: Task[];
  onStartTimer: (slotNumber: number) => void;
  onPauseTimer: (slotNumber: number) => void;
  onCompleteSlot: (slotNumber: number) => void;
  onClickTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

const priorityConfig: Record<Priority, { label: string; color: string; dot: string }> = {
  high: { label: 'High', color: 'text-red-400', dot: 'bg-red-400' },
  medium: { label: 'Medium', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  low: { label: 'Low', color: 'text-blue-400', dot: 'bg-blue-400' },
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ExecuteView({
  slots,
  tasks,
  onStartTimer,
  onPauseTimer,
  onCompleteSlot,
  onClickTask,
  onDeleteTask,
  onUpdateTask,
}: ExecuteViewProps) {
  // Get today's active tasks from slots
  const activeTasks = slots
    .filter(s => s.task)
    .map(s => ({ slot: s, task: s.task! }));

  // Also show all in-progress tasks not in slots
  const inProgressTasks = tasks.filter(t => t.column === 'in-progress');
  const todoTasks = tasks.filter(t => t.column === 'todo');

  // Combine: slot tasks first, then in-progress, then today's todos
  const allTodayTasks = [
    ...activeTasks.map(a => a.task),
    ...inProgressTasks.filter(t => !activeTasks.some(a => a.task.id === t.id)),
    ...todoTasks.slice(0, 5), // Show top 5 todos
  ];

  const toggleComplete = (task: Task) => {
    // Find if this task is in a playbook slot
    const slotWithTask = slots.find(s => s.task?.id === task.id);
    if (slotWithTask) {
      // Complete the slot (removes from slot, marks as done in DB)
      onCompleteSlot(slotWithTask.slotNumber);
    } else {
      // Update task status to done in DB
      onUpdateTask(task.id, { column: 'done' });
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Find active timer
  const activeSlot = slots.find(s => s.timerState === 'running');
  const pausedSlot = slots.find(s => s.timerState === 'paused');
  const focusSlot = activeSlot || pausedSlot;

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{greeting()} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">What do you plan to execute today?</p>
      </div>

      {/* Focus Mode - Active Timer */}
      {focusSlot?.task && (
        <div className="glass rounded-2xl p-5 mb-6 border border-accent/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">Focus Mode</span>
            </div>
            <span className="text-2xl font-mono font-bold text-accent">
              {formatTime(focusSlot.timeRemaining)}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">{focusSlot.task.title}</h3>
          {focusSlot.task.description && (
            <p className="text-sm text-muted-foreground">{focusSlot.task.description}</p>
          )}
          <div className="flex gap-2 mt-4">
            {focusSlot.timerState === 'running' ? (
              <button
                onClick={() => onPauseTimer(focusSlot.slotNumber)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={() => onStartTimer(focusSlot.slotNumber)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
              >
                {focusSlot.timerState === 'paused' ? 'Resume' : 'Start Focus'}
              </button>
            )}
            <button
              onClick={() => onCompleteSlot(focusSlot.slotNumber)}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              Complete
            </button>
          </div>
        </div>
      )}

      {/* Today's Tasks */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Today's Tasks</h2>
          <span className="text-xs text-muted-foreground">{allTodayTasks.length} tasks</span>
        </div>

        {allTodayTasks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No tasks yet. Switch to Plan view to add tasks to your playbook.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {allTodayTasks.map((task) => {
              const isCompleted = task.column === 'done';
              const bucket = BUCKETS.find(b => b.id === task.bucketId);
              const priority = priorityConfig[task.priority];

              return (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-xl transition-colors group',
                    'hover:bg-secondary/50 cursor-pointer',
                    isCompleted && 'opacity-50'
                  )}
                >
                  <button
                    onClick={() => toggleComplete(task)}
                    className="shrink-0"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground/40 hover:text-accent transition-colors" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0" onClick={() => onClickTask(task)}>
                    <span className={cn(
                      'text-sm font-medium text-foreground block truncate',
                      isCompleted && 'line-through text-muted-foreground'
                    )}>
                      {task.title}
                    </span>
                    {bucket && (
                      <span className="text-[10px] text-muted-foreground">{bucket.label}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full', priority.color, 'bg-secondary')}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', priority.dot)} />
                      {priority.label}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Playbook Slots Summary */}
      {activeTasks.length > 0 && (
        <div className="mt-6 glass rounded-2xl p-5">
          <h2 className="text-lg font-semibold text-foreground mb-4">Playbook Slots</h2>
          <div className="grid grid-cols-2 gap-3">
            {activeTasks.map(({ slot, task }) => (
              <div
                key={slot.slotNumber}
                className={cn(
                  'rounded-xl p-3 bg-secondary/50 border border-border/50 cursor-pointer hover:border-accent/30 transition-colors',
                  slot.timerState === 'running' && 'border-accent/50 bg-accent/5'
                )}
                onClick={() => onClickTask(task)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-muted-foreground">Slot {slot.slotNumber}</span>
                  <span className={cn(
                    'text-xs font-mono',
                    slot.timerState === 'running' ? 'text-accent' : 'text-muted-foreground'
                  )}>
                    {formatTime(slot.timeRemaining)}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
