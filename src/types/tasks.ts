export type BucketId = 'finance' | 'admin' | 'content' | 'ads' | 'product' | 'website' | 'branding' | 'music';

export type KanbanColumn = 'todo' | 'in-progress' | 'done';

export type Priority = 'low' | 'medium' | 'high';

export interface TaskLogEntry {
  id: string;
  text: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  column: KanbanColumn;
  bucketId: BucketId;
  createdAt: string;
  logEntries: TaskLogEntry[];
}

export interface PlaybookSlot {
  slotNumber: number;
  task: Task | null;
  timerState: 'idle' | 'running' | 'paused' | 'logging';
  timeRemaining: number; // seconds
}

export interface Bucket {
  id: BucketId;
  label: string;
  icon: string;
  tasks: Task[];
}

export const BUCKET_COLORS: Record<BucketId, string> = {
  finance: '142 71% 45%',    // green
  admin: '220 70% 55%',      // blue
  content: '35 90% 55%',     // orange
  ads: '340 75% 55%',        // pink/red
  product: '262 70% 60%',    // purple
  website: '190 80% 45%',    // teal
  branding: '45 95% 50%',    // gold/yellow
  music: '280 60% 55%',      // violet
};

export const BUCKETS: { id: BucketId; label: string; icon: string }[] = [
  { id: 'finance', label: 'Finance', icon: 'DollarSign' },
  { id: 'admin', label: 'Admin/Ops', icon: 'Settings' },
  { id: 'content', label: 'Content', icon: 'FileText' },
  { id: 'ads', label: 'Ads', icon: 'Megaphone' },
  { id: 'product', label: 'Product Dev', icon: 'Box' },
  { id: 'website', label: 'Website/UX', icon: 'Globe' },
  { id: 'branding', label: 'Branding', icon: 'Palette' },
  { id: 'music', label: 'Music (Bjarke)', icon: 'Music' },
];
