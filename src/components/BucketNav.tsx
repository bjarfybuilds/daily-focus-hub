import { BucketId, BUCKETS } from '@/types/tasks';
import { Task } from '@/types/tasks';
import {
  DollarSign, Settings, FileText, Megaphone,
  Box, Globe, Palette, Music
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  DollarSign, Settings, FileText, Megaphone, Box, Globe, Palette, Music,
};

interface BucketNavProps {
  activeBucket: BucketId | null;
  onSelectBucket: (id: BucketId | null) => void;
  tasks: Task[];
}

export function BucketNav({ activeBucket, onSelectBucket, tasks }: BucketNavProps) {
  return (
    <nav className="flex flex-col gap-1 p-2">
      {BUCKETS.map(bucket => {
        const Icon = iconMap[bucket.icon];
        const count = tasks.filter(t => t.bucketId === bucket.id).length;
        const isActive = activeBucket === bucket.id;

        return (
          <button
            key={bucket.id}
            onClick={() => onSelectBucket(isActive ? null : bucket.id)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-accent/10 text-accent'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            <span className="flex-1 text-left truncate">{bucket.label}</span>
            {count > 0 && (
              <span className={cn(
                'text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                isActive ? 'bg-accent/20 text-accent' : 'bg-secondary text-muted-foreground'
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
