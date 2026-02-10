import { useDroppable } from '@dnd-kit/core';
import { PlaybookSlot, BUCKET_COLORS } from '@/types/tasks';
import { Play, Pause, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaybookSlotCardProps {
  slot: PlaybookSlot;
  onStartTimer: (slotNumber: number) => void;
  onPauseTimer: (slotNumber: number) => void;
  onCompleteSlot: (slotNumber: number) => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function PlaybookSlotCard({ slot, onStartTimer, onPauseTimer, onCompleteSlot }: PlaybookSlotCardProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${slot.slotNumber}`,
    data: { slotNumber: slot.slotNumber },
    disabled: !!slot.task,
  });

  const isActive = slot.timerState === 'running';
  const progress = ((3600 - slot.timeRemaining) / 3600) * 100;
  const bucketColor = slot.task ? BUCKET_COLORS[slot.task.bucketId] : null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative rounded-xl transition-all duration-300 overflow-hidden',
        slot.task ? 'glass' : 'border-2 border-dashed border-border/40',
        isOver && !slot.task && 'border-accent bg-accent/5 scale-[1.02]',
        isActive && 'ring-2 ring-accent/50',
      )}
    >
      {/* Progress bar */}
      {slot.task && slot.timerState !== 'idle' && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-accent transition-all duration-1000" style={{ width: `${progress}%` }} />
      )}

      <div className="p-3 min-h-[100px] flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className={cn(
            'text-xs font-bold tracking-widest',
            isActive ? 'text-accent' : 'text-muted-foreground/40'
          )}>
            {String(slot.slotNumber).padStart(2, '0')}
          </span>
          {slot.task && (
            <span className={cn(
              'text-xs font-mono tabular-nums',
              isActive && 'text-accent animate-pulse-accent'
            )}>
              {formatTime(slot.timeRemaining)}
            </span>
          )}
        </div>

        {slot.task ? (
          <>
            <div className="flex-1 mb-2">
              <p className="text-sm font-medium text-foreground leading-snug">{slot.task.title}</p>
              {slot.task.description && (
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{slot.task.description}</p>
              )}
              <span 
                className="text-[9px] uppercase tracking-wider mt-1 inline-block font-semibold"
                style={{ color: bucketColor ? `hsl(${bucketColor})` : undefined }}
              >
                {slot.task.bucketId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {slot.timerState === 'idle' || slot.timerState === 'paused' ? (
                <button
                  onClick={() => onStartTimer(slot.slotNumber)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors font-semibold text-xs"
                >
                  <Play className="w-4 h-4" />
                  <span>Start</span>
                </button>
              ) : (
                <button
                  onClick={() => onPauseTimer(slot.slotNumber)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors font-semibold text-xs animate-pulse-accent"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </button>
              )}
              <button
                onClick={() => onCompleteSlot(slot.slotNumber)}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[11px] text-muted-foreground/30 font-medium">Drop task here</p>
          </div>
        )}
      </div>
    </div>
  );
}
