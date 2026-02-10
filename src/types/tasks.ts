export type BucketId = 'finance' | 'admin' | 'content' | 'ads' | 'product' | 'website' | 'branding' | 'music';

export type KanbanColumn = 'todo' | 'in-progress' | 'done';

export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  column: KanbanColumn;
  bucketId: BucketId;
  createdAt: string;
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
