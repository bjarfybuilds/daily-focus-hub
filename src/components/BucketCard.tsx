import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Task, BucketId, BUCKETS, BUCKET_COLORS, Priority } from '@/types/tasks';
import { TaskCard } from './TaskCard';
import { Plus, X } from 'lucide-react';
import {
  DollarSign, Settings, FileText, Megaphone,
  Box, Globe, Palette, Music
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  DollarSign, Settings, FileText, Megaphone, Box, Globe, Palette, Music,
};

interface BucketCardProps {
  bucketId: BucketId;
  tasks: Task[];
  onAddTask: (bucketId: BucketId, title: string, description: string, priority: Priority) => void;
  onDeleteTask: (taskId: string) => void;
  onClickTask?: (task: Task) => void;
}

export function BucketCard({ bucketId, tasks, onAddTask, onDeleteTask, onClickTask }: BucketCardProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');

  const bucket = BUCKETS.find(b => b.id === bucketId)!;
  const Icon = iconMap[bucket.icon];
  const todoTasks = tasks.filter(t => t.column === 'todo');
  const bucketColor = BUCKET_COLORS[bucketId];

  const handleAdd = () => {
    if (!title.trim()) return;
    onAddTask(bucketId, title.trim(), desc.trim(), priority);
    setTitle('');
    setDesc('');
    setPriority('medium');
  };

  const { setNodeRef, isOver } = useDroppable({
    id: `bucket-${bucketId}`,
    data: { bucketId },
  });

  return (
    <div ref={setNodeRef} className={cn("surface-card p-3.5 flex flex-col h-full transition-all", isOver && "ring-2 ring-accent/30 bg-accent/5")}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `hsl(${bucketColor} / 0.12)` }}
          >
            {Icon && <Icon className="w-3.5 h-3.5" style={{ color: `hsl(${bucketColor})` }} />}
          </div>
          <span className="text-xs font-semibold text-foreground tracking-tight">{bucket.label}</span>
          {todoTasks.length > 0 && (
            <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
              {todoTasks.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        >
          {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="surface-sunken p-3 mb-3 space-y-2">
          <input
            type="text"
            placeholder="Task title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-full bg-transparent text-xs font-medium placeholder:text-muted-foreground/50 outline-none text-foreground"
            autoFocus
          />
          <input
            type="text"
            placeholder="Description..."
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full bg-transparent text-[11px] placeholder:text-muted-foreground/50 outline-none text-foreground"
          />
          <div className="flex items-center gap-1.5">
            {(['low', 'medium', 'high'] as Priority[]).map(p => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={cn(
                  'text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wide transition-all font-medium',
                  priority === p
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                )}
              >
                {p}
              </button>
            ))}
            <button onClick={handleAdd} className="ml-auto text-[10px] font-semibold text-accent hover:text-accent/80">Add</button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
        {todoTasks.map(task => (
          <TaskCard key={task.id} task={task} onDelete={onDeleteTask} onClick={onClickTask} />
        ))}
        {todoTasks.length === 0 && !showAdd && (
          <p className="text-[10px] text-muted-foreground/40 text-center py-4">No tasks</p>
        )}
      </div>
    </div>
  );
}
