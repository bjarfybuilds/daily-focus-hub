import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, User, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { BucketId, Priority, BUCKETS, Task } from '@/types/tasks';

interface Message {
  role: 'user' | 'assistant' | 'action';
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface StoreActions {
  tasks: Task[];
  slots: { slotNumber: number; task: Task | null }[];
  addTask: (bucketId: BucketId, title: string, description: string, priority: Priority) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  moveTaskToSlot: (taskId: string, slotNumber: number) => Promise<void>;
}

interface AIChatPanelProps {
  open: boolean;
  onClose: () => void;
  store: StoreActions;
}

export function AIChatPanel({ open, onClose, store }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "I'm your CHAT GSD assistant. I can create tasks, rename them, move them between buckets, set priorities, and more. Just tell me what you need!" },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const buildContext = useCallback(() => {
    const bucketTasks = BUCKETS.map(b => ({
      bucket: b.label,
      bucket_id: b.id,
      tasks: store.tasks.filter(t => t.bucketId === b.id).map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        status: t.column,
      })),
    }));

    const playbook = store.slots
      .filter(s => s.task)
      .map(s => ({
        slot: s.slotNumber,
        task_id: s.task!.id,
        title: s.task!.title,
        bucket: s.task!.bucketId,
      }));

    const emptySlots = store.slots.filter(s => !s.task).map(s => s.slotNumber);

    return { buckets: bucketTasks, playbook, empty_slots: emptySlots };
  }, [store.tasks, store.slots]);

  const executeToolCalls = useCallback(async (toolCalls: any[]) => {
    const results: string[] = [];

    for (const tc of toolCalls) {
      const fn = tc.function?.name;
      const args = JSON.parse(tc.function?.arguments || '{}');

      try {
        switch (fn) {
          case 'create_tasks': {
            for (const t of args.tasks) {
              await store.addTask(
                t.bucket_id as BucketId,
                t.title,
                t.description || '',
                (t.priority || 'medium') as Priority
              );
              results.push(`✓ Created "${t.title}" in ${BUCKETS.find(b => b.id === t.bucket_id)?.label || t.bucket_id}`);
            }
            break;
          }
          case 'rename_task': {
            await store.updateTask(args.task_id, { title: args.new_title });
            results.push(`✓ Renamed task to "${args.new_title}"`);
            break;
          }
          case 'delete_tasks': {
            for (const id of args.task_ids) {
              const task = store.tasks.find(t => t.id === id);
              await store.deleteTask(id);
              results.push(`✓ Deleted "${task?.title || id}"`);
            }
            break;
          }
          case 'move_task_to_slot': {
            await store.moveTaskToSlot(args.task_id, args.slot_number);
            const task = store.tasks.find(t => t.id === args.task_id);
            results.push(`✓ Moved "${task?.title || args.task_id}" to slot ${args.slot_number}`);
            break;
          }
          case 'update_task_priority': {
            await store.updateTask(args.task_id, { priority: args.priority as Priority });
            const task = store.tasks.find(t => t.id === args.task_id);
            results.push(`✓ Set "${task?.title || args.task_id}" priority to ${args.priority}`);
            break;
          }
          case 'move_task_to_bucket': {
            await store.updateTask(args.task_id, { bucketId: args.new_bucket_id as BucketId });
            const task = store.tasks.find(t => t.id === args.task_id);
            results.push(`✓ Moved "${task?.title || args.task_id}" to ${BUCKETS.find(b => b.id === args.new_bucket_id)?.label || args.new_bucket_id}`);
            break;
          }
          default:
            results.push(`⚠ Unknown action: ${fn}`);
        }
      } catch (err: any) {
        results.push(`✗ Failed: ${err.message}`);
      }
    }

    return results;
  }, [store]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    const chatMessages = [...messages, userMsg];
    setMessages(chatMessages);
    setInput('');
    setIsLoading(true);

    try {
      const apiMessages = chatMessages
        .filter(m => m.role !== 'action')
        .map(m => ({ role: m.role, content: m.content }));

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages, context: buildContext() }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      const data = await resp.json();
      const toolCalls = data.tool_calls;
      const textContent = data.message?.content;

      if (toolCalls && toolCalls.length > 0) {
        // Execute actions
        const results = await executeToolCalls(toolCalls);
        setMessages(prev => [...prev, { role: 'action', content: results.join('\n') }]);

        // If the AI also sent text, show it
        if (textContent) {
          setMessages(prev => [...prev, { role: 'assistant', content: textContent }]);
        } else {
          // Send tool results back for a natural follow-up
          const followUpMessages = [
            ...apiMessages,
            { role: 'assistant' as const, content: `I've completed these actions:\n${results.join('\n')}` },
          ];

          const followResp = await fetch(CHAT_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ messages: followUpMessages, context: buildContext() }),
          });

          if (followResp.ok) {
            const followData = await followResp.json();
            if (followData.message?.content) {
              setMessages(prev => [...prev, { role: 'assistant', content: followData.message.content }]);
            }
          }
        }
      } else if (textContent) {
        setMessages(prev => [...prev, { role: 'assistant', content: textContent }]);
      }
    } catch (e: any) {
      console.error('Chat error:', e);
      toast({ title: 'AI Error', description: e.message || 'Failed to get response', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col surface-raised border-l border-border" style={{ borderRadius: 0 }}>
      <div className="flex items-center justify-between p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-accent" />
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground block">AI Assistant</span>
            <span className="text-[10px] text-muted-foreground">Can take actions on your board</span>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-secondary transition-colors flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, i) => {
          if (msg.role === 'action') {
            return (
              <div key={i} className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-xl bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap bg-green-50 text-green-900 border border-green-200">
                  {msg.content}
                </div>
              </div>
            );
          }

          return (
            <div key={i} className={cn('flex gap-2.5', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-accent" />
                </div>
              )}
              <div className={cn(
                'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                msg.role === 'user'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-secondary text-foreground'
              )}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          );
        })}
        {isLoading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="bg-secondary rounded-2xl px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 border-t border-border">
        <div className="flex items-center gap-2 bg-secondary rounded-2xl px-4 py-2.5">
          <input
            type="text"
            placeholder="Try: 'Create 3 tasks in Finance'..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 text-foreground"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded-xl bg-accent text-accent-foreground disabled:opacity-30 hover:bg-accent/90 transition-colors flex items-center justify-center"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
