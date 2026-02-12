import { useState } from 'react';
import { Task, TaskLogEntry, Priority, BUCKET_COLORS, BUCKETS } from '@/types/tasks';
import { X, Plus, Clock, BookOpen, Pencil, Check, ExternalLink, Link2, Trash2, Square, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onAddLogEntry: (taskId: string, text: string) => void;
  onDeleteTask?: (taskId: string) => void;
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

// Parse description for subtasks (lines starting with [ ] or [x])
function parseSubtasks(description: string): { text: string; checked: boolean; lineIndex: number }[] {
  const lines = description.split('\n');
  const subtasks: { text: string; checked: boolean; lineIndex: number }[] = [];
  lines.forEach((line, i) => {
    const unchecked = line.match(/^\s*\[\s*\]\s*(.+)/);
    const checked = line.match(/^\s*\[x\]\s*(.+)/i);
    if (unchecked) subtasks.push({ text: unchecked[1], checked: false, lineIndex: i });
    else if (checked) subtasks.push({ text: checked[1], checked: true, lineIndex: i });
  });
  return subtasks;
}

function toggleSubtask(description: string, lineIndex: number): string {
  const lines = description.split('\n');
  const line = lines[lineIndex];
  if (line.match(/^\s*\[\s*\]/)) {
    lines[lineIndex] = line.replace(/\[\s*\]/, '[x]');
  } else if (line.match(/^\s*\[x\]/i)) {
    lines[lineIndex] = line.replace(/\[x\]/i, '[ ]');
  }
  return lines.join('\n');
}

// Parse links from description (lines starting with @link or just URLs on their own line)
function parseLinks(description: string): { url: string; label: string }[] {
  const lines = description.split('\n');
  const links: { url: string; label: string }[] = [];
  lines.forEach(line => {
    const trimmed = line.trim();
    const urlMatch = trimmed.match(/^(https?:\/\/[^\s]+)$/);
    if (urlMatch) {
      try {
        const url = new URL(urlMatch[1]);
        links.push({ url: urlMatch[1], label: url.hostname });
      } catch {
        links.push({ url: urlMatch[1], label: urlMatch[1] });
      }
    }
  });
  return links;
}

export function TaskDetailModal({ task, onClose, onUpdateTask, onAddLogEntry, onDeleteTask }: TaskDetailModalProps) {
  const [description, setDescription] = useState(task.description);
  const [newLog, setNewLog] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editingLogText, setEditingLogText] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [editingSubtaskIndex, setEditingSubtaskIndex] = useState<number | null>(null);
  const [editingSubtaskText, setEditingSubtaskText] = useState('');
  const [newLink, setNewLink] = useState('');
  const [showAddLink, setShowAddLink] = useState(false);
  const bucketColor = BUCKET_COLORS[task.bucketId];
  const bucket = BUCKETS.find(b => b.id === task.bucketId);

  const subtasks = parseSubtasks(description);
  const links = parseLinks(description);

  const handleSaveDescription = () => {
    onUpdateTask(task.id, { description });
    setIsEditingDesc(false);
  };

  const handleToggleSubtask = (lineIndex: number) => {
    const newDesc = toggleSubtask(description, lineIndex);
    setDescription(newDesc);
    onUpdateTask(task.id, { description: newDesc });
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const line = `[ ] ${newSubtask.trim()}`;
    const newDesc = description ? `${description}\n${line}` : line;
    setDescription(newDesc);
    onUpdateTask(task.id, { description: newDesc });
    setNewSubtask('');
  };

  const handleAddLink = () => {
    if (!newLink.trim()) return;
    let url = newLink.trim();
    if (!url.startsWith('http')) url = `https://${url}`;
    const newDesc = description ? `${description}\n${url}` : url;
    setDescription(newDesc);
    onUpdateTask(task.id, { description: newDesc });
    setNewLink('');
    setShowAddLink(false);
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

  // Get non-subtask, non-link lines as "notes"
  const getNoteLines = () => {
    if (!description) return '';
    const lines = description.split('\n');
    return lines.filter(line => {
      const trimmed = line.trim();
      if (trimmed.match(/^\s*\[\s*\]/) || trimmed.match(/^\s*\[x\]/i)) return false;
      if (trimmed.match(/^https?:\/\/[^\s]+$/)) return false;
      return true;
    }).join('\n');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/10 backdrop-blur-sm" onClick={onClose}>
      <div
        className="surface-raised w-full max-w-lg mx-4 max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: `hsl(${bucketColor} / 0.12)`,
                color: `hsl(${bucketColor})`,
              }}
            >
              {bucket?.label || task.bucketId}
            </span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-secondary transition-colors flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <div className="px-5 pb-4">
          <h2 className="text-xl font-bold text-foreground">{task.title}</h2>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-5">

          {/* Links & Resources */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-accent uppercase tracking-wider">Links & Resources</span>
              <button
                onClick={() => setShowAddLink(!showAddLink)}
                className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {showAddLink && (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Paste URL..."
                  value={newLink}
                  onChange={e => setNewLink(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddLink()}
                  className="flex-1 bg-secondary/50 rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none border border-border focus:border-accent/50 transition-colors"
                  autoFocus
                />
                <button onClick={handleAddLink} className="text-xs font-medium text-accent px-2">Add</button>
              </div>
            )}
            {links.length > 0 ? (
              <div className="space-y-1">
                {links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-secondary/50 transition-colors group"
                  >
                    <Link2 className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="text-xs text-foreground truncate">{link.label}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground/40 italic pl-1">No links added</p>
            )}
          </div>

          {/* Subtasks / Checklist */}
          <div>
            <div className="space-y-0.5">
              {subtasks.map((st, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-1 py-2 rounded-lg hover:bg-secondary/30 transition-colors border-b border-border/40 last:border-b-0"
                >
                  <button
                    onClick={() => handleToggleSubtask(st.lineIndex)}
                    className="shrink-0"
                  >
                    {st.checked ? (
                      <CheckSquare className="w-4 h-4 text-accent" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </button>
                  {editingSubtaskIndex === st.lineIndex ? (
                    <input
                      type="text"
                      value={editingSubtaskText}
                      onChange={e => setEditingSubtaskText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          // Save the edited subtask text
                          const lines = description.split('\n');
                          const prefix = st.checked ? '[x] ' : '[ ] ';
                          lines[st.lineIndex] = prefix + editingSubtaskText.trim();
                          const newDesc = lines.join('\n');
                          setDescription(newDesc);
                          onUpdateTask(task.id, { description: newDesc });
                          setEditingSubtaskIndex(null);
                        } else if (e.key === 'Escape') {
                          setEditingSubtaskIndex(null);
                        }
                      }}
                      onBlur={() => {
                        const lines = description.split('\n');
                        const prefix = st.checked ? '[x] ' : '[ ] ';
                        lines[st.lineIndex] = prefix + editingSubtaskText.trim();
                        const newDesc = lines.join('\n');
                        setDescription(newDesc);
                        onUpdateTask(task.id, { description: newDesc });
                        setEditingSubtaskIndex(null);
                      }}
                      className="flex-1 bg-transparent text-sm text-foreground outline-none border-b border-accent/50 py-0.5"
                      autoFocus
                    />
                  ) : (
                    <span
                      className={cn(
                        'text-sm text-foreground cursor-pointer hover:text-accent transition-colors',
                        st.checked && 'line-through text-muted-foreground'
                      )}
                      onClick={() => {
                        setEditingSubtaskIndex(st.lineIndex);
                        setEditingSubtaskText(st.text);
                      }}
                    >
                      {st.text}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Add subtask inline */}
            <div className="flex items-center gap-3 mt-1 px-1">
              <Square className="w-4 h-4 text-muted-foreground/20 shrink-0" />
              <input
                type="text"
                placeholder="Add a subtask..."
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/30 outline-none py-2"
              />
            </div>
          </div>

          {/* Notes (free-form description) */}
          {isEditingDesc ? (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Notes</label>
              <textarea
                value={getNoteLines()}
                onChange={e => {
                  // Rebuild description: keep subtasks and links, replace note lines
                  const lines = description.split('\n');
                  const keptLines = lines.filter(line => {
                    const trimmed = line.trim();
                    return trimmed.match(/^\s*\[\s*\]/) || trimmed.match(/^\s*\[x\]/i) || trimmed.match(/^https?:\/\/[^\s]+$/);
                  });
                  const noteText = e.target.value;
                  const newDesc = noteText ? `${noteText}\n${keptLines.join('\n')}` : keptLines.join('\n');
                  setDescription(newDesc);
                }}
                className="w-full bg-secondary/50 rounded-xl p-3 text-sm text-foreground outline-none resize-none min-h-[80px] border border-border focus:border-accent/50 transition-colors"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={handleSaveDescription} className="text-xs font-medium text-accent hover:text-accent/80 px-3 py-1.5 rounded-lg bg-accent/10">Save</button>
                <button onClick={() => { setDescription(task.description); setIsEditingDesc(false); }} className="text-xs text-muted-foreground px-3 py-1.5">Cancel</button>
              </div>
            </div>
          ) : (
            getNoteLines().trim() ? (
              <div
                onClick={() => setIsEditingDesc(true)}
                className="text-sm text-foreground/80 cursor-pointer hover:bg-secondary/40 rounded-xl p-3 transition-colors whitespace-pre-wrap border border-transparent hover:border-border"
              >
                {linkify(getNoteLines())}
              </div>
            ) : null
          )}

          {/* Logbook */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Logbook</label>
              {(task.logEntries?.length || 0) > 0 && (
                <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">{task.logEntries?.length}</span>
              )}
            </div>

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

            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {(task.logEntries || []).slice().reverse().map(entry => (
                <div key={entry.id} className="rounded-xl p-3 surface-sunken group">
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

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Created {new Date(task.createdAt).toLocaleDateString()}
            </div>
            <span className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full', {
                'bg-destructive': task.priority === 'high',
                'bg-accent': task.priority === 'medium',
                'bg-muted-foreground/40': task.priority === 'low',
              })} />
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
            </span>
          </div>
          {onDeleteTask && (
            <button
              onClick={() => { onDeleteTask(task.id); onClose(); }}
              className="flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
