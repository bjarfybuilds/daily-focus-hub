import { Task, BUCKETS, BUCKET_COLORS, PlaybookSlot, Priority } from '@/types/tasks';
import { Play, Pause, CheckCircle2, Square, CheckSquare } from 'lucide-react';
import { DailyPlaybook } from './DailyPlaybook';
import { cn } from '@/lib/utils';

interface ExecuteViewProps {
  slots: PlaybookSlot[];
  tasks: Task[];
  onStartTimer: (slotNumber: number) => void;
  onPauseTimer: (slotNumber: number) => void;
  onCompleteSlot: (slotNumber: number) => void;
  onReturnTask: (slotNumber: number) => void;
  onClickTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function parseSubtasks(description: string): { text: string; checked: boolean; lineIndex: number }[] {
  const lines = description.split('\n');
  const subtasks: { text: string; checked: boolean; lineIndex: number }[] = [];
  lines.forEach((line, i) => {
    const unchecked = line.match(/^\s*\[\s*\]\s*(.+)/);
    const checked = line.match(/^\s*\[x\]\s*(.+)/i);
    if (unchecked) subtasks.push({ text: unchecked[1], checked: false, lineIndex: i });
    else if (checked) subtasks.push({ text: checked[1], checked: true, lineIndex: i });
  });
  return subtasks;
}

export function ExecuteView({
  slots,
  tasks,
  onStartTimer,
  onPauseTimer,
  onCompleteSlot,
  onReturnTask,
  onClickTask,
  onDeleteTask,
  onUpdateTask,
}: ExecuteViewProps) {
  const activeSlot = slots.find(s => s.timerState === 'running');
  const pausedSlot = slots.find(s => s.timerState === 'paused');
  const focusSlot = activeSlot || pausedSlot;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const focusBucketColor = focusSlot?.task ? BUCKET_COLORS[focusSlot.task.bucketId] : null;
  const focusBucket = focusSlot?.task ? BUCKETS.find(b => b.id === focusSlot.task!.bucketId) : null;
  const focusSubtasks = focusSlot?.task ? parseSubtasks(focusSlot.task.description) : [];

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{greeting()} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">What do you plan to execute today?</p>
      </div>

      {/* Focus Mode - Big hero card */}
      {focusSlot?.task && (
        <div className="surface-raised p-8 mb-8 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full h-1"
            style={{ backgroundColor: focusBucketColor ? `hsl(${focusBucketColor})` : undefined }}
          />

          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-accent uppercase tracking-widest">Focus Mode</span>
                {focusBucket && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: focusBucketColor ? `hsl(${focusBucketColor} / 0.12)` : undefined,
                      color: focusBucketColor ? `hsl(${focusBucketColor})` : undefined,
                    }}
                  >
                    {focusBucket.label}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-extrabold text-foreground uppercase tracking-tight">
                {focusSlot.task.title}
              </h2>
            </div>

            <div className="text-right">
              <span className={cn(
                'text-5xl font-mono font-bold tracking-tight',
                focusSlot.timerState === 'running' ? 'text-accent' : 'text-foreground'
              )}>
                {formatTime(focusSlot.timeRemaining)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-6 mt-6">
            <div className="space-y-4">
              <div className="surface-sunken rounded-xl p-4 min-h-[120px]">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Notes</label>
                {focusSlot.task.description ? (
                  <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {focusSlot.task.description.split('\n').filter(l => {
                      const t = l.trim();
                      return !t.match(/^\s*\[\s*\]/) && !t.match(/^\s*\[x\]/i) && !t.match(/^https?:\/\/[^\s]+$/);
                    }).join('\n') || 'No notes yet...'}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground/40 italic">Add notes in the task detail...</p>
                )}
              </div>

              {focusSubtasks.length > 0 && (
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Subtasks</label>
                  <div className="space-y-1">
                    {focusSubtasks.map((st, i) => (
                      <div key={i} className="flex items-center gap-2.5 py-1.5">
                        {st.checked ? (
                          <CheckSquare className="w-4 h-4 text-accent shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                        )}
                        <span className={cn('text-sm', st.checked && 'line-through text-muted-foreground')}>
                          {st.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 min-w-[200px]">
              {focusSlot.timerState === 'running' ? (
                <button
                  onClick={() => onPauseTimer(focusSlot.slotNumber)}
                  className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl text-lg font-bold bg-secondary text-foreground hover:bg-secondary/80 transition-all shadow-sm"
                >
                  <Pause className="w-6 h-6" />
                  <span>PAUSE</span>
                </button>
              ) : (
                <button
                  onClick={() => onStartTimer(focusSlot.slotNumber)}
                  className="flex items-center justify-center gap-3 px-8 py-5 rounded-2xl text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 transition-all shadow-md"
                >
                  <Play className="w-6 h-6" />
                  <span>{focusSlot.timerState === 'paused' ? 'RESUME' : 'START'}</span>
                </button>
              )}
              <button
                onClick={() => onCompleteSlot(focusSlot.slotNumber)}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-sm font-semibold bg-accent/10 text-accent hover:bg-accent/15 transition-all border border-accent/20"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>COMPLETE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Playbook - exact same component as Plan view */}
      <div className="surface-card p-6">
        <DailyPlaybook
          slots={slots}
          onStartTimer={onStartTimer}
          onPauseTimer={onPauseTimer}
          onCompleteSlot={onCompleteSlot}
          onReturnTask={onReturnTask}
          onClickTask={onClickTask}
        />
      </div>
    </div>
  );
}
