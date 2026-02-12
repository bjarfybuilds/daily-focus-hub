import { useDraggable } from '@dnd-kit/core';
import { Task } from '@/types/tasks';
import { Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onDelete?: (id: string) => void;
  onClick?: (task: Task) => void;
  isDragOverlay?: boolean;
}

const priorityDot: Record<string, string> = {
  high: 'bg-destructive',
  medium: 'bg-accent',
  low: 'bg-muted-foreground/40',
};

export function TaskCard({ task, onDelete, onClick, isDragOverlay }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: isDragOverlay,
  });

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    onClick?.(task);
  };

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      className={cn(
        'surface-interactive p-2.5 group cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-30 scale-95',
        isDragOverlay && 'shadow-xl scale-105 rotate-1',
        onClick && 'hover:border-accent/30',
      )}
      {...(!isDragOverlay ? { ...attributes, ...listeners } : {})}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <GripVertical className="w-3 h-3 text-muted-foreground/30 mt-1 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', priorityDot[task.priority])} />
              <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
            </div>
            {task.description && (
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1 ml-3">{task.description}</p>
            )}
          </div>
        </div>
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive text-muted-foreground/40"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
