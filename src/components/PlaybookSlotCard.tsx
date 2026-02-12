import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { PlaybookSlot, BUCKET_COLORS } from '@/types/tasks';
import { Play, Pause, Check, Undo2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaybookSlotCardProps {
  slot: PlaybookSlot;
  onStartTimer: (slotNumber: number) => void;
  onPauseTimer: (slotNumber: number) => void;
  onCompleteSlot: (slotNumber: number) => void;
  onReturnTask: (slotNumber: number) => void;
  onClickTask?: (task: import('@/types/tasks').Task) => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function SlotTaskDraggable({ slot, children }: { slot: PlaybookSlot; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `slottask-${slot.slotNumber}`,
    data: { task: slot.task, fromSlot: slot.slotNumber },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 flex gap-2',
        isDragging && 'opacity-30'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex items-center cursor-grab active:cursor-grabbing touch-none py-1 px-0.5 -ml-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}

export function PlaybookSlotCard({ slot, onStartTimer, onPauseTimer, onCompleteSlot, onReturnTask, onClickTask }: PlaybookSlotCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${slot.slotNumber}`,
    data: { slotNumber: slot.slotNumber },
  });

  const isActive = slot.timerState === 'running';
  const progress = ((3600 - slot.timeRemaining) / 3600) * 100;
  const bucketColor = slot.task ? BUCKET_COLORS[slot.task.bucketId] : null;

  const taskContent = slot.task ? (
    <>
      <div className="flex-1 mb-2 cursor-pointer" onClick={() => onClickTask?.(slot.task!)}>
        <p className="text-sm font-semibold text-foreground leading-snug hover:text-accent transition-colors">{slot.task.title}</p>
        {slot.task.description && (
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{slot.task.description}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: bucketColor ? `hsl(${bucketColor})` : undefined }}
          />
          <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
            {slot.task.bucketId}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {slot.timerState === 'idle' || slot.timerState === 'paused' ? (
          <button
            onClick={(e) => { e.stopPropagation(); onStartTimer(slot.slotNumber); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-medium text-xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{slot.timerState === 'paused' ? 'Resume' : 'Start'}</span>
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onPauseTimer(slot.slotNumber); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-medium text-xs animate-pulse-accent"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Pause</span>
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onReturnTask(slot.slotNumber); }}
          className="p-1.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          title="Return to bucket"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onCompleteSlot(slot.slotNumber); }}
          className="p-1.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          title="Mark complete"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  ) : null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative rounded-2xl transition-all duration-300 overflow-hidden',
        slot.task ? 'surface-card' : 'border-2 border-dashed border-border/60 bg-secondary/30',
        isOver && 'border-accent bg-accent/5 scale-[1.01]',
        isActive && 'ring-2 ring-accent/30',
      )}
    >
      {/* Progress bar */}
      {slot.task && slot.timerState !== 'idle' && (
        <div className="absolute bottom-0 left-0 h-1 rounded-full bg-accent/60 transition-all duration-1000" style={{ width: `${progress}%` }} />
      )}

      <div className="p-3.5 min-h-[72px] flex flex-col">
        <div className="flex items-center justify-between mb-1.5">
          <span className={cn(
            'text-[10px] font-bold tracking-widest',
            isActive ? 'text-accent' : 'text-muted-foreground/40'
          )}>
            {String(slot.slotNumber).padStart(2, '0')}
          </span>
          {slot.task && (
            <span className={cn(
              'text-xs font-mono tabular-nums font-medium',
              isActive ? 'text-accent' : 'text-muted-foreground'
            )}>
              {formatTime(slot.timeRemaining)}
            </span>
          )}
        </div>

        {slot.task ? (
          <SlotTaskDraggable slot={slot}>
            {taskContent}
          </SlotTaskDraggable>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[11px] text-muted-foreground/30 font-medium">Drop task here</p>
          </div>
        )}
      </div>
    </div>
  );
}
