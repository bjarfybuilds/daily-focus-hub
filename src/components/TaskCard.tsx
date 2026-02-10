import { useDraggable } from '@dnd-kit/core';
import { Task } from '@/types/tasks';
import { Trash2, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onDelete?: (id: string) => void;
  isDragOverlay?: boolean;
}

const priorityStyles: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-accent/15 text-accent',
  low: 'bg-muted text-muted-foreground',
};

export function TaskCard({ task, onDelete, isDragOverlay }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: isDragOverlay,
  });

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      className={cn(
        'glass rounded-lg p-3 group cursor-grab active:cursor-grabbing transition-all duration-200',
        isDragging && 'opacity-30 scale-95',
        isDragOverlay && 'shadow-xl scale-105 rotate-2',
      )}
      {...(!isDragOverlay ? { ...attributes, ...listeners } : {})}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
            {task.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase tracking-wide', priorityStyles[task.priority])}>
            {task.priority}
          </span>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
