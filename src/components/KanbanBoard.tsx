import { useState } from 'react';
import { Task, BucketId, KanbanColumn, Priority } from '@/types/tasks';
import { TaskCard } from './TaskCard';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KanbanBoardProps {
  bucketId: BucketId;
  bucketLabel: string;
  tasks: Task[];
  onAddTask: (bucketId: BucketId, title: string, description: string, priority: Priority) => void;
  onUpdateColumn: (taskId: string, column: KanbanColumn) => void;
  onDeleteTask: (taskId: string) => void;
}

const columns: { id: KanbanColumn; label: string }[] = [
  { id: 'todo', label: 'To-Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

export function KanbanBoard({ bucketId, bucketLabel, tasks, onAddTask, onUpdateColumn, onDeleteTask }: KanbanBoardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAddTask(bucketId, newTitle.trim(), newDesc.trim(), newPriority);
    setNewTitle('');
    setNewDesc('');
    setNewPriority('medium');
    setShowAddForm(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">{bucketLabel}</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {showAddForm && (
        <div className="glass rounded-lg p-3 mb-4 space-y-2">
          <input
            type="text"
            placeholder="Task title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="w-full bg-transparent text-sm font-medium placeholder:text-muted-foreground/50 outline-none"
            autoFocus
          />
          <input
            type="text"
            placeholder="Brief description..."
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            className="w-full bg-transparent text-xs placeholder:text-muted-foreground/50 outline-none"
          />
          <div className="flex items-center gap-2">
            {(['low', 'medium', 'high'] as Priority[]).map(p => (
              <button
                key={p}
                onClick={() => setNewPriority(p)}
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide transition-all',
                  newPriority === p ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground'
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={handleAdd}
              className="ml-auto text-xs font-medium text-accent hover:text-accent/80 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.column === col.id);
          return (
            <div key={col.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{col.label}</span>
                <span className="text-[10px] text-muted-foreground/60">{colTasks.length}</span>
              </div>
              <div className="space-y-1.5">
                {colTasks.map(task => (
                  <TaskCard key={task.id} task={task} onDelete={onDeleteTask} />
                ))}
                {colTasks.length === 0 && (
                  <div className="text-[11px] text-muted-foreground/40 py-2 text-center">No tasks</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
