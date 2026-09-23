import type { Feather } from '@expo/vector-icons';
import type { Dispatch, SetStateAction } from 'react';

export type FeatherIconName = keyof typeof Feather.glyphMap;

export interface ChecklistItem {
  label: string;
  done: boolean;
}

export interface UseScheduleSessionResult {
  /** Blocks the form until we know whether a call is already running. */
  checkingActive: boolean;

  title: string;
  setTitle: Dispatch<SetStateAction<string>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  scheduledTime: string;
  setScheduledTime: Dispatch<SetStateAction<string>>;
  duration: string;
  setDuration: Dispatch<SetStateAction<string>>;
  seats: string;
  setSeats: Dispatch<SetStateAction<string>>;
  coinPrice: string;
  setCoinPrice: Dispatch<SetStateAction<string>>;
  highlightedPrice: string;
  setHighlightedPrice: Dispatch<SetStateAction<string>>;
  refundThreshold: string;
  setRefundThreshold: Dispatch<SetStateAction<string>>;
  mode: 'video' | 'audio';
  setMode: Dispatch<SetStateAction<'video' | 'audio'>>;
  requiresApproval: boolean;
  setRequiresApproval: Dispatch<SetStateAction<boolean>>;

  creating: boolean;
  todayLabel: string;
  potential: string;
  missing: string[];
  canSchedule: boolean;
  checklist: ChecklistItem[];

  schedule: () => Promise<void>;
}
