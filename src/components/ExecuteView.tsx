import { useState } from 'react';
import { Task, BUCKETS, BUCKET_COLORS, PlaybookSlot } from '@/types/tasks';
import { Play, Pause, CheckCircle2, Square, CheckSquare, Timer, SkipBack, SkipForward } from 'lucide-react';
import { DailyPlaybook } from './DailyPlaybook';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

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
  onSetSlotDuration: (slotNumber: number, seconds: number) => void;
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

function getNonSubtaskNonUrlLines(description: string): string {
  return description.split('\n').filter(l => {
    const t = l.trim();
    return !t.match(/^\s*\[\s*\]/) && !t.match(/^\s*\[x\]/i) && !t.match(/^https?:\/\/[^\s]+$/);
  }).join('\n');
}

function toggleSubtaskInDescription(description: string, lineIndex: number): string {
  const lines = description.split('\n');
  const line = lines[lineIndex];
  if (line.match(/^\s*\[x\]/i)) {
    lines[lineIndex] = line.replace(/\[x\]/i, '[ ]');
  } else if (line.match(/^\s*\[\s*\]/)) {
    lines[lineIndex] = line.replace(/\[\s*\]/, '[x]');
  }
  return lines.join('\n');
}

function renameSubtaskInDescription(description: string, lineIndex: number, newText: string): string {
  const lines = description.split('\n');
  const line = lines[lineIndex];
  if (line.match(/^\s*\[x\]/i)) {
    lines[lineIndex] = `[x] ${newText}`;
  } else if (line.match(/^\s*\[\s*\]/)) {
    lines[lineIndex] = `[ ] ${newText}`;
  }
  return lines.join('\n');
}

function updateNotesInDescription(description: string, newNotes: string): string {
  const lines = description.split('\n');
  const preserved: { index: number; line: string }[] = [];
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t.match(/^\s*\[\s*\]/) || t.match(/^\s*\[x\]/i) || t.match(/^https?:\/\/[^\s]+$/)) {
      preserved.push({ index: i, line });
    }
  });
  const noteLines = newNotes.split('\n').filter(l => l.trim().length > 0);
  return [...noteLines, ...preserved.map(p => p.line)].join('\n');
}

const DURATION_PRESETS = [
  { label: '15m', seconds: 15 * 60 },
  { label: '30m', seconds: 30 * 60 },
  { label: '45m', seconds: 45 * 60 },
  { label: '60m', seconds: 60 * 60 },
];

