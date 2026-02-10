import { useState } from 'react';
import { X } from 'lucide-react';

interface StatusLogModalProps {
  slotNumber: number;
  onSubmit: (accomplished: string, nextStep: string) => void;
}

export function StatusLogModal({ slotNumber, onSubmit }: StatusLogModalProps) {
  const [accomplished, setAccomplished] = useState('');
  const [nextStep, setNextStep] = useState('');

  const handleSubmit = () => {
    if (!accomplished.trim() || !nextStep.trim()) return;
    onSubmit(accomplished.trim(), nextStep.trim());
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/20 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 w-full max-w-md mx-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Sprint Log — Slot {slotNumber}</h3>
        </div>
        <p className="text-xs text-muted-foreground">⏰ 55 minutes reached. Log your progress to continue.</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
              What did you accomplish?
            </label>
            <textarea
              value={accomplished}
              onChange={e => setAccomplished(e.target.value)}
              placeholder="Describe what you got done..."
              className="w-full bg-secondary rounded-lg p-3 text-sm outline-none resize-none h-20 placeholder:text-muted-foreground/50"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">
              Next micro-step
            </label>
            <textarea
              value={nextStep}
              onChange={e => setNextStep(e.target.value)}
              placeholder="What's the very next action?"
              className="w-full bg-secondary rounded-lg p-3 text-sm outline-none resize-none h-20 placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!accomplished.trim() || !nextStep.trim()}
          className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-30 hover:bg-accent/90 transition-colors"
        >
          Log & Close Sprint
        </button>
      </div>
    </div>
  );
}
