import { useState } from 'react';
import { Task, TaskLogEntry, Priority, BUCKET_COLORS } from '@/types/tasks';
import { X, Plus, Clock, BookOpen, Pencil, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onAddLogEntry: (taskId: string, text: string) => void;
}

function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent underline underline-offset-2 hover:text-accent/80 inline-flex items-center gap-0.5"
        onClick={e => e.stopPropagation()}
      >
        {part.length > 45 ? part.slice(0, 45) + '…' : part}
        <ExternalLink className="w-2.5 h-2.5 inline" />
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function TaskDetailModal({ task, onClose, onUpdateTask, onAddLogEntry }: TaskDetailModalProps) {
  const [description, setDescription] = useState(task.description);
  const [newLog, setNewLog] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingLogText, setEditingLogText] = useState('');
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

  const handleEditLog = (entry: TaskLogEntry) => {
    setEditingLogId(entry.id);
    setEditingLogText(entry.text);
  };

  const handleSaveLog = () => {
    if (!editingLogId || !editingLogText.trim()) return;
    const updatedEntries = (task.logEntries || []).map(e =>
      e.id === editingLogId ? { ...e, text: editingLogText.trim() } : e
    );
    onUpdateTask(task.id, { logEntries: updatedEntries });
    setEditingLogId(null);
    setEditingLogText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/10 backdrop-blur-sm" onClick={onClose}>
      <div
        className="surface-raised w-full max-w-lg mx-4 max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: `hsl(${bucketColor})` }}
            />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {task.bucketId}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-secondary transition-colors flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title */}
          <h2 className="text-xl font-bold text-foreground">{task.title}</h2>

          {/* Description */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Description</label>
            {isEditingDesc ? (
              <div className="space-y-2">
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-secondary/50 rounded-xl p-3 text-sm text-foreground outline-none resize-none min-h-[100px] border border-border focus:border-accent/50 transition-colors"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveDescription} className="text-xs font-medium text-accent hover:text-accent/80 px-3 py-1.5 rounded-lg bg-accent/10">Save</button>
                  <button onClick={() => { setDescription(task.description); setIsEditingDesc(false); }} className="text-xs text-muted-foreground px-3 py-1.5">Cancel</button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingDesc(true)}
                className="text-sm text-foreground/80 cursor-pointer hover:bg-secondary/40 rounded-xl p-3 transition-colors min-h-[48px] whitespace-pre-wrap border border-transparent hover:border-border"
              >
                {task.description ? linkify(task.description) : <span className="text-muted-foreground/40 italic">Click to add description...</span>}
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              Created {new Date(task.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Logbook */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Logbook</label>
              {(task.logEntries?.length || 0) > 0 && (
                <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">{task.logEntries?.length}</span>
              )}
            </div>

            {/* Add log entry */}
            <div className="flex gap-2 mb-3">
              <textarea
                placeholder="Add a log entry..."
                value={newLog}
                onChange={e => setNewLog(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddLog();
                  }
                }}
                rows={2}
                className="flex-1 bg-secondary/50 rounded-xl px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none border border-border focus:border-accent/50 transition-colors resize-none"
              />
              <button
                onClick={handleAddLog}
                className="w-9 h-9 rounded-xl bg-accent/10 text-accent hover:bg-accent/15 transition-colors flex items-center justify-center self-end"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Log entries */}
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {(task.logEntries || []).slice().reverse().map(entry => (
                <div
                  key={entry.id}
                  className="rounded-xl p-3 surface-sunken group"
                >
                  {editingLogId === entry.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingLogText}
                        onChange={e => setEditingLogText(e.target.value)}
                        className="w-full bg-card rounded-xl p-2.5 text-xs text-foreground outline-none resize-none min-h-[60px] border border-border focus:border-accent/50 transition-colors"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button onClick={handleSaveLog} className="text-xs font-medium text-accent hover:text-accent/80 flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/10">
                          <Check className="w-3 h-3" /> Save
                        </button>
                        <button onClick={() => setEditingLogId(null)} className="text-xs text-muted-foreground px-2 py-1">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                        {linkify(entry.text)}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-muted-foreground/50">
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                        <button
                          onClick={() => handleEditLog(entry)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-card transition-all"
                        >
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {(!task.logEntries || task.logEntries.length === 0) && (
                <p className="text-[11px] text-muted-foreground/30 text-center py-4">No log entries yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