const SKIP_SECONDS = 5 * 60;

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
  onSetSlotDuration,
}: ExecuteViewProps) {
  const activeSlot = slots.find(s => s.timerState === 'running');
  const pausedSlot = slots.find(s => s.timerState === 'paused');
  const focusSlot = activeSlot || pausedSlot;

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const focusBucketColor = focusSlot?.task ? BUCKET_COLORS[focusSlot.task.bucketId] : null;
  const focusBucket = focusSlot?.task ? BUCKETS.find(b => b.id === focusSlot.task!.bucketId) : null;
  const focusSubtasks = focusSlot?.task ? parseSubtasks(focusSlot.task.description) : [];

  const [editingSubtaskIndex, setEditingSubtaskIndex] = useState<number | null>(null);
  const [subtaskEditValue, setSubtaskEditValue] = useState('');

  const handleToggleSubtask = (lineIndex: number) => {
    if (!focusSlot?.task) return;
    const newDesc = toggleSubtaskInDescription(focusSlot.task.description, lineIndex);
    onUpdateTask(focusSlot.task.id, { description: newDesc });
  };

  const handleStartEditSubtask = (lineIndex: number, currentText: string) => {
    setEditingSubtaskIndex(lineIndex);
    setSubtaskEditValue(currentText);
  };

  const handleSaveSubtask = () => {
    if (!focusSlot?.task || editingSubtaskIndex === null) return;
    const newDesc = renameSubtaskInDescription(focusSlot.task.description, editingSubtaskIndex, subtaskEditValue);
    onUpdateTask(focusSlot.task.id, { description: newDesc });
    setEditingSubtaskIndex(null);
  };

  const handleStartEditNotes = () => {
    if (!focusSlot?.task) return;
    setNotesValue(getNonSubtaskNonUrlLines(focusSlot.task.description));
    setEditingNotes(true);
  };

  const handleSaveNotes = () => {
    if (!focusSlot?.task) return;
    const newDesc = updateNotesInDescription(focusSlot.task.description, notesValue);
    onUpdateTask(focusSlot.task.id, { description: newDesc });
    setEditingNotes(false);
  };

  const currentDuration = focusSlot?.timeRemaining ?? 3600;
  const sprintTotal = focusSlot
    ? DURATION_PRESETS.find(p => p.seconds >= currentDuration)?.seconds ?? 3600
    : 3600;
  const elapsed = sprintTotal - currentDuration;
  const progressPercent = sprintTotal > 0 ? Math.min(100, (elapsed / sprintTotal) * 100) : 0;

  const handleSkipBack = () => {
    if (!focusSlot) return;
    const newTime = Math.min(sprintTotal, currentDuration + SKIP_SECONDS);
    onSetSlotDuration(focusSlot.slotNumber, newTime);
  };

  const handleSkipForward = () => {
    if (!focusSlot) return;
    const newTime = Math.max(0, currentDuration - SKIP_SECONDS);
    onSetSlotDuration(focusSlot.slotNumber, newTime);
  };

  const isRunning = focusSlot?.timerState === 'running';

  return (
    <div className="flex-1 overflow-y-auto px-2 py-4 sm:px-8 sm:py-8 max-w-4xl mx-auto w-full">
      {/* Greeting */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{greeting()} 👋</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">What do you plan to execute today?</p>
      </div>

      {/* Focus Mode */}
      {focusSlot?.task && (
        <div className="surface-raised p-5 sm:p-8 mb-6 sm:mb-8 relative overflow-hidden">
          {/* Ambient breathing orbs — always visible in focus mode, intensify when running */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className="absolute -top-10 -left-10 w-72 h-72 sm:w-[28rem] sm:h-[28rem] rounded-full blur-[80px] animate-breathe-1 transition-opacity duration-1000"
              style={{
                background: `radial-gradient(circle, hsl(${focusBucketColor || '220 80% 56%'} / ${isRunning ? '0.35' : '0.18'}), transparent 65%)`,
              }}
            />
            <div
              className="absolute -bottom-10 -right-10 w-64 h-64 sm:w-[24rem] sm:h-[24rem] rounded-full blur-[80px] animate-breathe-2 transition-opacity duration-1000"
              style={{
                background: `radial-gradient(circle, hsl(220 80% 56% / ${isRunning ? '0.3' : '0.12'}), transparent 65%)`,
              }}
            />
            <div
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 sm:w-[22rem] sm:h-[22rem] rounded-full blur-[80px] animate-breathe-3 transition-opacity duration-1000"
              style={{
                background: `radial-gradient(circle, hsl(${focusBucketColor || '220 80% 56%'} / ${isRunning ? '0.2' : '0.08'}), hsl(220 80% 56% / ${isRunning ? '0.1' : '0.04'}), transparent 70%)`,
              }}
            />
            {/* Extra orb for more visual richness */}
            <div
              className="absolute bottom-1/4 left-1/4 w-48 h-48 sm:w-80 sm:h-80 rounded-full blur-[100px] animate-breathe-1 transition-opacity duration-1000"
              style={{
                background: `radial-gradient(circle, hsl(262 70% 60% / ${isRunning ? '0.2' : '0.08'}), transparent 70%)`,
                animationDelay: '3s',
                animationDuration: '14s',
              }}
            />
          </div>

          {/* Top accent bar */}
          <div
            className="absolute top-0 left-0 w-full h-1"
            style={{ backgroundColor: focusBucketColor ? `hsl(${focusBucketColor})` : undefined }}
          />

          {/* Header */}
          <div className="text-center mb-4 sm:mb-6 relative z-10">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-[10px] sm:text-xs font-bold text-accent uppercase tracking-widest">Focus Mode</span>
              {focusBucket && (
                <span
                  className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: focusBucketColor ? `hsl(${focusBucketColor} / 0.12)` : undefined,
                    color: focusBucketColor ? `hsl(${focusBucketColor})` : undefined,
                  }}
                >
                  {focusBucket.label}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-foreground uppercase tracking-tight">
              {focusSlot.task.title}
            </h2>
          </div>

          {/* Timer Block */}
          <div className="flex flex-col items-center gap-3 sm:gap-4 mb-4 sm:mb-6 relative z-10">
            {/* Timer — responsive sizing */}
            <span className={cn(
              'text-4xl sm:text-6xl md:text-7xl font-mono font-bold tracking-tight tabular-nums transition-colors duration-500',
              isRunning ? 'text-accent' : 'text-foreground',
              isRunning && 'animate-float-slow'
            )}>
              {formatTime(focusSlot.timeRemaining)}
            </span>

            {/* Progress bar */}
            <div className="w-full max-w-xs sm:max-w-md space-y-1">
              <Progress value={progressPercent} className="h-1.5 sm:h-2" />
              <div className="flex justify-between text-[9px] sm:text-[10px] font-mono text-muted-foreground">
                <span>{formatTime(elapsed)}</span>
                <span>-{formatTime(currentDuration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={handleSkipBack}
                className="p-2 sm:p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                title="Skip back 5 min"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {isRunning ? (
                <button
                  onClick={() => onPauseTimer(focusSlot.slotNumber)}
                  className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-all shadow-sm"
                >
                  <Pause className="w-5 h-5 sm:w-7 sm:h-7" />
                </button>
              ) : (
                <button
                  onClick={() => onStartTimer(focusSlot.slotNumber)}
                  className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all shadow-md"
                >
                  <Play className="w-5 h-5 sm:w-7 sm:h-7 ml-0.5" />
                </button>
              )}

              <button
                onClick={handleSkipForward}
                className="p-2 sm:p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                title="Skip forward 5 min"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Duration Presets */}
            <div className="flex items-center gap-1">
              <Timer className="w-3 h-3 text-muted-foreground/50" />
              {DURATION_PRESETS.map(preset => (
                <button
                  key={preset.seconds}
                  onClick={() => onSetSlotDuration(focusSlot.slotNumber, preset.seconds)}
                  className={cn(
                    'px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all',
                    currentDuration === preset.seconds
                      ? 'bg-accent/15 text-accent'
                      : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Complete */}
            <button
              onClick={() => onCompleteSlot(focusSlot.slotNumber)}
              className="flex items-center gap-2 px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/15 transition-all border border-accent/20 mt-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>COMPLETE SPRINT</span>
            </button>
          </div>

          {/* Notes + Subtasks */}
          <div className="max-w-lg mx-auto space-y-3 sm:space-y-4 relative z-10">
            {/* Notes */}
            <div
              className="surface-sunken rounded-xl p-3 sm:p-4 min-h-[60px] sm:min-h-[80px] cursor-text"
              onClick={() => !editingNotes && handleStartEditNotes()}
            >
              <label className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 sm:mb-2 block">Notes</label>
              {editingNotes ? (
                <textarea
                  autoFocus
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  onBlur={handleSaveNotes}
                  onKeyDown={(e) => { if (e.key === 'Escape') handleSaveNotes(); }}
                  className="w-full bg-transparent text-xs sm:text-sm text-foreground/80 leading-relaxed resize-none outline-none min-h-[50px] sm:min-h-[60px] placeholder:text-muted-foreground/30"
                  placeholder="Type your notes here..."
                />
              ) : (
                <div className="text-xs sm:text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {getNonSubtaskNonUrlLines(focusSlot.task.description) || (
                    <span className="text-muted-foreground/40 italic">Click to add notes...</span>
                  )}
                </div>
              )}
            </div>

            {/* Subtasks */}
            {focusSubtasks.length > 0 && (
              <div>
                <label className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 sm:mb-2 block">Subtasks</label>
                <div className="space-y-1">
                  {focusSubtasks.map((st, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 sm:gap-2.5 py-1.5 w-full hover:bg-secondary/30 rounded-lg px-1.5 -mx-1.5 transition-colors"
                    >
                      <button onClick={() => handleToggleSubtask(st.lineIndex)} className="shrink-0">
                        {st.checked ? (
                          <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                        ) : (
                          <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground/40" />
                        )}
                      </button>
                      {editingSubtaskIndex === st.lineIndex ? (
                        <input
                          autoFocus
                          value={subtaskEditValue}
                          onChange={(e) => setSubtaskEditValue(e.target.value)}
                          onBlur={handleSaveSubtask}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveSubtask();
                            if (e.key === 'Escape') setEditingSubtaskIndex(null);
                          }}
                          className="flex-1 bg-transparent text-xs sm:text-sm text-foreground outline-none border-b border-accent/40"
                        />
                      ) : (
                        <span
                          className={cn('text-xs sm:text-sm flex-1 cursor-text', st.checked && 'line-through text-muted-foreground')}
                          onClick={() => handleStartEditSubtask(st.lineIndex, st.text)}
                        >
                          {st.text}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Daily Playbook */}
      <div className="surface-card p-3 sm:p-6 w-full">
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
