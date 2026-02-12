import { useState } from 'react';

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/10 backdrop-blur-sm">
      <div className="surface-raised p-6 w-full max-w-md mx-4 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">Sprint Log — Slot {slotNumber}</h3>
        </div>
        <p className="text-xs text-muted-foreground">⏰ 55 minutes reached. Log your progress to continue.</p>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              What did you accomplish?
            </label>
            <textarea
              value={accomplished}
              onChange={e => setAccomplished(e.target.value)}
              placeholder="Describe what you got done..."
              className="w-full bg-secondary rounded-xl p-3 text-sm outline-none resize-none h-20 placeholder:text-muted-foreground/50 text-foreground border border-border focus:border-accent/50 transition-colors"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              Next micro-step
            </label>
            <textarea
              value={nextStep}
              onChange={e => setNextStep(e.target.value)}
              placeholder="What's the very next action?"
              className="w-full bg-secondary rounded-xl p-3 text-sm outline-none resize-none h-20 placeholder:text-muted-foreground/50 text-foreground border border-border focus:border-accent/50 transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!accomplished.trim() || !nextStep.trim()}
          className="w-full py-3 rounded-2xl bg-accent text-accent-foreground text-sm font-semibold disabled:opacity-30 hover:bg-accent/90 transition-colors"
        >
          Log & Close Sprint
        </button>
      </div>
    </div>
  );
}
