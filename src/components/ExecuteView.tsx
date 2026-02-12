import { useState, useRef } from 'react';
import { Task, BUCKETS, BUCKET_COLORS, PlaybookSlot, Priority } from '@/types/tasks';
import { Play, Pause, CheckCircle2, Square, CheckSquare, Timer, Pencil, SkipBack, SkipForward } from 'lucide-react';
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
  // Preserve subtask lines and URL lines, replace everything else
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

const SKIP_SECONDS = 5 * 60; // 5 minutes

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

  // Determine which duration preset is closest to current timeRemaining
  const currentDuration = focusSlot?.timeRemaining ?? 3600;
  // Find the selected preset total to compute progress
  const selectedPresetSeconds = DURATION_PRESETS.reduce((closest, p) =>
    Math.abs(p.seconds - (focusSlot?.timeRemaining ?? 3600)) < Math.abs(closest - (focusSlot?.timeRemaining ?? 3600)) ? p.seconds : closest
  , 3600);
  // Use a ref to track the "sprint total" — set when timer starts or preset is chosen
  const sprintTotal = focusSlot ? 
    DURATION_PRESETS.find(p => p.seconds >= currentDuration)?.seconds ?? 3600 
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

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{greeting()} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">What do you plan to execute today?</p>
      </div>

      {/* Focus Mode - Centered hero */}
      {focusSlot?.task && (
        <div className="surface-raised p-8 mb-8 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full h-1"
            style={{ backgroundColor: focusBucketColor ? `hsl(${focusBucketColor})` : undefined }}
          />

          {/* Header: bucket + task title */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
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

          {/* Centered Timer Block */}
          <div className="flex flex-col items-center gap-4 mb-6">
            {/* Big Timer */}
            <span className={cn(
              'text-7xl font-mono font-bold tracking-tight tabular-nums',
              focusSlot.timerState === 'running' ? 'text-accent' : 'text-foreground'
            )}>
              {formatTime(focusSlot.timeRemaining)}
            </span>

            {/* Progress bar + elapsed/remaining */}
            <div className="w-full max-w-md space-y-1.5">
              <Progress value={progressPercent} className="h-2" />
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>{formatTime(elapsed)}</span>
                <span>-{formatTime(currentDuration)}</span>
              </div>
            </div>

            {/* Skip + Play/Pause Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleSkipBack}
                className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                title="Skip back 5 min"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              {focusSlot.timerState === 'running' ? (
                <button
                  onClick={() => onPauseTimer(focusSlot.slotNumber)}
                  className="flex items-center justify-center w-16 h-16 rounded-full bg-secondary text-foreground hover:bg-secondary/80 transition-all shadow-sm"
                >
                  <Pause className="w-7 h-7" />
                </button>
              ) : (
                <button
                  onClick={() => onStartTimer(focusSlot.slotNumber)}
                  className="flex items-center justify-center w-16 h-16 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-all shadow-md"
                >
                  <Play className="w-7 h-7 ml-0.5" />
                </button>
              )}

              <button
                onClick={handleSkipForward}
                className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                title="Skip forward 5 min"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Duration Presets */}
            <div className="flex items-center gap-1.5">
              <Timer className="w-3 h-3 text-muted-foreground/50" />
              {DURATION_PRESETS.map(preset => (
                <button
                  key={preset.seconds}
                  onClick={() => onSetSlotDuration(focusSlot.slotNumber, preset.seconds)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all',
                    currentDuration === preset.seconds
                      ? 'bg-accent/15 text-accent'
                      : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Complete Button */}
            <button
              onClick={() => onCompleteSlot(focusSlot.slotNumber)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/15 transition-all border border-accent/20 mt-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>COMPLETE SPRINT</span>
            </button>
          </div>

          {/* Notes + Subtasks below timer */}
          <div className="max-w-lg mx-auto space-y-4">
            {/* Editable Notes */}
            <div
              className="surface-sunken rounded-xl p-4 min-h-[80px] cursor-text"
              onClick={() => !editingNotes && handleStartEditNotes()}
            >
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Notes</label>
              {editingNotes ? (
                <textarea
                  autoFocus
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  onBlur={handleSaveNotes}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleSaveNotes();
                  }}
                  className="w-full bg-transparent text-sm text-foreground/80 leading-relaxed resize-none outline-none min-h-[60px] placeholder:text-muted-foreground/30"
                  placeholder="Type your notes here..."
                />
              ) : (
                <div className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                  {getNonSubtaskNonUrlLines(focusSlot.task.description) || (
                    <span className="text-muted-foreground/40 italic">Click to add notes...</span>
                  )}
                </div>
              )}
            </div>

            {/* Interactive Subtasks */}
            {focusSubtasks.length > 0 && (
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Subtasks</label>
                <div className="space-y-1">
                  {focusSubtasks.map((st, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 py-1.5 w-full hover:bg-secondary/30 rounded-lg px-1.5 -mx-1.5 transition-colors"
                    >
                      <button
                        onClick={() => handleToggleSubtask(st.lineIndex)}
                        className="shrink-0"
                      >
                        {st.checked ? (
                          <CheckSquare className="w-4 h-4 text-accent" />
                        ) : (
                          <Square className="w-4 h-4 text-muted-foreground/40" />
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
                          className="flex-1 bg-transparent text-sm text-foreground outline-none border-b border-accent/40"
                        />
                      ) : (
                        <span
                          className={cn('text-sm flex-1 cursor-text', st.checked && 'line-through text-muted-foreground')}
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
