import { useState } from 'react';
import { Task, BucketId, BUCKETS, Priority } from '@/types/tasks';
import { TaskCard } from './TaskCard';
import { Plus, X } from 'lucide-react';
import {
  DollarSign, Settings, FileText, Megaphone,
  Box, Globe, Palette, Music
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  DollarSign, Settings, FileText, Megaphone, Box, Globe, Palette, Music,
};

interface BucketCardProps {
  bucketId: BucketId;
  tasks: Task[];
  onAddTask: (bucketId: BucketId, title: string, description: string, priority: Priority) => void;
  onDeleteTask: (taskId: string) => void;
}

export function BucketCard({ bucketId, tasks, onAddTask, onDeleteTask }: BucketCardProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');

  const bucket = BUCKETS.find(b => b.id === bucketId)!;
  const Icon = iconMap[bucket.icon];
  const todoTasks = tasks.filter(t => t.column === 'todo');

  const handleAdd = () => {
    if (!title.trim()) return;
    onAddTask(bucketId, title.trim(), desc.trim(), priority);
    setTitle('');
    setDesc('');
    setPriority('medium');
  };

  return (
    <div className="glass rounded-xl p-3 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5 text-accent" />}
          <span className="text-xs font-semibold text-foreground tracking-tight">{bucket.label}</span>
          <span className="text-[10px] text-muted-foreground/50">{todoTasks.length}</span>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="p-1 rounded-md hover:bg-secondary transition-colors"
        >
          {showAdd ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="glass-subtle rounded-lg p-2 mb-2 space-y-1.5">
          <input
            type="text"
            placeholder="Task title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-full bg-transparent text-xs font-medium placeholder:text-muted-foreground/50 outline-none"
            autoFocus
          />
          <input
            type="text"
            placeholder="Description..."
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full bg-transparent text-[11px] placeholder:text-muted-foreground/50 outline-none"
          />
          <div className="flex items-center gap-1.5">
            {(['low', 'medium', 'high'] as Priority[]).map(p => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={cn(
                  'text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wide transition-all',
                  priority === p ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'
                )}
              >
                {p}
              </button>
            ))}
            <button onClick={handleAdd} className="ml-auto text-[10px] font-medium text-accent">Add</button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
        {todoTasks.map(task => (
          <TaskCard key={task.id} task={task} onDelete={onDeleteTask} />
        ))}
        {todoTasks.length === 0 && !showAdd && (
          <p className="text-[10px] text-muted-foreground/30 text-center py-4">No tasks</p>
        )}
      </div>
    </div>
  );
}
