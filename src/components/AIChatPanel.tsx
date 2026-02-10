import { useState } from 'react';
import { X, Send, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AIChatPanel({ open, onClose }: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "I'm your Strategy Assistant. I can help you break down tasks, prioritize your day, or brainstorm on any of your 8 business pillars. What would you like to work on?" },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Placeholder — will connect to Lovable AI later
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "AI integration coming soon! I'll be powered by Lovable AI to help you strategize and break down tasks across all your business pillars."
      }]);
      setIsLoading(false);
    }, 800);
  };

  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-full max-w-md glass border-l border-border/50 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent/10">
            <Bot className="w-4 h-4 text-accent" />
          </div>
          <span className="text-sm font-semibold text-foreground">Strategy Assistant</span>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="p-1 rounded-lg bg-accent/10 h-fit mt-0.5">
                <Bot className="w-3 h-3 text-accent" />
              </div>
            )}
            <div className={cn(
              'max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-foreground'
            )}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="p-1 rounded-lg bg-secondary h-fit mt-0.5">
                <User className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2">
            <div className="p-1 rounded-lg bg-accent/10 h-fit">
              <Bot className="w-3 h-3 text-accent" />
            </div>
            <div className="bg-secondary rounded-xl px-3 py-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
          <input
            type="text"
            placeholder="Ask about strategy, tasks, priorities..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-1.5 rounded-lg bg-accent text-accent-foreground disabled:opacity-30 hover:bg-accent/90 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
