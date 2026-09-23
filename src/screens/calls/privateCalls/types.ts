import type {
  PrivateCallHistoryItem,
  PrivateCallRequestItem,
} from '@app-types/privateCall';

export interface UsePrivateCallsResult {
  acceptsPrivateCalls: boolean;
  pricePerMinute: string;
  setPricePerMinute: (value: string) => void;
  isSavingSettings: boolean;
  isLoadingSettings: boolean;

  requests: PrivateCallRequestItem[];
  busyRequestId: string | null;

  /** A call already running — the artist backed out without ending it. */
  activeCallId: string | null;

  history: PrivateCallHistoryItem[];
  isLoadingHistory: boolean;
  isLoadingMoreHistory: boolean;

  handleSaveSettings: () => Promise<void>;
  acceptRequest: (req: PrivateCallRequestItem) => Promise<void>;
  declineRequest: (req: PrivateCallRequestItem) => Promise<void>;
  /** Fired by `Screen` once the page itself is scrolled near its bottom. */
  handleHistoryEndReached: () => void;
}
