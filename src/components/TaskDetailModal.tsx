import { useState } from 'react';
import { Task, TaskLogEntry, Priority, BUCKET_COLORS } from '@/types/tasks';
import { X, Plus, Clock, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onAddLogEntry: (taskId: string, text: string) => void;
}

const priorityStyles: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive',
  medium: 'bg-accent/15 text-accent',
  low: 'bg-muted text-muted-foreground',
};

export function TaskDetailModal({ task, onClose, onUpdateTask, onAddLogEntry }: TaskDetailModalProps) {
  const [description, setDescription] = useState(task.description);
  const [newLog, setNewLog] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const bucketColor = BUCKET_COLORS[task.bucketId];

  const handleSaveDescription = () => {
    onUpdateTask(task.id, { description });
    setIsEditingDesc(false);
  };

  const handleAddLog = () => {
    if (!newLog.trim()) return;
    onAddLogEntry(task.id, newLog.trim());
    setNewLog('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass rounded-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ borderTop: `3px solid hsl(${bucketColor})` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `hsl(${bucketColor} / 0.15)`, color: `hsl(${bucketColor})` }}
            >
              {task.bucketId}
            </span>
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase', priorityStyles[task.priority])}>
              {task.priority}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <h2 className="text-lg font-bold text-foreground">{task.title}</h2>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Description</label>
            {isEditingDesc ? (
              <div className="space-y-2">
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-secondary/50 rounded-lg p-2 text-sm text-foreground outline-none resize-none min-h-[80px] border border-border/30 focus:border-accent/50 transition-colors"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveDescription} className="text-xs font-medium text-accent hover:text-accent/80">Save</button>
                  <button onClick={() => { setDescription(task.description); setIsEditingDesc(false); }} className="text-xs text-muted-foreground">Cancel</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingDesc(true)}
                className="text-sm text-foreground/80 cursor-pointer hover:bg-secondary/30 rounded-lg p-2 transition-colors min-h-[40px]"
              >
                {task.description || <span className="text-muted-foreground/40 italic">Click to add description...</span>}
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Created {new Date(task.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Logbook */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Logbook</label>
              <span className="text-[10px] text-muted-foreground/50">{task.logEntries?.length || 0}</span>
            </div>

            {/* Add log entry */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Add a log entry..."
                value={newLog}
                onChange={e => setNewLog(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddLog()}
                className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none border border-border/30 focus:border-accent/50 transition-colors"
              />
              <button
                onClick={handleAddLog}
                className="p-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Log entries */}
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {(task.logEntries || []).slice().reverse().map(entry => (
                <div key={entry.id} className="glass-subtle rounded-lg p-2.5">
                  <p className="text-xs text-foreground">{entry.text}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {(!task.logEntries || task.logEntries.length === 0) && (
                <p className="text-[11px] text-muted-foreground/30 text-center py-3">No log entries yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
