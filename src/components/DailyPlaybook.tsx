import { PlaybookSlot, Task } from '@/types/tasks';
import { PlaybookSlotCard } from './PlaybookSlotCard';
import { Zap } from 'lucide-react';

interface DailyPlaybookProps {
  slots: PlaybookSlot[];
  onStartTimer: (slotNumber: number) => void;
  onPauseTimer: (slotNumber: number) => void;
  onCompleteSlot: (slotNumber: number) => void;
  onReturnTask: (slotNumber: number) => void;
  onClickTask?: (task: Task) => void;
}

export function DailyPlaybook({ slots, onStartTimer, onPauseTimer, onCompleteSlot, onReturnTask, onClickTask }: DailyPlaybookProps) {
  const filledCount = slots.filter(s => s.task).length;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-accent/10">
          <Zap className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Daily Playbook</h1>
          <p className="text-xs text-muted-foreground">{filledCount}/8 slots filled</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {slots.map(slot => (
          <PlaybookSlotCard
            key={slot.slotNumber}
            slot={slot}
            onStartTimer={onStartTimer}
            onPauseTimer={onPauseTimer}
            onCompleteSlot={onCompleteSlot}
            onReturnTask={onReturnTask}
            onClickTask={onClickTask}
          />
        ))}
      </div>
    </div>
  );
}
